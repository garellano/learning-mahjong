function preferredEnglishVoice(voices) {
  const language = (voice) =>
    String(voice.lang || "")
      .replaceAll("_", "-")
      .toLowerCase();
  const american = voices.filter((voice) => language(voice) === "en-us");
  const english = voices.filter((voice) => /^en(?:-|$)/.test(language(voice)));
  const candidates = american.length ? american : english;
  return (
    candidates.find(
      (voice) => voice.localService && /samantha/i.test(voice.name),
    ) ||
    candidates.find((voice) => voice.localService) ||
    candidates.find((voice) => voice.default) ||
    candidates[0] ||
    null
  );
}

function speechError(code) {
  const messages = {
    unsupported:
      "Este navegador no tiene voz disponible. Prueba Safari en tu iPad o iPhone.",
    "not-allowed": "Toca Escuchar para activar la voz.",
    "language-unavailable":
      "No se pudo cargar una voz en inglés. Revisa las voces del dispositivo y vuelve a intentar.",
    "voice-unavailable": "No se pudo cargar la voz. Vuelve a tocar Escuchar.",
    timeout: "La voz tardó en responder. Vuelve a tocar Escuchar.",
  };
  const error = new Error(
    messages[code] || "No se pudo reproducir la voz. Vuelve a tocar Escuchar.",
  );
  error.code = code;
  return error;
}

/**
 * Short, on-demand pronunciation using the device's speech service.
 * Call speak() directly from a tap/click: iOS requires that user gesture.
 * Word boundaries are optional browser events, not phoneme/lip-sync data.
 */
export function createSpeechPlayer({
  synth = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  onState = () => {},
  onError = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  startTimeout = 8000,
} = {}) {
  const supported = Boolean(
    synth &&
      typeof synth.speak === "function" &&
      typeof synth.cancel === "function" &&
      typeof Utterance === "function",
  );
  let voices = [];
  let state = { id: null, phase: "idle" };
  let current = null;
  let generation = 0;
  let disposed = false;
  let removeVoiceListener = () => {};

  const isCurrent = (request) =>
    !disposed && current === request && generation === request.generation;

  function publish(next) {
    state = next;
    onState({ ...state });
  }

  function clearRequestTimer(request) {
    if (request?.timer !== null && request?.timer !== undefined) {
      clearTimer(request.timer);
      request.timer = null;
    }
  }

  function cancelCurrent() {
    const previous = current;
    // Invalidate first: Safari can deliver cancellation events synchronously.
    generation += 1;
    current = null;
    clearRequestTimer(previous);
    if (previous && supported) {
      try {
        synth.cancel();
      } catch {
        /* The next tap can retry a broken service. */
      }
    }
  }

  function finish(request, error = null) {
    if (!isCurrent(request)) return;
    current = null;
    generation += 1;
    clearRequestTimer(request);
    publish(
      error
        ? {
            id: request.id,
            text: request.text,
            slow: request.slow,
            phase: "error",
            error: error.code,
          }
        : {
            id: request.id,
            text: request.text,
            slow: request.slow,
            phase: "idle",
          },
    );
    if (error) onError(error);
  }

  function armTimeout(request, delay) {
    clearRequestTimer(request);
    request.timer = setTimer(() => {
      if (!isCurrent(request)) return;
      // A missing start/end event must not leave the interface busy forever.
      const error = speechError("timeout");
      cancelCurrent();
      publish({
        id: request.id,
        text: request.text,
        slow: request.slow,
        phase: "error",
        error: error.code,
      });
      onError(error);
    }, delay);
  }

  function refreshVoices() {
    try {
      voices = Array.from(synth?.getVoices?.() || []);
    } catch {
      voices = [];
    }
    if (current && state.phase === "loading" && !current.utterance.voice) {
      // Do not cancel/requeue here: that would lose the original iOS tap.
      current.utterance.voice = preferredEnglishVoice(voices);
    }
  }

  if (supported) {
    refreshVoices();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", refreshVoices);
      removeVoiceListener = () =>
        synth.removeEventListener("voiceschanged", refreshVoices);
    } else {
      const previous = synth.onvoiceschanged;
      const listener = (event) => {
        if (typeof previous === "function") previous.call(synth, event);
        refreshVoices();
      };
      synth.onvoiceschanged = listener;
      removeVoiceListener = () => {
        if (synth.onvoiceschanged === listener)
          synth.onvoiceschanged = previous;
      };
    }
  }

  function speak({ id, text, slow = false } = {}) {
    if (disposed || typeof text !== "string" || !text.trim()) return false;
    cancelCurrent();
    if (!supported) {
      const error = speechError("unsupported");
      publish({ id, text, slow, phase: "error", error: error.code });
      onError(error);
      return false;
    }

    refreshVoices();
    let utterance;
    try {
      utterance = new Utterance(text.trim());
      utterance.lang = "en-US";
      utterance.voice = preferredEnglishVoice(voices);
      utterance.rate = slow ? 0.65 : 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
    } catch {
      const error = speechError("synthesis-failed");
      publish({ id, text, slow, phase: "error", error: error.code });
      onError(error);
      return false;
    }

    const request = {
      id,
      text: text.trim(),
      slow: Boolean(slow),
      utterance,
      generation,
      timer: null,
    };
    current = request;

    function started() {
      if (!isCurrent(request) || state.phase === "speaking") return;
      // This is a bounded safety net for platforms that omit the end event.
      const playbackLimit = Math.min(
        60000,
        Math.max(
          6000,
          Math.ceil(request.text.length / (request.slow ? 7 : 11)) * 1000 +
            5000,
        ),
      );
      armTimeout(request, playbackLimit);
      publish({
        id,
        text: request.text,
        slow: request.slow,
        phase: "speaking",
      });
    }

    utterance.onstart = started;
    utterance.onboundary = (event) => {
      if (!isCurrent(request)) return;
      started();
      if (!isCurrent(request)) return;
      const charIndex = Math.max(0, Number(event.charIndex) || 0);
      const word =
        request.text.slice(charIndex).match(/[\p{L}\p{N}'’-]+/u)?.[0] || "";
      publish({
        id,
        text: request.text,
        slow: request.slow,
        phase: "speaking",
        word,
        charIndex,
        charLength: Number(event.charLength) || word.length,
      });
    };
    utterance.onend = () => finish(request);
    utterance.onerror = (event) => {
      const code = event?.error || "synthesis-failed";
      if (code === "canceled" || code === "interrupted") finish(request);
      else finish(request, speechError(code));
    };

    publish({ id, text: request.text, slow: request.slow, phase: "loading" });
    if (!isCurrent(request)) return false;
    armTimeout(request, startTimeout);
    try {
      // Keep this synchronous, even when getVoices() initially returns [].
      // cancel() does not unpause a previously paused platform speech queue.
      if (synth.paused && typeof synth.resume === "function") synth.resume();
      synth.speak(utterance);
    } catch {
      finish(request, speechError("synthesis-failed"));
      return false;
    }
    return true;
  }

  function stop() {
    if (disposed) return;
    cancelCurrent();
    if (state.phase !== "idle" || state.id !== null)
      publish({ id: null, phase: "idle" });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelCurrent();
    removeVoiceListener();
    if (state.phase !== "idle" || state.id !== null)
      publish({ id: null, phase: "idle" });
  }

  return {
    speak,
    stop,
    dispose,
    supported,
    getState: () => ({ ...state }),
    isSpeaking: () => state.phase === "loading" || state.phase === "speaking",
  };
}
