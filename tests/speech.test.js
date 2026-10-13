import test from "node:test";
import assert from "node:assert/strict";
import { createSpeechPlayer } from "../src/speech.js";

function fakeSpeech(voices = []) {
  const requests = [];
  const listeners = new Set();
  const timers = new Map();
  const callbacks = [];
  let cancelCount = 0;
  let currentVoices = voices;
  const states = [];
  const errors = [];
  const synth = {
    getVoices: () => currentVoices,
    speak: (utterance) => requests.push(utterance),
    cancel() {
      cancelCount += 1;
      requests.at(-1)?.onerror?.({ error: "interrupted" });
    },
    addEventListener(name, callback) {
      assert.equal(name, "voiceschanged");
      listeners.add(callback);
    },
    removeEventListener(name, callback) {
      assert.equal(name, "voiceschanged");
      listeners.delete(callback);
    },
  };
  class Utterance {
    constructor(text) {
      this.text = text;
      this.voice = null;
    }
  }
  const player = createSpeechPlayer({
    synth,
    Utterance,
    onState: (state) => states.push(state),
    onError: (error) => errors.push(error),
    setTimer(callback, delay) {
      const id = callbacks.push(callback);
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer: (id) => timers.delete(id),
  });
  return {
    player,
    synth,
    requests,
    states,
    errors,
    timers,
    listeners,
    cancels: () => cancelCount,
    voicesChanged(next) {
      currentVoices = next;
      for (const listener of listeners) listener();
    },
    fireTimer(id = timers.keys().next().value) {
      timers.delete(id);
      callbacks[id - 1]();
    },
  };
}

test("speech is on demand, selects an American local voice and keeps natural pitch when slow", () => {
  const spanish = {
    lang: "es-MX",
    name: "Paulina",
    localService: true,
    default: true,
  };
  const british = { lang: "en-GB", name: "Kate", localService: true };
  const remote = { lang: "en-US", name: "Remote", localService: false };
  const american = { lang: "en-US", name: "Samantha", localService: true };
  const t = fakeSpeech([spanish, british, remote, american]);
  assert.equal(t.requests.length, 0);
  assert.equal(t.player.supported, true);
  assert.equal(t.player.speak({ id: "dots", text: "Dots" }), true);
  assert.equal(t.requests[0].voice, american);
  assert.equal(t.requests[0].lang, "en-US");
  assert.equal(t.requests[0].rate, 0.9);
  assert.equal(t.requests[0].pitch, 1);
  t.player.speak({ id: "dots", text: "Dots", slow: true });
  assert.equal(t.requests[1].rate, 0.65);
  assert.equal(t.requests[1].pitch, 1);
  assert.equal(t.cancels(), 1);
  t.player.dispose();
});

test("American voice takes priority over a local British voice, English fallback never selects Spanish", () => {
  const spanish = { lang: "es-ES", localService: true, default: true };
  const british = { lang: "en-GB", localService: true };
  const american = { lang: "en_US", localService: false };
  const t = fakeSpeech([spanish, british, american]);
  t.player.speak({ text: "Bams" });
  assert.equal(t.requests[0].voice, american);
  t.voicesChanged([spanish, british]);
  t.player.speak({ text: "Bams" });
  assert.equal(t.requests[1].voice, british);
  t.voicesChanged([spanish]);
  t.player.speak({ text: "Bams" });
  assert.equal(t.requests[2].voice, null);
  assert.equal(t.requests[2].lang, "en-US");
  t.player.dispose();
});

test("empty initial voices do not delay the first tap or repeat it when voices load", () => {
  const t = fakeSpeech();
  t.player.speak({ id: "phrase", text: "Three dots" });
  const utterance = t.requests[0];
  assert.equal(t.requests.length, 1, "speech is submitted synchronously");
  assert.equal(utterance.voice, null);
  assert.equal(utterance.lang, "en-US");
  const voice = { lang: "en-US", localService: true };
  t.voicesChanged([voice]);
  assert.equal(utterance.voice, voice);
  assert.equal(t.requests.length, 1);
  assert.equal(t.cancels(), 0);
  utterance.onstart();
  assert.equal(t.player.getState().phase, "speaking");
  assert.equal(t.player.isSpeaking(), true);
  t.voicesChanged([{ lang: "en-US", localService: true, name: "Another" }]);
  assert.equal(utterance.voice, voice, "a voice does not change mid-phrase");
  t.player.dispose();
});

test("start, optional word boundaries and end update playback state", () => {
  const t = fakeSpeech();
  t.player.speak({ id: "phrase", text: "Three dots" });
  const utterance = t.requests[0];
  assert.equal(t.player.getState().phase, "loading");
  utterance.onstart();
  utterance.onboundary({ charIndex: 6, charLength: 4 });
  assert.deepEqual(t.player.getState(), {
    id: "phrase",
    text: "Three dots",
    slow: false,
    phase: "speaking",
    word: "dots",
    charIndex: 6,
    charLength: 4,
  });
  const copy = t.player.getState();
  copy.phase = "error";
  assert.equal(t.player.getState().phase, "speaking");
  utterance.onend();
  assert.equal(t.player.getState().phase, "idle");
  assert.equal(t.player.isSpeaking(), false);
  assert.equal(t.timers.size, 0);
  assert.equal(t.errors.length, 0);
  t.player.dispose();
});

test("repeat and stop ignore stale start, boundary, end, error and timeout callbacks", () => {
  const t = fakeSpeech();
  t.player.speak({ id: "dots", text: "Dots" });
  const first = t.requests[0];
  const firstTimer = t.timers.keys().next().value;
  t.player.speak({ id: "bams", text: "Bams" });
  const stateCount = t.states.length;
  first.onstart();
  first.onboundary({ charIndex: 0 });
  first.onend();
  first.onerror({ error: "network" });
  t.fireTimer(firstTimer);
  assert.equal(t.states.length, stateCount);
  assert.equal(t.player.getState().id, "bams");
  assert.equal(t.errors.length, 0);
  assert.equal(t.requests.length, 2);
  const second = t.requests[1];
  second.onstart();
  t.player.stop();
  const afterStop = t.states.length;
  second.onend();
  second.onerror({ error: "interrupted" });
  assert.equal(t.states.length, afterStop);
  assert.deepEqual(t.player.getState(), { id: null, phase: "idle" });
  assert.equal(t.timers.size, 0);
  assert.equal(t.errors.length, 0);
  t.player.dispose();
});

test("platform interruptions finish quietly and real errors are reported once", () => {
  for (const code of [
    "canceled",
    "interrupted",
    "not-allowed",
    "language-unavailable",
  ]) {
    const t = fakeSpeech();
    t.player.speak({ id: "dots", text: "Dots" });
    t.requests[0].onerror({ error: code });
    t.requests[0].onerror({ error: code });
    const canceled = code === "canceled" || code === "interrupted";
    assert.equal(t.player.getState().phase, canceled ? "idle" : "error");
    assert.equal(t.errors.length, canceled ? 0 : 1);
    if (!canceled) assert.equal(t.errors[0].code, code);
    assert.equal(t.timers.size, 0);
    t.player.dispose();
  }
});

test("unsupported synthesis fails gracefully without speaking or requesting permission", () => {
  const states = [];
  const errors = [];
  const player = createSpeechPlayer({
    synth: null,
    Utterance: null,
    onState: (state) => states.push(state),
    onError: (error) => errors.push(error),
  });
  assert.equal(player.supported, false);
  assert.equal(player.speak({ id: "dots", text: "Dots" }), false);
  assert.equal(states.at(-1).phase, "error");
  assert.equal(errors[0].code, "unsupported");
  player.dispose();
});

test("missing platform events have bounded startup and playback waits", () => {
  const t = fakeSpeech();
  t.player.speak({ text: "Dots" });
  assert.equal([...t.timers.values()][0].delay, 8000);
  t.fireTimer();
  assert.equal(t.player.getState().phase, "error");
  assert.equal(t.errors[0].code, "timeout");
  assert.equal(t.cancels(), 1);
  t.player.speak({ text: "Three dots" });
  t.requests[1].onstart();
  assert.ok([...t.timers.values()][0].delay <= 60000);
  t.fireTimer();
  assert.equal(t.errors.length, 2);
  assert.equal(t.player.isSpeaking(), false);
  assert.equal(t.timers.size, 0);
  t.player.dispose();
});

test("dispose clears timers and voice listeners and never revives playback", () => {
  const t = fakeSpeech();
  t.player.speak({ text: "Dots" });
  const utterance = t.requests[0];
  t.player.dispose();
  assert.equal(t.listeners.size, 0);
  assert.equal(t.timers.size, 0);
  const count = t.states.length;
  utterance.onstart();
  utterance.onend();
  t.player.stop();
  t.player.dispose();
  assert.equal(t.player.speak({ text: "Dots" }), false);
  assert.equal(t.requests.length, 1);
  assert.equal(t.states.length, count);
});

test("invalid text does not interrupt an existing pronunciation", () => {
  const t = fakeSpeech();
  t.player.speak({ text: "Dots" });
  assert.equal(t.player.speak({ text: "   " }), false);
  assert.equal(t.player.speak(), false);
  assert.equal(t.cancels(), 0);
  assert.equal(t.requests.length, 1);
  t.player.dispose();
});

test("a new tap resumes a paused platform queue before submitting speech", () => {
  const t = fakeSpeech();
  const order = [];
  t.synth.paused = true;
  t.synth.resume = () => {
    order.push("resume");
    t.synth.paused = false;
  };
  const speak = t.synth.speak;
  t.synth.speak = (utterance) => {
    order.push("speak");
    speak(utterance);
  };
  t.player.speak({ text: "Dots" });
  assert.deepEqual(order, ["resume", "speak"]);
  assert.equal(t.requests.length, 1);
  t.player.dispose();
});

test("disposal cannot be restarted from an observer's idle callback", () => {
  const t = fakeSpeech();
  let player;
  let attemptedRestart = null;
  player = createSpeechPlayer({
    synth: t.synth,
    Utterance: class {
      constructor(text) {
        this.text = text;
      }
    },
    onState(state) {
      if (state.phase === "idle")
        attemptedRestart = player.speak({ text: "Bams" });
    },
    setTimer: () => 1,
    clearTimer: () => {},
  });
  player.speak({ text: "Dots" });
  player.dispose();
  assert.equal(attemptedRestart, false);
  assert.equal(t.requests.length, 1);
  assert.equal(player.isSpeaking(), false);
  t.player.dispose();
});
