import { LESSONS } from "./lessons.js";
import { tileHTML as renderTile, tileLabel } from "./tiles.js";
import { captureTiles, animateTiles, cancelTileMotion } from "./motion.js";
import { createTurnPlayer } from "./turn-player.js";
import { VOCAB, LISTENING_LESSONS } from "./english.js";
import { createSpeechPlayer } from "./speech.js";
import { createSoundPlayer, resolveSoundPreference } from "./sounds.js";
import { renderEnglishHome, renderListeningLesson } from "./listening-ui.js";
import { selectionImpact, lessonHint, selectionFeedback } from "./guidance.js";
import { createReadinessRound, evaluateReadiness } from "./readiness.js";
import { renderReadiness } from "./readiness-ui.js";
import {
  TRAINING_PATTERNS,
  createWall,
  newGame,
  passTiles,
  drawTile,
  discardTile,
  claimDiscard,
  skipClaim,
  declareMahjong,
  exchangeJoker,
  analyzeHand,
  rankPatterns,
  suggestDiscard,
  advanceBotStep,
} from "./engine.js";

const $ = (s) => document.querySelector(s);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const KEY = "mahjong-a-tu-ritmo-v1";
function readSaved() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
const saved = readSaved();
const profile = {
  name: "Gaby",
  completed: [],
  steps: {},
  attempts: {},
  personalPatterns: [],
  listeningSteps: {},
  listeningCompleted: [],
  audioHeard: [],
  decisionPractice: {
    variant: 0,
    index: 0,
    results: [],
    failures: {},
    helped: {},
  },
  ...saved.profile,
  sound: resolveSoundPreference(saved.profile),
};
let game = saved.game || null;
let lang = saved.lang || "es";
let botPaused = saved.botPaused || false;
const tileHTML = (kind, options = {}) => renderTile(kind, { lang, ...options });
let selected = new Set();
let chosen = null;
let feedback = null;
let showHint = false;
let hintMarked = false;
let lessonHintVisible = false;
let readinessChoice = null;
let readinessReason = null;
let readinessFeedback = null;
let editorOpen = false;
let draft = [];
let editorKind = "c1";
let toastTimer;
let priorFocus;
let listeningChoice = null;
let listeningFeedback = null;
let listeningShowText = false;
let vocabularyCategory = "tile";
let vocabularyExpanded = false;
const listenedSteps = new Set();
let speechState = { id: null, phase: "idle" };
// Visual feedback belongs to this visit, never to the saved game or its rules.
let tableChange = null;
const icons = {
  arrow:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h15M13 5l7 7-7 7"/></svg>',
  spark:
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z"/></svg>',
  sound:
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14"/></svg>',
  settings:
    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="#f8f6ef"/><circle cx="15" cy="17" r="3" fill="#f8f6ef"/></svg>',
  back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 12H5m6-6-6 6 6 6"/></svg>',
};
const en = () => lang === "en";
const tr = (es, enText) => (en() ? enText : es);
const effects = createSoundPlayer({
  enabled: () => profile.sound,
  ducked: () => speech.isSpeaking(),
});
const speech = createSpeechPlayer({
  onState: updateSpeechUI,
  onError: (error) => toast(error.message),
});
function currentListening() {
  const lesson =
    LISTENING_LESSONS.find((item) => item.id === route()[1]) ||
    LISTENING_LESSONS[0];
  const index = Math.min(
    profile.listeningSteps[lesson.id] || 0,
    lesson.steps.length,
  );
  return {
    lesson,
    index,
    step: lesson.steps[index],
    key: lesson.id + "/" + index,
  };
}
function updateSpeechUI(state = speechState) {
  speechState = state;
  const busy = state.phase === "loading" || state.phase === "speaking";
  document.querySelectorAll("[data-voice-id]").forEach((card) => {
    const active = busy && card.dataset.voiceId === state.id;
    card.classList.toggle("is-speaking", active && state.phase === "speaking");
    card.classList.toggle("is-loading", active && state.phase === "loading");
  });
  document.querySelectorAll("[data-speak]").forEach((button) => {
    const active =
      busy &&
      button.dataset.speak === state.id &&
      (button.dataset.slow === "true") === !!state.slow;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("is-playing", active);
  });
  document.querySelectorAll("[data-voice-status]").forEach((label) => {
    const active = label.dataset.voiceStatus === state.id;
    const statusText =
      active && state.phase === "loading"
        ? "Preparando la voz…"
        : active && state.phase === "speaking"
          ? state.slow
            ? "Escuchando más despacio…"
            : "Escuchando en inglés…"
          : active && state.phase === "error"
            ? "Puedes volver a intentarlo o mostrar la palabra."
            : "Puedes escuchar otra vez y repetir en voz alta.";
    if (label.textContent !== statusText) label.textContent = statusText;
  });
  document.querySelectorAll('[data-action="voice-stop"]').forEach((button) => {
    button.disabled = !busy;
  });
  if (
    state.phase === "speaking" &&
    state.id &&
    !profile.audioHeard.includes(state.id)
  ) {
    profile.audioHeard.push(state.id);
    save();
  }
  if (state.phase === "speaking" && route()[0] === "escuchar") {
    const current = currentListening();
    if (current.step?.audioId === state.id) listenedSteps.add(current.key);
  }
  if (route()[0] === "escuchar") {
    const heard = listenedSteps.has(currentListening().key);
    const check = $('[data-action="listening-check"]');
    if (check)
      check.disabled =
        !listeningChoice ||
        !(
          heard ||
          listeningShowText ||
          listeningFeedback ||
          !speech.supported ||
          state.phase === "error"
        );
    if (heard && !listeningFeedback) {
      const note = $(".listening-answer-note");
      if (note)
        note.textContent =
          "Elige una opción. Puedes escuchar otra vez antes de decidir.";
    }
  }
  const heardCount = $(".listening-heard");
  if (heardCount)
    heardCount.textContent = `${VOCAB.filter((word) => profile.audioHeard.includes(word.id)).length} de ${VOCAB.length} sonidos explorados`;
  turnPlayer.sync();
}
function speakVocabulary(id, slow = false) {
  effects.stop();
  if (id === "table-instruction")
    return speech.speak({ id, text: gameMessage(), slow });
  const word = VOCAB.find((item) => item.id === id);
  if (word) speech.speak({ id, text: word.speech || word.en, slow });
}
function checkListening() {
  const { step, key } = currentListening();
  if (!step || !listeningChoice)
    return toast("Elige el dibujo o significado que escuchaste.");
  if (
    speech.supported &&
    !listenedSteps.has(key) &&
    !listeningShowText &&
    speechState.phase !== "error"
  )
    return toast(
      "Primero toca Escuchar. También puedes mostrar la palabra como ayuda.",
    );
  if (!speech.supported || speechState.phase === "error")
    listeningShowText = true;
  speech.stop();
  listeningFeedback = { ok: listeningChoice === step.answerId };
  tone(listeningFeedback.ok);
  render();
}
function currentReadiness() {
  const practice = profile.decisionPractice;
  const round = createReadinessRound(practice.variant);
  const index = Math.min(practice.index, round.steps.length);
  return { practice, round, index, step: round.steps[index] };
}
function readinessPage() {
  const { practice, round, index, step } = currentReadiness();
  return renderReadiness({
    round,
    index,
    choice: readinessChoice,
    reason: readinessReason,
    feedback: readinessFeedback,
    hintUsed: !!practice.helped[step?.id],
    results: practice.results,
  });
}
function checkReadiness() {
  const { practice, step } = currentReadiness();
  if (!step || !readinessChoice || !readinessReason)
    return toast("Elige tu decisión y el motivo antes de comprobar.");
  readinessFeedback = evaluateReadiness(step, {
    choice: readinessChoice,
    reason: readinessReason,
  });
  practice.failures ||= {};
  if (!readinessFeedback.ok)
    practice.failures[step.id] = (practice.failures[step.id] || 0) + 1;
  save();
  tone(readinessFeedback.ok);
  render();
  $(".readiness-feedback")?.scrollIntoView({ block: "nearest" });
}
function nextReadiness() {
  if (!readinessFeedback?.ok) return;
  const { practice, step } = currentReadiness();
  practice.results.push({
    stepId: step.id,
    attempts: (practice.failures?.[step.id] || 0) + 1,
    hintUsed: !!practice.helped[step.id],
    ok: true,
  });
  practice.index += 1;
  save();
  resetInteraction();
  render();
  $("#main")?.focus();
  window.scrollTo(0, 0);
}
function moveListening(action) {
  const { lesson, index } = currentListening();
  if (action === "listening-next" && !listeningFeedback?.ok) return;
  speech.stop();
  const next =
    action === "listening-repeat"
      ? 0
      : Math.max(
          0,
          Math.min(
            lesson.steps.length,
            index + (action === "listening-back" ? -1 : 1),
          ),
        );
  profile.listeningSteps[lesson.id] = next;
  if (
    next === lesson.steps.length &&
    !profile.listeningCompleted.includes(lesson.id)
  )
    profile.listeningCompleted.push(lesson.id);
  save();
  resetInteraction();
  render();
  $("#main")?.focus();
  window.scrollTo(0, 0);
}
function lessonAudio(ids = []) {
  return `<aside class="lesson-audio-strip"><h3>Escúchalo y prueba decirlo.</h3><p>Oye cada palabra a tu ritmo. Puedes repetirla en voz alta.</p>${ids
    .map((id) => {
      const word = VOCAB.find((item) => item.id === id);
      return `<div class="voice-card" data-voice-id="${esc(id)}"><strong lang="en">${esc(word.en)}</strong><div class="voice-buttons"><button type="button" class="btn secondary" data-speak="${esc(id)}" ${speech.supported ? "" : "disabled"}>Escuchar</button><button type="button" class="text-button" data-speak="${esc(id)}" data-slow="true" ${speech.supported ? "" : "disabled"}>Más despacio</button></div></div>`;
    })
    .join(
      "",
    )}<a class="text-button" href="#repaso">Practicar con el oído y los dibujos →</a></aside>`;
}
const turnPlayer = createTurnPlayer({
  delay: 850,
  shouldRun: () =>
    route()[0] === "mesa" &&
    game?.phase === "bots" &&
    !botPaused &&
    !speech.isSpeaking() &&
    !document.hidden &&
    !$("#modal"),
  step: playBotStep,
  onError: (error) => {
    botPaused = true;
    save();
    render();
    toast(
      tr(error.message, "The round has paused. You can resume when ready."),
    );
  },
});
function botEventMessage(event, locale = lang) {
  const t = (es, enText) => (locale === "en" ? enText : es);
  if (!event)
    return t(
      "Ahora juegan tus compañeras, una por una.",
      "Your opponents now play, one at a time.",
    );
  const name = game.players[event.player]?.name || "";
  if (event.type === "turn")
    return event.player === 0
      ? t(
          `Ahora es tu turno, ${profile.name}. Toma una ficha de la pared.`,
          `Your turn, ${profile.name}. Pick a tile from the wall.`,
        )
      : t(
          `Turno de ${name}. Mira cómo toma y descarta.`,
          `${name}’s turn. Watch her pick and discard.`,
        );
  if (event.type === "draw")
    return t(
      `${name} toma una ficha de la pared. Su ficha queda oculta.`,
      `${name} picks a tile from the wall. Her tile stays hidden.`,
    );
  if (event.type === "discard")
    return t(
      `${name} descarta ${tileLabel(event.tile.kind, locale)}. Mira la ficha con borde dorado.`,
      `${name} discards ${tileLabel(event.tile.kind, locale)}. Look for its gold border.`,
    );
  if (event.type === "claim")
    return t(
      `${name} reclama ${tileLabel(event.tile.kind, locale)} y muestra un grupo. Después debe descartar.`,
      `${name} calls ${tileLabel(event.tile.kind, locale)} and exposes a group. She must discard next.`,
    );
  if (event.type === "claim-option")
    return t(
      "Esa ficha puede servirte. La ronda espera tu decisión.",
      "That tile may help you. The round is waiting for your decision.",
    );
  if (event.type === "win")
    return t(
      `¡Mahjong! ${name} completó su combinación.`,
      `Mahjong! ${name} completed her hand.`,
    );
  return t(
    "La pared se terminó. Puedes comenzar otra mano.",
    "The wall is empty. You can start another hand.",
  );
}
function playBotStep() {
  const before = gameSnapshot();
  advanceBotStep(game);
  if (["draw", "discard", "claim", "win"].includes(game.botEvent?.type)) {
    tone(game.botEvent.type === "claim" ? "success" : game.botEvent.type);
  }
  save();
  render(trackGameChange("bot-step", before));
  announceChange();
}
function opponentHTML(player, index) {
  const active = game.phase === "bots" && game.turn === index;
  const event =
    active && game.botEvent?.player === index ? game.botEvent : null;
  const labels = {
    turn: tr("Su turno", "Her turn"),
    draw: tr("Toma de la pared", "Picks from wall"),
    discard: tr("Descarta", "Discards"),
    claim: tr("Reclama y muestra", "Calls and exposes"),
  };
  return `<div class="opponent ${active ? "is-active" : ""}" id="opponent-${index}" ${active ? 'aria-current="step"' : ""}><span class="avatar">${esc(player.name[0])}</span><strong>${esc(player.name)}</strong><small class="turn-label">${active ? labels[event?.type] || tr("Su turno", "Her turn") : tr("En espera", "Waiting")}</small><div class="backs" aria-label="${player.hand.length} ${tr("fichas ocultas", "hidden tiles")}">${player.hand.map((_, i) => `<i${event?.type === "draw" && i === player.hand.length - 1 ? ' class="just-drawn"' : ""}></i>`).join("")}</div>${player.exposed.map((g, j) => exposureHTML(g, index, j)).join("")}</div>`;
}
function turnControls() {
  if (game.phase !== "bots") return "";
  return `<div class="turn-controls"><span>${botPaused ? tr("Ronda en pausa", "Round paused") : tr("Las compañeras juegan una por una", "Opponents play one at a time")}</span><button type="button" data-action="pause-turns" aria-pressed="${botPaused}">${botPaused ? tr("Continuar ronda", "Resume round") : tr("Pausar", "Pause")}</button></div>`;
}
function gameTile(tile, options = {}, track = true) {
  const recent = track && !!tableChange?.ids.has(tile.id);
  return tileHTML(tile.kind, {
    id: tile.id,
    motionId: track ? tile.id : "",
    recent,
    recentLabel: recent ? tr(tableChange.label.es, tableChange.label.en) : "",
    ...options,
  });
}
function changeMessage() {
  return tableChange ? tr(tableChange.message.es, tableChange.message.en) : "";
}
function announceChange() {
  $("#table-announcement").textContent = changeMessage();
}
function trackGameChange(action, before, details = {}) {
  const hand = game.players[0].hand;
  const incoming = hand.filter((t) => !before.hand.has(t.id));
  const exposed = game.players.flatMap((p) =>
    p.exposed.flatMap((g) => g.tiles),
  );
  const newlyExposed = exposed.filter((t) => !before.exposed.has(t.id));
  const newDiscards = game.discards.filter(
    (d) => !before.discards.has(d.tile.id),
  );
  let ids = incoming.map((t) => t.id);
  let label = { es: "Recién recibida", en: "Newly received" };
  let message;
  let incomingIds;
  if (action === "bot-step") {
    ids = [
      ...newDiscards.map((d) => d.tile.id),
      ...newlyExposed.map((t) => t.id),
    ];
    incomingIds = [...ids];
    label = {
      es: "Ficha del último movimiento visible",
      en: "Tile from the latest visible move",
    };
    message = {
      es: botEventMessage(game.botEvent, "es"),
      en: botEventMessage(game.botEvent, "en"),
    };
    if (!ids.length && tableChange) {
      ids = [...tableChange.ids];
      label = tableChange.label;
    }
  } else if (action === "pass") {
    const to = ["a la derecha", "enfrente", "a la izquierda"][
      details.passIndex
    ];
    const from = ["de la izquierda", "de enfrente", "de la derecha"][
      details.passIndex
    ];
    const toEn = ["to the right", "across", "to the left"][details.passIndex];
    const fromEn = ["from the left", "from across", "from the right"][
      details.passIndex
    ];
    message = {
      es: `Pasaste 3 ${to} y recibiste ${incoming.length} ${from}. Las recién llegadas tienen borde dorado.`,
      en: `You passed 3 ${toEn} and received ${incoming.length} ${fromEn}. New arrivals have a gold border.`,
    };
  } else if (action === "draw") {
    label = {
      es: "Recién tomada de la pared",
      en: "Just picked from the wall",
    };
    message = incoming.length
      ? {
          es: "Tomaste una ficha de la pared. Su borde dorado te ayuda a encontrarla.",
          en: "You picked a tile from the wall. Look for its gold border.",
        }
      : {
          es: "La pared se terminó. Esta mano acaba sin ganadora; puedes empezar otra.",
          en: "The wall is empty. This hand ends without a winner; you can start another.",
        };
  } else if (action === "exchange") {
    ids = [...ids, ...details.exchangeIds];
    label = {
      es: "Ficha del último cambio de comodín",
      en: "Tile from the latest Joker swap",
    };
    message = {
      es: "Tu ficha fue al grupo mostrado y el comodín llegó a tu mano. Ambos están marcados.",
      en: "Your tile went to the exposed group and the Joker came into your hand. Both are marked.",
    };
  } else if (action === "claim") {
    ids = newlyExposed.map((t) => t.id);
    label = { es: "Grupo recién mostrado", en: "Newly exposed group" };
    message = {
      es: "El descarte y tus fichas se juntaron arriba: ese grupo ya quedó mostrado.",
      en: "The discard and your tiles moved together above your hand: the group is now exposed.",
    };
  } else if (action === "win") {
    ids = game.winningClaimTileId ? [game.winningClaimTileId] : [];
    label = {
      es: "Ficha que completó Mahjong",
      en: "Tile that completed Mahjong",
    };
    message = {
      es: "¡Mahjong! Tu combinación está completa.",
      en: "Mahjong! Your hand is complete.",
    };
  } else {
    ids = [
      ...newDiscards.map((d) => d.tile.id),
      ...newlyExposed.map((t) => t.id),
    ];
    label = {
      es: "Ficha del movimiento más reciente",
      en: "Tile from the latest move",
    };
    message =
      action === "discard"
        ? {
            es: "Tu ficha fue a los descartes. Ahora observa cómo juegan tus compañeras.",
            en: "Your tile moved to the discards. Watch your opponents play next.",
          }
        : {
            es: "Dejaste pasar la ficha. La ronda continúa, una compañera a la vez.",
            en: "You passed on the tile. The round continues, one opponent at a time.",
          };
  }
  tableChange = { ids: new Set(ids), label, message };
  return {
    action,
    incomingIds: incomingIds ?? ids,
    drawPlayer:
      action === "bot-step" && game.botEvent?.type === "draw"
        ? game.botEvent.player
        : null,
    outgoingIds: action === "pass" ? details.outgoingIds || [] : [],
    direction: ["right", "across", "left"][details.passIndex] || "right",
  };
}
function gameSnapshot() {
  return {
    hand: new Set(game.players[0].hand.map((t) => t.id)),
    exposed: new Set(
      game.players
        .flatMap((p) => p.exposed.flatMap((g) => g.tiles))
        .map((t) => t.id),
    ),
    discards: new Set(game.discards.map((d) => d.tile.id)),
  };
}
function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ profile, game, lang, botPaused }),
    );
  } catch {
    toast("Tu navegador no pudo guardar el progreso. Puedes seguir jugando.");
  }
}
function tone(value = true) {
  return effects.play(
    typeof value === "string" ? value : value ? "success" : "retry",
  );
}
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4200);
}
function route() {
  return (location.hash.slice(1) || "inicio").split("/");
}
function go(hash) {
  if (location.hash === "#" + hash) {
    speech.stop();
    resetInteraction();
    render();
    window.scrollTo(0, 0);
  } else location.hash = hash;
}
function resetInteraction() {
  selected.clear();
  chosen = null;
  feedback = null;
  listeningChoice = null;
  listeningFeedback = null;
  listeningShowText = false;
  lessonHintVisible = false;
  readinessChoice = null;
  readinessReason = null;
  readinessFeedback = null;
}
function navLink(id, label, symbol) {
  const active =
    route()[0] === id ||
    (id === "repaso" && route()[0] === "escuchar") ||
    (id === "inicio" && ["leccion", "practica"].includes(route()[0]));
  return `<a href="#${id}" class="${active ? "active" : ""}" ${active ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${symbol}</span>${label}</a>`;
}
function frame(body) {
  return `<header class="app-header"><a class="brand" href="#inicio" aria-label="Mahjong, a tu ritmo. Inicio"><img src="./assets/icon.svg" alt=""><span>mahjong<small>a tu ritmo</small></span></a><nav class="nav" aria-label="Navegación principal">${navLink("inicio", "Mi camino", "⌂")}${navLink("mesa", "La mesa", "▦")}${navLink("tarjeta", "Mi tarjeta", "▤")}${navLink("repaso", "El inglés", "Aa")}</nav><div class="header-actions"><button class="icon-button" data-action="sound" aria-label="${profile.sound ? "Desactivar" : "Activar"} sonidos" aria-pressed="${profile.sound}" title="Sonido ${profile.sound ? "activado" : "desactivado"}">${icons.sound}${profile.sound ? "" : '<span class="hide">apagado</span>'}</button><button class="icon-button" data-action="settings" aria-label="Mis preferencias">${icons.settings}</button></div></header><main id="main" class="shell" tabindex="-1">${body}</main><footer class="app-footer"><span>Hecho para aprender, disfrutar y volver a intentar.<br>Tu progreso se guarda en este navegador. Sin cuentas ni anuncios.</span><span>Mahjong Americano · <a href="https://www.nationalmahjonggleague.org/" target="_blank" rel="noopener">National Mah Jongg League ↗</a><br>Ejercicios propios · Sin afiliación con NMJL</span></footer>`;
}
const symbols = ["◎", "❧", "▤", "↗", "↻", "✧", "Aa"];
function home() {
  const done = profile.completed.length;
  const next =
    LESSONS.find((l) => !profile.completed.includes(l.id)) || LESSONS[0];
  const practiceNext =
    profile.completed.includes("estrategia") &&
    profile.decisionPractice.index < 4;
  const nextPath = practiceNext ? "practica" : "leccion/" + next.id;
  return `<section class="hero"><div><span class="eyebrow">HOLA, ${esc(profile.name)} · ESTE MOMENTO ES PARA TI</span><h1>Una ficha a la vez.<br><em>Y cada vez, mejor.</em></h1><p>Un nuevo reto, sin ninguna prisa. Aprende Mahjong Americano jugando, con pasos pequeños y ayuda cuando la quieras.</p><div class="button-row"><a class="btn" href="#${nextPath}">${done ? "Continuar mi camino" : "Vamos con el primer reto"} ${icons.arrow}</a></div><div class="hero-meta"><span>Desde cero</span><span>Primero en español</span><span>A tu ritmo</span></div></div><div class="hero-visual" aria-hidden="true"><span class="spark a">✧</span><span class="spark b">✧</span><div class="oval-table"><div class="tile-fan">${["b3", "c5", "f"].map((k) => tileHTML(k, { disabled: true })).join("")}</div></div><div class="floating-note"><span class="check">✓</span><div><b>Pequeños retos. Grandes avances.</b>Hoy solo necesitas dar el primer paso.</div></div></div></section><section aria-labelledby="path-heading"><div class="section-line"><div><h2 id="path-heading">Tu camino a la mesa</h2><p>Un reto a la vez. Puedes repetir o explorar cualquier fase.</p></div><div class="progress-note">${done} de ${LESSONS.length} fases<div class="progress-track" role="progressbar" aria-label="Fases completadas" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${LESSONS.length}"><span style="width:${(done / LESSONS.length) * 100}%"></span></div></div></div><div class="course-grid">${LESSONS.map((l, i) => `<a class="course-card ${profile.completed.includes(l.id) ? "completed" : ""}" href="#leccion/${l.id}"><div class="card-top"><span>FASE ${String(i + 1).padStart(2, "0")}</span>${profile.completed.includes(l.id) ? '<span class="check" aria-label="Completada">✓</span>' : `<span>${l.minutes} MIN</span>`}</div><span class="course-symbol" aria-hidden="true">${symbols[i]}</span><h3>${esc(l.title)}</h3><p>${esc(l.subtitle)}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`).join("")}<a class="course-card practice-card" href="#mesa"><div class="card-top"><span>TU ESPACIO DE PRÁCTICA</span><span>↗</span></div><h3>¿Y si ya<br>jugamos?</h3><p>Tu mesa, tres compañeras<br>y una guía a tu lado.</p><span class="card-arrow">${icons.arrow}</span></a></div></section><section class="notice autonomy-invitation"><h2>¿Qué decidirías tú?</h2><p>Después de las prácticas en español, prueba cuatro situaciones con fichas nuevas. Elige una jugada y explica tu motivo. La ayuda sigue disponible.</p><a class="btn secondary" href="#practica">Probar mis decisiones →</a></section><section class="quick-challenge"><div><span class="eyebrow" style="margin-bottom:8px">TU PRIMERA VICTORIA EMPIEZA AQUÍ</span><h3>Encuentra las dos que son iguales.</h3><p id="quick-feedback" aria-live="polite">Tócalas. No necesitas saber ninguna regla todavía.</p></div><div class="tile-row" id="quick-tiles">${["c3", "b2", "c3", "c5"].map((k, i) => `<span data-quick="${i}">${tileHTML(k, { id: String(i) })}</span>`).join("")}</div></section>`;
}
function lessonContexts(step) {
  return `${step.contextSections?.length ? `<div class="lesson-context-groups">${step.contextSections.map((section) => `<section class="lesson-context-section"><h3>${esc(section.label)}</h3><div class="tile-row">${section.tiles.map((kind) => tileHTML(kind, { small: true, disabled: true })).join("")}</div></section>`).join("")}</div>` : ""}${step.cardGroups?.length ? `<div class="lesson-context-groups" aria-label="Ejemplo original: los colores relacionan familias">${step.cardGroups.map((group) => `<section class="lesson-context-section card-${esc(group.color)}"><h3>${esc(group.label)}</h3><div class="tile-row">${group.tiles.map((kind) => tileHTML(kind, { small: true, disabled: true })).join("")}</div></section>`).join("")}</div>` : ""}`;
}
function lessonExtraRules(lesson) {
  return lesson.extraRules?.length
    ? `<details class="lesson-extra-rules"><summary>Para una mesa real, después</summary><p>Estas opciones amplían el primer recorrido. No necesitas memorizarlas para practicar aquí.</p>${lesson.extraRules.map((rule) => `<h3>${esc(rule.title)}</h3><p>${esc(rule.text)}</p>`).join("")}</details>`
    : "";
}
function lessonPage(id) {
  const lesson = LESSONS.find((l) => l.id === id) || LESSONS[0];
  const index = LESSONS.indexOf(lesson);
  const stepIndex = Math.min(
    profile.steps[lesson.id] || 0,
    lesson.steps.length,
  );
  if (stepIndex === lesson.steps.length) return lessonComplete(lesson, index);
  const step = lesson.steps[stepIndex],
    task = step.task;
  return `<a class="back-link" href="#inicio">${icons.back} Mi camino</a><div class="page-title"><div><span class="eyebrow" style="margin:0">FASE ${String(index + 1).padStart(2, "0")}</span><h1>${esc(lesson.title)}</h1></div></div><div class="lesson-layout"><section class="lesson-panel"><div class="lesson-progress"><span>Reto ${stepIndex + 1} de ${lesson.steps.length}</span><div class="progress-track"><span style="width:${((stepIndex + 1) / lesson.steps.length) * 100}%"></span></div><span>Sin prisa</span></div><div class="lesson-content"><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p>${lessonContexts(step)}${step.audioIds ? lessonAudio(step.audioIds) : ""}<div class="exercise"><p class="exercise-prompt">${esc(task.prompt)}</p>${step.tiles?.length && !step.cardGroups ? `<div class="tile-row" data-motion-zone="lesson">${step.tiles.map((k, i) => `<span data-exercise-tile="${i}">${tileHTML(k, { id: String(i), motionId: `lesson-${lesson.id}-${stepIndex}-${i}`, lang: lesson.id === "ingles" ? "en" : "es", selected: selected.has(String(i)), disabled: task.type !== "select" })}</span>`).join("")}</div>` : ""}${task.type === "select" ? `<p class="selection-count" role="status">${selected.size} de ${task.answer.length} fichas seleccionadas · toca otra vez para quitar una.</p>` : ""}${task.type === "choice" ? `<div class="choices">${task.options.map((o) => `<button class="choice ${chosen === o.id ? "selected" : ""}" data-choice="${esc(o.id)}" aria-pressed="${chosen === o.id}">${esc(o.label)}</button>`).join("")}</div>` : ""}</div>${feedback ? `<div class="feedback ${feedback.ok ? "" : "retry"}" role="status"><strong>${feedback.ok ? "¡Reto conseguido!" : "Probemos otra vez."}</strong>${esc(feedback.ok ? task.success : feedback.quantity || "Mira la explicación y vuelve a probar.")}<p>${esc(task.explanation)}</p>${!feedback.ok && (profile.attempts[lesson.id + "-" + stepIndex] || 0) >= 2 ? '<p style="margin:10px 0 0">Puedes mirar la pista y tocar las fichas con calma. El progreso se construye practicando.</p>' : ""}</div>` : ""}</div><div class="lesson-actions"><button class="text-button" data-action="lesson-back" ${stepIndex === 0 ? "disabled" : ""}>← Anterior</button>${feedback?.ok ? '<button class="btn" data-action="lesson-next">Siguiente reto ' + icons.arrow + "</button>" : '<button class="btn" data-action="lesson-check">Comprobar mi respuesta</button>'}</div></section><aside><div class="coach"><div class="coach-icon">${icons.spark}</div><h3>Una pista a tu lado</h3>${lessonHintVisible ? `<p>${esc(lessonHint(lesson, step))}</p>` : `<p>Si necesitas otra forma de mirarlo, puedes pedir una pista.</p><button class="btn subtle" data-action="lesson-hint">Ver una pista</button>`}<p class="tiny">No hay vidas que perder. Cada intento te ayuda a reconocer algo nuevo.</p></div><nav class="lesson-map" aria-label="Fases">${LESSONS.map((l, i) => `<a href="#leccion/${l.id}" class="${lesson.id === l.id ? "active" : ""}"><span class="step-dot">${profile.completed.includes(l.id) ? "✓" : i + 1}</span>${esc(l.title)}</a>`).join("")}</nav>${lessonExtraRules(lesson)}</aside></div>`;
}
function lessonComplete(lesson, index) {
  const next = LESSONS[index + 1];
  const nextPath =
    lesson.id === "estrategia"
      ? "practica"
      : next
        ? "leccion/" + next.id
        : "repaso";
  return `<a class="back-link" href="#inicio">${icons.back} Mi camino</a><div class="lesson-panel complete-banner"><div class="medal" aria-hidden="true">✧</div><span class="eyebrow">UN PASO MÁS, A TU MANERA</span><h2>Práctica completada, ${esc(profile.name)}.</h2><p>Terminaste los ejercicios de «${esc(lesson.title)}».<br>${lesson.id === "estrategia" ? "Ahora prueba cuatro decisiones con fichas distintas. Puedes pedir ayuda y volver a intentar." : "Puedes repetirlos o probar el siguiente paso a tu ritmo."}</p><div class="button-row"><button class="btn secondary" data-action="lesson-repeat">Repetir estos ejercicios</button><a class="btn" href="#${nextPath}">${lesson.id === "estrategia" ? "Probar mis decisiones" : next ? "Siguiente práctica" : "Entrenar el oído"} ${icons.arrow}</a><a class="text-button" href="#mesa">Probarlo en la mesa</a></div></div>`;
}
function currentLesson() {
  const lesson = LESSONS.find((l) => l.id === route()[1]) || LESSONS[0];
  return {
    lesson,
    index: profile.steps[lesson.id] || 0,
    step: lesson.steps[profile.steps[lesson.id] || 0],
  };
}
function checkLesson() {
  const { lesson, index, step } = currentLesson();
  if (!step) return;
  const answer = step.task.answer;
  const ok =
    step.task.type === "select"
      ? Array.isArray(answer) &&
        selected.size === answer.length &&
        answer.every((i) => selected.has(String(i)))
      : chosen === answer;
  if (
    (!selected.size && step.task.type === "select") ||
    (!chosen && step.task.type === "choice")
  ) {
    toast("Elige tu respuesta para comprobarla.");
    return;
  }
  feedback = {
    ok,
    quantity: !ok ? selectionFeedback(step.task, selected.size) : "",
  };
  if (!ok) {
    const key = lesson.id + "-" + index;
    profile.attempts[key] = (profile.attempts[key] || 0) + 1;
  }
  save();
  tone(ok);
  render();
}
function patternName(pattern) {
  if (!en() || pattern.source !== "training") return pattern.name;
  return (
    [
      "Circles, one to four",
      "Bamboo garden",
      "Three families",
      "Dragons in the garden",
      "Winds together",
      "One to nine",
    ][TRAINING_PATTERNS.findIndex((p) => p.id === pattern.id)] || pattern.name
  );
}
function miniatureGroups(pattern, analysis) {
  return `<div class="mini-groups">${pattern.groups.map((g, index) => `<div class="mini-group" aria-label="${g.count} ${esc(tileLabel(g.kind, lang))}">${Array.from({ length: g.count }, (_, n) => tileHTML(g.kind, { small: true, disabled: true, muted: !!analysis && n >= analysis.groups[index].tiles.length })).join("")}</div>`).join("")}</div>`;
}
function gameIntro() {
  return `<div class="page-title"><div><span class="eyebrow">AQUÍ SE APRENDE JUGANDO</span><h1>Tu lugar en la mesa.</h1><p>Tres compañeras simuladas. Una decisión a la vez. Toda la ayuda que quieras.</p></div></div><div class="hero" style="padding-top:5px"><div class="table" style="display:grid;place-items:center;min-height:350px"><div style="text-align:center"><div class="tile-row">${["c2", "c2", "c2", "j"].map((k) => tileHTML(k, { disabled: true })).join("")}</div><p class="serif" style="font-size:31px;color:#f7f3e2;margin:30px 0 10px">La siguiente ficha puede ser la tuya.</p><p style="font-size:12px;color:#c6d6c5">Sin tiempo límite. Puedes pedir un consejo en cada turno.</p></div></div><div class="target-card"><span class="eyebrow">ELIGE CÓMO EMPEZAR</span><h2 style="font-size:2.1rem">Vamos paso a paso.</h2><p>En la mesa guiada empiezas con varias fichas que encajan. Practicarás el intercambio inicial y después tus turnos.</p><div class="button-row"><button class="btn" data-action="new-guided">Mesa guiada ${icons.arrow}</button><button class="btn secondary" data-action="new-random">Reparto al azar</button></div><div class="divider"></div><p>Las primeras mesas usan combinaciones didácticas propias. Si añades líneas de tu tarjeta 2026, también podrás practicarlas.</p><a class="text-button" href="#tarjeta">Explorar mi tarjeta →</a><br><a class="text-button" href="#repaso">Prepararme para jugar en inglés →</a></div></div>`;
}
function currentPattern() {
  return (
    game.patterns.find((p) => p.id === game.players[0].targetId) ||
    game.patterns[0]
  );
}
function shortHint() {
  if (game.phase === "bots") return botEventMessage(game.botEvent);
  if (game.phase === "finished")
    return tr(
      "La mano terminó. Revisa la combinación ganadora o comienza una nueva mesa.",
      "The hand is over. Review the winning hand or start a new table.",
    );
  if (game.phase === "charleston") return decisionHint();
  if (game.phase === "draw")
    return tr(
      "Primero toma una ficha de la pared. Después elegimos un descarte.",
      "Pick a tile from the wall first. Then choose a discard.",
    );
  if (game.phase === "claim")
    return tr(
      "Revisa la ficha ofrecida arriba y tu objetivo. La simulación ofrece reclamos para ese objetivo. Solo reclama para completar un grupo permitido o ganar.",
      "Check the offered tile above. Only call to complete a valid group or win.",
    );
  const player = game.players[0];
  if (analyzeHand(player.hand, currentPattern(), player.exposed).complete)
    return tr(
      "Tu mano encaja por completo. ¡Declara Mahjong! No necesitas descartar.",
      "Your hand matches completely. Call Mahjong! You do not need to discard.",
    );
  return decisionHint();
}
function decisionHint() {
  if (!["charleston", "discard"].includes(game.phase)) return gameMessage();
  if (!selected.size)
    return tr(
      "Compara número, familia y cantidad con tu objetivo. Elige primero qué conservar; después prueba una selección. Puedes pedir que marque una opción.",
      "Compare number, suit and quantity with your target. Decide what to keep, then try a selection. You can ask me to mark an option.",
    );
  const impact = selectionImpact(
    game.players[0].hand,
    currentPattern(),
    game.players[0].exposed,
    [...selected],
  );
  if (impact.complete && game.phase === "discard")
    return tr(
      "Tu mano ya completa este objetivo. Puedes declarar Mahjong en lugar de descartar.",
      "Your hand completes this target. You can call Mahjong instead of discarding.",
    );
  const prefix = hintMarked
    ? tr("Esta es una propuesta. ", "This is one suggestion. ")
    : tr("Tu selección: ", "Your selection: ");
  if (!impact.lost && impact.selected.some((tile) => tile.kind === "j"))
    return (
      prefix +
      tr(
        "El comodín no cambia las coincidencias ahora, pero puede ayudarte en un grupo de tres o más iguales. Compáralo con otra ficha antes de decidir.",
        "The Joker does not change this target's matches now, but it may help a group of three or more identical tiles. Compare another tile before deciding.",
      )
    );
  return (
    prefix +
    (impact.lost
      ? tr(
          `Al dejar estas fichas, pasarías de ${impact.before} a ${impact.after} coincidencias con este objetivo. Alguna ficha elegida sí ayuda a completarlo. Puedes compararla con otra o cambiar de objetivo.`,
          `Removing these tiles would change this target's matches from ${impact.before} to ${impact.after}. At least one selected tile helps this target. Compare another tile or another target.`,
        ).trim()
      : tr(
          `Conservarías tus ${impact.after} coincidencias: las fichas elegidas están fuera de los grupos que necesitas o sobran de esa cantidad. Esta comparación solo considera el objetivo elegido.`,
          `You would keep your ${impact.after} matches: the selected tiles are outside the needed groups or exceed their quantity. This comparison only considers your chosen target.`,
        ).trim())
  );
}
function rackTarget(pattern) {
  return `<div class="rack-target"><h3>${tr("Tu objetivo, junto a tus fichas", "Your target, beside your tiles")}</h3><div class="rack-target-groups">${pattern.groups.map((group) => `<div class="rack-target-group">${tileHTML(group.kind, { small: true, disabled: true })}<span>× ${group.count}</span></div>`).join("")}</div><p>${tr("Cada dibujo indica la ficha; × indica cuántas necesitas.", "Each picture identifies a tile; × shows how many you need.")} ${pattern.source === "personal" ? tr("Línea personal: revisa sus notas.", "Personal line: check its notes.") : tr("Ejemplo de práctica.", "Training example.")}</p></div>`;
}
function gameMessage() {
  if (game.phase === "bots") return botEventMessage(game.botEvent);
  if (!en()) return game.message;
  if (game.phase === "charleston")
    return `Choose 3 tiles to pass ${["to the right", "across", "to the left"][game.passIndex]}. Keep your Jokers.`;
  if (game.phase === "draw") return "Your turn. Pick a tile from the wall.";
  if (game.phase === "discard")
    return "Compare your tiles with your target, then discard one tile.";
  if (game.phase === "claim")
    return game.claim.canWin
      ? "That discard completes your hand. Call Mahjong!"
      : "You may call this discard to expose a complete group.";
  return game.winner === 0
    ? "Mahjong! You completed your hand."
    : game.winner === null
      ? "The wall is empty. A new hand is a new opportunity."
      : `${game.players[game.winner].name} called Mahjong. You can review the winning hand.`;
}
function exposureHTML(g, playerIndex, groupIndex, track = true) {
  return `<div class="exposure"${track ? ` data-motion-zone="exposure-${playerIndex}-${groupIndex}"` : ""}>${g.tiles.map((t) => gameTile(t, { small: true, disabled: true }, track)).join("")}${game.phase === "discard" && game.canExchange !== false && g.tiles.some((t) => t.kind === "j") && game.players[0].hand.some((t) => t.kind === g.kind) ? `<button class="exchange" data-exchange="${playerIndex},${groupIndex}">${tr("Cambiar comodín", "Swap Joker")}</button>` : ""}</div>`;
}
function publicAvailability(pattern) {
  const human = game.players[0];
  const outside = [
    ...game.discards
      .filter(
        (d) => !(game.phase === "claim" && d.tile.id === game.claim?.tile.id),
      )
      .map((d) => d.tile),
    ...game.players.slice(1).flatMap((p) => p.exposed.flatMap((g) => g.tiles)),
  ];
  const counts = {};
  outside.forEach((t) => (counts[t.kind] = (counts[t.kind] || 0) + 1));
  return pattern.groups.some(
    (g) =>
      g.count < 3 &&
      (g.kind === "f" ? 8 : 4) - (counts[g.kind] || 0) <
        pattern.groups
          .filter((x) => x.kind === g.kind && x.count < 3)
          .reduce((n, x) => n + x.count, 0),
  )
    ? tr(
        "Atención: las fichas visibles impiden completar una pareja o ficha suelta de este objetivo. Prueba otro.",
        "Visible tiles make a required single or pair unavailable. Try another target.",
      )
    : null;
}
function gamePage() {
  if (!game) return gameIntro();
  const player = game.players[0],
    pattern = currentPattern();
  const analysis = analyzeHand(player.hand, pattern, player.exposed);
  const rank = rankPatterns(player.hand, game.patterns, player.exposed);
  const total =
    player.hand.length + player.exposed.reduce((n, g) => n + g.tiles.length, 0);
  const selectedTile = player.hand.find((t) => selected.has(t.id));
  const unavailable = publicAvailability(pattern);
  return `<div class="page-title game-heading"><div><span class="eyebrow">${tr("TU MESA DE PRÁCTICA", "YOUR PRACTICE TABLE")} · ${game.mode === "guided" ? tr("GUIADA", "GUIDED") : tr("AL AZAR", "RANDOM")}</span><h1>${tr("Tu siguiente pequeño logro.", "One tile closer.")}</h1><p>${tr("Mira tus fichas. Elige una decisión. Puedes pedir ayuda.", "Look at your tiles. Make one decision. Ask for help whenever you like.")}</p></div><button class="btn secondary" data-action="game-menu">${tr("Otra mesa", "New table")}</button></div><div class="game-layout game-screen"><section><div class="table"><div class="opponents">${game.players
    .slice(1)
    .map((p, i) => opponentHTML(p, i + 1))
    .join(
      "",
    )}</div><div class="table-center"><span class="eyebrow">${tr("FICHAS EN LA PARED", "TILES IN THE WALL")}</span><div class="wall-count" id="wall-source">${game.wall.length}</div><div class="table-status">${esc(gameMessage())}</div>${turnControls()}</div><p class="discard-label">${tr("DESCARTES · LAS MÁS RECIENTES AL FINAL", "DISCARDS · MOST RECENT LAST")}</p><div class="discard-tray" data-motion-zone="discards" tabindex="0" aria-label="${tr("Descartes recientes. Desplázate para revisar.", "Recent discards. Scroll to review.")}">${
    game.discards
      .slice(-24)
      .map((d) =>
        gameTile(d.tile, {
          small: true,
          disabled: true,
          motionOrigin: `opponent-${d.player}`,
        }),
      )
      .join("") ||
    `<span class="small" style="color:#bdd1c0">${tr("La mesa empieza contigo.", "The table starts with you.")}</span>`
  }</div></div>${game.phase === "claim" ? `<div class="claim-box" role="status"><h3>${tr("Esa ficha puede servirte.", "That tile may help you.")}</h3><p>${esc(gameMessage())}</p><div class="button-row">${tileHTML(game.claim.tile.kind, { small: true, disabled: true })}${game.claim.canWin ? `<button class="btn" data-action="win">Mahjong!</button>` : game.claim.options.map((o) => `<button class="btn" data-claim="${o.groupIndex}">${tr("Reclamar grupo de", "Call group of")} ${o.count}</button>`).join("")}<button class="btn secondary" data-action="skip-claim">${tr("Dejarla pasar", "Pass")}</button></div></div>` : ""}<div class="rack-panel ${game.turn === 0 && game.phase !== "bots" && game.phase !== "finished" ? "is-your-turn" : ""}"><div class="rack-title"><span><strong>${esc(profile.name)}</strong> · ${tr("tu mano", "your hand")}${game.turn === 0 && game.phase !== "bots" && game.phase !== "finished" ? `<span class="your-turn-label">${tr("Tu turno", "Your turn")}</span>` : ""}</span><small>${total} ${tr("fichas en total", "tiles total")}</small></div>${tableChange ? `<p class="move-notice"><span aria-hidden="true">✦</span>${esc(changeMessage())}</p>` : ""}${player.exposed.length ? `<p class="small muted">${tr("Tus grupos mostrados: quedan fijos.", "Your exposed groups stay fixed.")}</p><div class="exposed-row">${player.exposed.map((g, j) => exposureHTML(g, 0, j)).join("")}</div>` : ""}${
    game.winner === 0 && game.winningClaimTileId
      ? `<p class="small muted" data-motion-zone="winning">${tr("Ficha reclamada para ganar, arriba del soporte:", "Winning claimed tile, above the rack:")} ${gameTile(
          player.hand.find((t) => t.id === game.winningClaimTileId),
          { small: true, disabled: true },
        )}</p>`
      : ""
  }${rackTarget(pattern)}<div class="rack" aria-label="${tr("Tus fichas. Toca para seleccionar.", "Your tiles. Tap to select.")}" id="hand" data-motion-zone="hand">${player.hand
    .filter((t) => t.id !== game.winningClaimTileId)
    .map((t) => gameTile(t, { selected: selected.has(t.id), lang }))
    .join(
      "",
    )}</div><div class="rack-actions">${game.phase === "charleston" ? `<button class="btn" data-action="pass" ${selected.size !== 3 ? "disabled" : ""}>${tr("Pasar 3", "Pass 3")} ${["→", "↑", "←"][game.passIndex]}</button>` : ""}${game.phase === "draw" ? `<button class="btn" data-action="draw">${tr("Tomar una ficha", "Pick a tile")} ${icons.arrow}</button>` : ""}${game.phase === "discard" ? `<button class="btn" data-action="discard" ${selected.size !== 1 ? "disabled" : ""}>${tr("Descartar", "Discard")} ${selectedTile ? esc(tileLabel(selectedTile.kind, lang)) : tr("una ficha", "one tile")}</button><button class="btn secondary" data-action="win">Mahjong!</button>` : ""}${game.phase === "finished" ? `<button class="btn" data-action="game-menu">${tr("Volver a practicar", "Practice again")}</button>` : ""}<button class="btn subtle" data-action="sort">${tr("Ordenar fichas", "Sort tiles")}</button><button class="btn subtle" data-action="${showHint && ["charleston", "discard"].includes(game.phase) ? "mark-suggestion" : "advice"}" ${game.phase === "bots" ? "disabled" : ""}>${showHint && ["charleston", "discard"].includes(game.phase) ? tr("Muéstrame una opción", "Mark one option") : tr("Dame una pista", "Give me a hint")}</button></div><p id="decision-preview" class="inline-hint decision-preview" role="status" ${showHint ? "" : "hidden"}>${showHint ? esc(shortHint()) : ""}</p></div><p class="table-help">${tr("Mesa de aprendizaje: practicamos el primer intercambio de tres pases. La segunda ronda, el pase a ciegas, el intercambio de cortesía y la puntuación quedan fuera de esta simulación. El orden de las compañeras es derecha → enfrente → izquierda.", "Learning table: we practice the first three Charleston passes. The second Charleston, blind passes, courtesy pass and scoring are outside this simulation. Opponents are shown right → across → left.")}</p>${game.phase === "finished" ? finishedHand() : ""}</section><aside class="game-coach"><div class="target-card"><span class="eyebrow" style="margin-bottom:10px">${tr("TU COMBINACIÓN OBJETIVO", "YOUR TARGET HAND")}</span><label class="field" style="margin-bottom:0"><span class="hide">${tr("Elegir combinación", "Choose a target")}</span><select id="target-select" ${["bots", "claim"].includes(game.phase) ? "disabled" : ""}>${rank.map((r) => `<option value="${esc(r.pattern.id)}" ${r.pattern.id === pattern.id ? "selected" : ""} ${!r.compatible ? "disabled" : ""}>${esc(patternName(r.pattern))} · ${r.matched}/14</option>`).join("")}</select></label><p style="margin-top:10px">${pattern.source === "personal" ? tr("Añadida por ti · comprueba tu tarjeta 2026.", "Added by you · check your 2026 card.") : tr("Ejercicio didáctico propio · no es una línea oficial 2026.", "Original training hand · not an official 2026 line.")} ${pattern.concealed ? tr("Mano oculta.", "Concealed hand.") : ""}</p>${miniatureGroups(pattern, analysis)}<p class="small muted">${tr("Las fichas claras aún te faltan.", "Faded tiles are still missing.")}</p><div class="match-summary"><strong>${analysis.matched} ${tr("de 14 encajan", "of 14 match")}</strong></div><div class="progress-track"><span style="width:${(analysis.matched / 14) * 100}%"></span></div>${analysis.missing.length ? `<p class="missing-label">${tr("TE FALTAN PARA ESTE OBJETIVO", "STILL NEEDED FOR THIS TARGET")}</p><div class="tile-row" style="justify-content:flex-start;gap:7px">${analysis.missing.map((k) => tileHTML(k, { small: true, disabled: true, lang })).join("")}</div>` : `<p class="small">${tr("¡Todas encajan! Declara Mahjong en tu turno.", "All tiles match! Call Mahjong on your turn.")}</p>`}${unavailable ? `<div class="feedback retry">${esc(unavailable)}</div>` : ""}</div><div class="hint-card"><h3>${icons.spark} ${tr("Tu guía de mesa", "Your table guide")}</h3><p>${showHint ? esc(shortHint()) : esc(tr("Primero compara tu mano con el objetivo. Puedes pedir una pista que explique qué mirar, y después una propuesta marcada si la necesitas.", "First compare your hand with your target. Ask for a hint about what to look for, then for a marked suggestion if you need it."))}</p><button class="text-button hint-toggle" data-action="advice" ${game.phase === "bots" ? "disabled" : ""}>${tr("Explicarme qué mirar", "Explain what to look for")} →</button></div><div class="target-card"><h3>${tr("El pequeño reto de este turno", "This turn’s small challenge")}</h3><p>${esc(gameMessage())}</p>${en() ? `<div class="voice-card table-voice" data-voice-id="table-instruction"><button class="text-button" data-speak="table-instruction" ${speech.supported ? "" : "disabled"}>Listen to this instruction</button></div>` : ""}<button class="text-button" data-action="language">${en() ? "Volver al español" : "Probar la mesa en inglés"} →</button></div></aside></div>`;
}
function finishedHand() {
  if (game.winner === null)
    return `<div class="notice">${tr("La pared se terminó. No pasa nada: cada decisión cuenta. Puedes empezar otra mano.", "The wall is empty. Every decision is practice. Start a new hand when you are ready.")}</div>`;
  const winner = game.players[game.winner],
    p = game.patterns.find((p) => p.id === winner.targetId);
  return `<div class="notice"><h3>${game.winner === 0 ? tr("¡Un nuevo logro, " + esc(profile.name) + "!", "A new achievement, " + esc(profile.name) + "!") : tr(esc(winner.name) + " completó su mano.", esc(winner.name) + " completed her hand.")}</h3><p>${tr("Así quedó la combinación ganadora. Puedes compararla con el objetivo.", "Here is the winning hand. Compare it with the target.")}</p>${p ? miniatureGroups(p) : ""}<div class="tile-row">${winner.hand.map((t) => tileHTML(t.kind, { small: true, disabled: true, lang })).join("")}</div>${winner.exposed.map((g, i) => exposureHTML(g, game.winner, i, false)).join("")}</div>`;
}
function startGame(mode = "guided", patternId) {
  turnPlayer.stop();
  const patterns = patternId
    ? [...TRAINING_PATTERNS, ...profile.personalPatterns].filter(
        (p) => p.id === patternId,
      )
    : [...TRAINING_PATTERNS, ...profile.personalPatterns];
  try {
    game = newGame({ patterns, mode });
  } catch (e) {
    toast(e.message);
    return;
  }
  game.mode = mode;
  game.players[0].name = profile.name;
  botPaused = false;
  tableChange = null;
  $("#table-announcement").textContent = "";
  selected.clear();
  showHint = false;
  hintMarked = false;
  save();
  closeDialog();
  go("mesa" + (en() ? "/en" : ""));
}
function gameAction(action, arg) {
  try {
    if (game.phase === "bots") return;
    speech.stop();
    const before = gameSnapshot();
    const details = { passIndex: game.passIndex, outgoingIds: [...selected] };
    if (action === "pass") passTiles(game, [...selected]);
    if (action === "draw") drawTile(game);
    if (action === "discard")
      discardTile(game, [...selected][0], { deferBots: true });
    if (action === "claim") claimDiscard(game, Number(arg));
    if (action === "skip-claim") skipClaim(game, { deferBots: true });
    if (action === "win") declareMahjong(game);
    selected.clear();
    showHint = false;
    hintMarked = false;
    save();
    tone(
      action === "claim" ? "success" : action === "skip-claim" ? "tap" : action,
    );
    render(trackGameChange(action, before, details));
    announceChange();
  } catch (error) {
    toast(
      en()
        ? action === "win"
          ? "Your hand does not match a complete 14-tile target yet. Check the missing tiles, singles and pairs."
          : "This action is not available yet. Follow the instruction on the table."
        : error.message,
    );
    tone(false);
  }
}
function advise(mark = false) {
  if (!game) return;
  showHint = true;
  hintMarked = mark;
  if (!mark) {
    render();
    return;
  }
  selected.clear();
  const player = game.players[0],
    a = analyzeHand(player.hand, currentPattern(), player.exposed);
  if (game.phase === "charleston") {
    const candidates = player.hand
      .filter((t) => t.kind !== "j")
      .sort(
        (a1, b1) =>
          Number(a.keptIds.includes(a1.id)) - Number(a.keptIds.includes(b1.id)),
      );
    candidates.slice(0, 3).forEach((t) => selected.add(t.id));
  } else if (game.phase === "discard") {
    const s = suggestDiscard(player.hand, currentPattern(), player.exposed);
    if (!a.complete && s.tile) selected.add(s.tile.id);
  }
  render({ action: "hint" });
  if (game.phase === "discard")
    $("#hand")
      ?.querySelector(".selected")
      ?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
}
const allKinds = [
  ...["c", "b", "k"].flatMap((s) =>
    Array.from({ length: 9 }, (_, i) => s + (i + 1)),
  ),
  "we",
  "ws",
  "ww",
  "wn",
  "dr",
  "dg",
  "dw",
  "f",
];
function cardPage() {
  return `<div class="page-title"><div><span class="eyebrow">DEL MODELO A TUS FICHAS</span><h1>Una mano, muchas pistas.</h1><p>Compara grupos, descubre qué falta y practica con un objetivo claro.</p></div></div><div class="notice"><h3>Tu tarjeta oficial 2026, cuando estés lista.</h3><p>Para jugar con manos oficiales necesitas la tarjeta 2026 de la National Mah Jongg League. Aquí empezamos con ejercicios propios. Cuando tengas tu tarjeta, puedes añadir líneas concretas y usarlas en esta mesa.</p><div class="button-row"><a href="https://www.nationalmahjonggleague.org/store.aspx" target="_blank" rel="noopener">Conseguir la tarjeta oficial ↗</a><a href="https://mahjong4friends.com/practice/american-mahjong/nmjl/making-a-hand" target="_blank" rel="noopener">Práctica 2026 en Mahjong4Friends ↗</a></div></div><div class="section-line"><div><h2>Mis líneas personales</h2><p>Se guardan solo en este navegador. No se publican ni se envían.</p></div><button class="btn secondary" data-action="toggle-editor">${editorOpen ? "Cerrar editor" : "+ Añadir línea"}</button></div>${editorOpen ? editorHTML() : ""}${profile.personalPatterns.length ? `<div class="card-grid">${profile.personalPatterns.map((p) => patternCard(p, true)).join("")}</div>` : `<div class="empty">Todavía no has añadido líneas. No hace falta para empezar a aprender.</div>`}<div class="section-line" style="margin-top:35px"><div><h2>Combinaciones para aprender</h2><p>Ejercicios originales para practicar. No son manos oficiales de la tarjeta 2026.</p></div></div><div class="card-grid">${TRAINING_PATTERNS.map((p) => patternCard(p)).join("")}</div>`;
}
function patternCard(p, personal = false) {
  return `<article class="pattern-card"><span class="tag">${personal ? "Añadida por ti · 2026" : "Ejercicio propio"}${p.concealed ? " · Oculta" : ""}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${miniatureGroups(p)}<div class="button-row"><button class="btn secondary" data-practice="${esc(p.id)}">Practicar esta mano →</button>${personal ? `<button class="text-button" data-delete-pattern="${esc(p.id)}">Eliminar</button>` : ""}</div></article>`;
}
function editorHTML() {
  return `<form class="editor" id="pattern-form"><h3>Transcribe una línea de tu tarjeta</h3><p class="small muted">Construye una versión concreta: elige las familias y los números que indica tu tarjeta. Añade cada grupo por separado hasta llegar a 14 fichas. Los colores de la tarjeta indican relaciones entre familias; no obligan a elegir un color real.</p><label class="field">Nombre para reconocerla<input name="pattern-name" id="pattern-name" maxlength="70" placeholder="Por ejemplo: mi primera línea de pares" required></label><p class="small"><strong>1. Elige la ficha de un grupo</strong></p><div class="editor-grid">${allKinds.map((k) => tileHTML(k, { id: "edit-" + k, selected: editorKind === k })).join("")}</div><div class="inline-fields"><label class="field">2. ¿Cuántas iguales?<select name="group-count" id="group-count">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${n} ${n === 1 ? "ficha" : "iguales"}</option>`).join("")}</select></label><button class="btn secondary" type="button" data-action="add-group" style="margin-bottom:18px">Añadir grupo de ${esc(tileLabel(editorKind))}</button></div><div class="draft-groups">${draft.map((g, i) => `<div class="draft-group">${Array.from({ length: g.count }, () => tileHTML(g.kind, { small: true, disabled: true })).join("")}<button type="button" data-remove-group="${i}" aria-label="Quitar grupo ${i + 1}">×</button></div>`).join("") || '<span class="small muted">Los grupos aparecerán aquí.</span>'}</div><p class="small"><strong>${draft.reduce((n, g) => n + g.count, 0)} de 14 fichas</strong> · Las parejas y fichas sueltas necesitan fichas reales. Solo los grupos de tres o más iguales admiten comodines.</p><label class="toggle-label"><input type="checkbox" name="concealed" id="concealed">La línea está marcada como oculta en mi tarjeta</label><p class="small muted">Guardamos exactamente lo que añadas. La web no certifica que coincida con una línea oficial: revisa también sus notas y restricciones. Si una línea muestra números distintos, añádelos como fichas sueltas.</p><button class="btn" type="submit" ${draft.reduce((n, g) => n + g.count, 0) !== 14 ? "disabled" : ""}>Guardar en mi dispositivo</button></form>`;
}
function reviewPage() {
  return renderEnglishHome({
    profile,
    speechSupported: speech.supported,
    category: vocabularyCategory,
    expanded: vocabularyExpanded,
  });
}
function render(motion = null) {
  const motionRoot = $("#app");
  const before = motion ? captureTiles(motionRoot) : null;
  if (!motion) cancelTileMotion(motionRoot);
  const [page, arg] = route();
  if (page === "mesa" && arg === "en") lang = "en";
  if (page !== "mesa") lang = "es";
  let body =
    page === "leccion"
      ? lessonPage(arg)
      : page === "mesa"
        ? gamePage()
        : page === "tarjeta"
          ? cardPage()
          : page === "repaso"
            ? reviewPage()
            : page === "practica"
              ? readinessPage()
              : page === "escuchar"
                ? (() => {
                    const { lesson, index, key } = currentListening();
                    return renderListeningLesson({
                      lesson,
                      stepIndex: index,
                      selectedId: listeningChoice,
                      feedback: listeningFeedback,
                      showText: listeningShowText,
                      speechSupported: speech.supported,
                      hasListened: listenedSteps.has(key),
                      profile,
                    });
                  })()
                : home();
  $("#app").innerHTML = frame(body);
  const discardTray = $(".discard-tray");
  if (discardTray) discardTray.scrollTop = discardTray.scrollHeight;
  updateSpeechUI(speechState);
  if (motion) animateTiles(before, { root: motionRoot, ...motion });
  document.documentElement.lang = en() && page === "mesa" ? "en" : "es";
  document.title =
    (page === "leccion"
      ? "Tu siguiente reto"
      : page === "mesa"
        ? "Tu mesa de práctica"
        : page === "tarjeta"
          ? "Mi tarjeta"
          : page === "practica"
            ? "Probar mis decisiones"
            : page === "escuchar" || page === "repaso"
              ? "Escucha y reconoce"
              : "Mahjong") + " · A tu ritmo";
  turnPlayer.sync();
}
function openDialog(html) {
  speech.stop();
  effects.stop();
  closeDialog();
  priorFocus = document.activeElement;
  const container = document.createElement("div");
  container.className = "dialog-backdrop";
  container.id = "modal";
  container.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${html}</section>`;
  document.body.appendChild(container);
  container.querySelector("input,button,a,select")?.focus();
  turnPlayer.sync();
}
function closeDialog() {
  const modal = $("#modal");
  if (!modal) return;
  modal.remove();
  priorFocus?.focus();
  priorFocus = null;
  turnPlayer.sync();
}
function settings() {
  openDialog(
    `<h2 id="dialog-title">A tu manera.</h2><p>Pequeños detalles para sentirte a gusto.</p><form id="settings-form"><label class="field">¿Cómo quieres que te llamemos?<input name="name" value="${esc(profile.name)}" maxlength="30" required autocomplete="given-name"></label><label class="toggle-label"><input name="sound" type="checkbox" ${profile.sound ? "checked" : ""}>Efectos suaves de las fichas y los retos</label><p class="small muted">Las voces de inglés se escuchan con sus propios botones, aunque silencies los efectos.</p><p>Tu progreso y tus líneas personales se guardan en este navegador. En otro dispositivo puedes empezar un camino independiente.</p><div class="button-row"><button class="btn" type="submit">Guardar</button><button class="btn secondary" type="button" data-action="close-dialog">Cerrar</button></div></form><div class="divider"></div><button class="text-button" data-action="reset-confirm">Reiniciar mi progreso</button>`,
  );
}
function gameMenu() {
  openDialog(
    `<h2 id="dialog-title">${tr("Un nuevo pequeño reto.", "A fresh start.")}</h2><p>${tr("La mesa actual será reemplazada. Tus lecciones y líneas personales se conservan.", "Your current table will be replaced. Your lessons and personal lines are kept.")}</p><div class="button-row"><button class="btn" data-action="new-guided">${tr("Mesa guiada", "Guided table")}</button><button class="btn secondary" data-action="new-random">${tr("Reparto al azar", "Random deal")}</button><button class="text-button" data-action="close-dialog">${tr("Seguir aquí", "Stay here")}</button></div>`,
  );
}
function updateHandSelection() {
  document.querySelectorAll("#hand .tile").forEach((button) => {
    const isSelected = selected.has(button.dataset.id);
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  const passButton = $('[data-action="pass"]');
  if (passButton) passButton.disabled = selected.size !== 3;
  const discardButton = $('[data-action="discard"]');
  if (discardButton) {
    const tile = game.players[0].hand.find((t) => selected.has(t.id));
    discardButton.disabled = selected.size !== 1;
    discardButton.textContent =
      tr("Descartar ", "Discard ") +
      (tile ? tileLabel(tile.kind, lang) : tr("una ficha", "one tile"));
  }
  const hint = $(".inline-hint");
  if (hint) hint.textContent = shortHint();
  const coachHint = $(".hint-card > p");
  if (showHint && coachHint) coachHint.textContent = shortHint();
}
function chooseTile(button) {
  const [page] = route();
  const id = button.dataset.id;
  if (page === "leccion") {
    const i = button.closest("[data-exercise-tile]")?.dataset.exerciseTile;
    if (i === undefined) return;
    selected.has(i) ? selected.delete(i) : selected.add(i);
    tone("tap");
    feedback = null;
    render({ action: "selection" });
    $(`[data-exercise-tile="${i}"] button.tile`)?.focus({
      preventScroll: true,
    });
    return;
  }
  if (page === "mesa" && button.closest("#hand")) {
    if (!["charleston", "discard"].includes(game.phase)) return;
    if (game.phase === "charleston" && button.dataset.tile === "j") {
      toast(
        tr(
          "Los comodines se quedan contigo. Elige otra ficha.",
          "Keep your Jokers. Choose another tile.",
        ),
      );
      return;
    }
    if (selected.has(id)) selected.delete(id);
    else {
      if (game.phase !== "charleston") selected.clear();
      if (selected.size < 3) selected.add(id);
    }
    hintMarked = false;
    updateHandSelection();
    tone("tap");
    return;
  }
  if (page === "tarjeta" && button.closest(".editor-grid")) {
    const name = $("#pattern-name").value,
      count = $("#group-count").value,
      concealed = $("#concealed").checked;
    editorKind = button.dataset.tile;
    tone("tap");
    render();
    $("#pattern-name").value = name;
    $("#group-count").value = count;
    $("#concealed").checked = concealed;
    return;
  }
  if (button.closest("#quick-tiles")) {
    const index = button.closest("[data-quick]").dataset.quick;
    selected.has(index) ? selected.delete(index) : selected.add(index);
    if (selected.size > 2) selected = new Set([index]);
    tone("tap");
    document.querySelectorAll("#quick-tiles .tile").forEach((b) => {
      const sel = selected.has(b.dataset.id);
      b.classList.toggle("selected", sel);
      b.setAttribute("aria-pressed", String(sel));
    });
    const text = $("#quick-feedback");
    if (selected.size === 2) {
      const ok = selected.has("0") && selected.has("2");
      text.textContent = ok
        ? "¡Exacto! Las dos tienen tres círculos. Ya reconociste tu primera pareja."
        : "Mira el dibujo y cuéntalo. Buscamos dos fichas exactamente iguales.";
      tone(ok);
    } else
      text.textContent =
        "Elige otra ficha que tenga exactamente el mismo dibujo.";
  }
}
document.addEventListener("click", (event) => {
  const review = event.target.closest("[data-review-lesson]");
  if (review) {
    event.preventDefault();
    const id = review.dataset.reviewLesson;
    if (!LESSONS.some((lesson) => lesson.id === id)) return;
    if (route()[0] === "practica") {
      const { practice, step } = currentReadiness();
      if (step) practice.helped[step.id] = true;
    }
    profile.steps[id] = 0;
    save();
    go("leccion/" + id);
    return;
  }
  const jump = event.target.closest("[data-scroll-to]");
  if (jump) {
    const target = document.getElementById(jump.dataset.scrollTo);
    target?.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    target?.focus({ preventScroll: true });
    return;
  }
  const decision = event.target.closest("[data-readiness-choice]");
  const reason = event.target.closest("[data-readiness-reason]");
  if (decision || reason) {
    if (decision) readinessChoice = decision.dataset.readinessChoice;
    if (reason) readinessReason = reason.dataset.readinessReason;
    readinessFeedback = null;
    tone("tap");
    render();
    const key = decision ? "data-readiness-choice" : "data-readiness-reason";
    $(
      `[${key}="${CSS.escape(decision ? readinessChoice : readinessReason)}"]`,
    )?.focus({ preventScroll: true });
    return;
  }
  const restart = event.target.closest("[data-restart-listening]");
  if (restart) {
    event.preventDefault();
    const id = restart.dataset.restartListening;
    if (!LISTENING_LESSONS.some((lesson) => lesson.id === id)) return;
    profile.listeningSteps[id] = 0;
    save();
    go("escuchar/" + id);
    return;
  }
  const voice = event.target.closest("[data-speak]");
  if (voice && !voice.disabled) {
    // Keep speak synchronous with this tap, as required by Safari on iOS.
    speakVocabulary(voice.dataset.speak, voice.dataset.slow === "true");
    return;
  }
  const audioChoice = event.target.closest("[data-listening-answer]");
  if (audioChoice && !audioChoice.disabled) {
    listeningChoice = audioChoice.dataset.listeningAnswer;
    listeningFeedback = null;
    tone("tap");
    render();
    $(`[data-listening-answer="${CSS.escape(listeningChoice)}"]`)?.focus({
      preventScroll: true,
    });
    return;
  }
  const category = event.target.closest("[data-vocab-category]");
  if (category) {
    speech.stop();
    vocabularyCategory = category.dataset.vocabCategory;
    vocabularyExpanded = false;
    tone("tap");
    render();
    $(`[data-vocab-category="${vocabularyCategory}"]`)?.focus({
      preventScroll: true,
    });
    return;
  }
  const tile = event.target.closest("button.tile");
  if (tile && !tile.disabled) {
    chooseTile(tile);
    return;
  }
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    chosen = choice.dataset.choice;
    feedback = null;
    tone("tap");
    render();
    return;
  }
  const claim = event.target.closest("[data-claim]");
  if (claim) {
    gameAction("claim", claim.dataset.claim);
    return;
  }
  const practice = event.target.closest("[data-practice]");
  if (practice) {
    if (game && game.phase !== "finished") {
      const id = practice.dataset.practice;
      openDialog(
        `<h2 id="dialog-title">Practicar esta combinación</h2><p>Reemplazará tu mesa actual. Tus lecciones se conservan.</p><div class="button-row"><button class="btn" data-start-pattern="${esc(id)}">Comenzar práctica</button><button class="btn secondary" data-action="close-dialog">Cancelar</button></div>`,
      );
    } else startGame("guided", practice.dataset.practice);
    return;
  }
  const start = event.target.closest("[data-start-pattern]");
  if (start) {
    startGame("guided", start.dataset.startPattern);
    return;
  }
  const del = event.target.closest("[data-delete-pattern]");
  if (del) {
    const id = del.dataset.deletePattern;
    openDialog(
      `<h2 id="dialog-title">Eliminar esta línea</h2><p>Se quitará de este navegador. Puedes volver a añadirla después.</p><div class="button-row"><button class="btn danger" data-confirm-delete="${esc(id)}">Eliminar línea</button><button class="btn secondary" data-action="close-dialog">Conservarla</button></div>`,
    );
    return;
  }
  const confirmed = event.target.closest("[data-confirm-delete]");
  if (confirmed) {
    profile.personalPatterns = profile.personalPatterns.filter(
      (p) => p.id !== confirmed.dataset.confirmDelete,
    );
    save();
    closeDialog();
    render();
    return;
  }
  const remove = event.target.closest("[data-remove-group]");
  if (remove) {
    const name = $("#pattern-name").value,
      concealed = $("#concealed").checked;
    draft.splice(Number(remove.dataset.removeGroup), 1);
    render();
    $("#pattern-name").value = name;
    $("#concealed").checked = concealed;
    return;
  }
  const exchange = event.target.closest("[data-exchange]");
  if (exchange) {
    try {
      const before = gameSnapshot();
      const [p, g] = exchange.dataset.exchange.split(",").map(Number);
      const own = game.players[0].hand.find(
        (t) => t.kind === game.players[p].exposed[g].kind,
      );
      const joker = game.players[p].exposed[g].tiles.find(
        (t) => t.kind === "j",
      );
      exchangeJoker(game, own.id, p, g);
      tone("success");
      save();
      selected.clear();
      render(
        trackGameChange("exchange", before, {
          exchangeIds: [own.id, joker.id],
        }),
      );
      announceChange();
      toast(
        tr("El comodín ya está en tu mano.", "The Joker is now in your hand."),
      );
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "vocab-expand") {
    vocabularyExpanded = !vocabularyExpanded;
    render();
    $('[data-action="vocab-expand"]')?.focus({ preventScroll: true });
    if (!vocabularyExpanded)
      $("#biblioteca")?.scrollIntoView({ block: "start" });
    return;
  }
  if (action === "lesson-hint") {
    lessonHintVisible = true;
    render();
    return;
  }
  if (action === "readiness-check") return checkReadiness();
  if (action === "readiness-next") return nextReadiness();
  if (action === "readiness-hint") {
    const { practice, step } = currentReadiness();
    if (!step) return;
    practice.helped[step.id] = true;
    save();
    render();
    return;
  }
  if (action === "readiness-repeat") {
    profile.decisionPractice = {
      variant: profile.decisionPractice.variant + 1,
      index: 0,
      results: [],
      failures: {},
      helped: {},
    };
    save();
    resetInteraction();
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "voice-stop") return speech.stop();
  if (action === "listening-check") return checkListening();
  if (action === "listening-reveal") {
    listeningShowText = true;
    render();
    return;
  }
  if (["listening-next", "listening-back", "listening-repeat"].includes(action))
    return moveListening(action);
  if (action === "pause-turns") {
    botPaused = !botPaused;
    save();
    render();
    $('[data-action="pause-turns"]')?.focus({ preventScroll: true });
    return;
  }
  if (action === "sound") {
    profile.sound = !profile.sound;
    profile.soundPreferenceSet = true;
    save();
    if (profile.sound) tone("tap");
    else effects.stop();
    render();
    toast(profile.sound ? "Sonidos activados" : "Sonidos desactivados");
  }
  if (action === "settings") settings();
  if (action === "close-dialog") closeDialog();
  if (action === "lesson-check") checkLesson();
  if (action === "lesson-next") {
    speech.stop();
    const { lesson, index } = currentLesson();
    profile.steps[lesson.id] = index + 1;
    if (
      index + 1 === lesson.steps.length &&
      !profile.completed.includes(lesson.id)
    )
      profile.completed.push(lesson.id);
    save();
    resetInteraction();
    render();
    $("#main")?.focus();
    window.scrollTo(0, 0);
  }
  if (action === "lesson-back") {
    speech.stop();
    const { lesson, index } = currentLesson();
    profile.steps[lesson.id] = Math.max(0, index - 1);
    save();
    resetInteraction();
    render();
  }
  if (action === "lesson-repeat") {
    speech.stop();
    const { lesson } = currentLesson();
    profile.steps[lesson.id] = 0;
    save();
    resetInteraction();
    render();
  }
  if (action === "new-guided") startGame("guided");
  if (action === "new-random") startGame("random");
  if (action === "game-menu") gameMenu();
  if (["pass", "draw", "discard", "skip-claim", "win"].includes(action))
    gameAction(action);
  if (action === "sort") {
    tone("tap");
    const order = [...allKinds, "j"];
    game.players[0].hand.sort(
      (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
    );
    save();
    render({ action: "sort" });
  }
  if (action === "advice") advise();
  if (action === "mark-suggestion") advise(true);
  if (action === "language") {
    lang = en() ? "es" : "en";
    save();
    go("mesa" + (en() ? "/en" : ""));
    render();
  }
  if (action === "english-game") {
    lang = "en";
    save();
    if (game) go("mesa/en");
    else {
      startGame("guided");
      go("mesa/en");
    }
  }
  if (action === "toggle-editor") {
    editorOpen = !editorOpen;
    draft = [];
    render();
  }
  if (action === "add-group") {
    const name = $("#pattern-name").value,
      concealed = $("#concealed").checked,
      count = Number($("#group-count").value);
    if (draft.reduce((n, g) => n + g.count, 0) + count > 14) {
      toast("La mano completa debe tener exactamente 14 fichas.");
      return;
    }
    draft.push({ kind: editorKind, count });
    render();
    $("#pattern-name").value = name;
    $("#concealed").checked = concealed;
  }
  if (action === "reset-confirm")
    openDialog(
      '<h2 id="dialog-title">¿Empezar un camino nuevo?</h2><p>Se reiniciarán las lecciones y la mesa. Tus líneas personales se conservarán.</p><div class="button-row"><button class="btn danger" data-action="reset">Reiniciar</button><button class="btn secondary" data-action="close-dialog">Conservar mi progreso</button></div>',
    );
  if (action === "reset") {
    turnPlayer.stop();
    speech.stop();
    effects.stop();
    profile.steps = {};
    profile.completed = [];
    profile.attempts = {};
    profile.listeningSteps = {};
    profile.listeningCompleted = [];
    profile.audioHeard = [];
    profile.decisionPractice = {
      variant: 0,
      index: 0,
      results: [],
      failures: {},
      helped: {},
    };
    listenedSteps.clear();
    game = null;
    showHint = false;
    hintMarked = false;
    tableChange = null;
    save();
    closeDialog();
    go("inicio");
    render();
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "target-select") {
    if (["bots", "claim"].includes(game.phase)) return;
    game.players[0].targetId = event.target.value;
    selected.clear();
    showHint = false;
    hintMarked = false;
    save();
    render();
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "settings-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    profile.name = String(data.get("name")).trim().slice(0, 30) || "Gaby";
    profile.sound = data.has("sound");
    profile.soundPreferenceSet = true;
    if (!profile.sound) effects.stop();
    if (game) game.players[0].name = profile.name;
    save();
    closeDialog();
    render();
    toast("Listo. Este camino es tuyo.");
  }
  if (event.target.id === "pattern-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const natural = {};
    for (const g of draft) {
      if (g.count < 3) natural[g.kind] = (natural[g.kind] || 0) + g.count;
    }
    if (
      Object.entries(natural).some(
        ([kind, count]) => count > (kind === "f" ? 8 : 4),
      )
    ) {
      toast(
        "Hay más fichas sueltas o parejas de un tipo que fichas reales disponibles. Revisa los grupos.",
      );
      return;
    }
    if (draft.reduce((n, g) => n + g.count, 0) !== 14) return;
    const candidate = {
      id: "personal-" + Date.now(),
      name:
        String(data.get("pattern-name")).trim().slice(0, 70) || "Mi línea 2026",
      description:
        "Versión concreta añadida por ti. Comprueba las notas de tu tarjeta.",
      source: "personal",
      concealed: data.has("concealed"),
      groups: draft.map((g) => ({ ...g })),
    };
    if (analyzeHand(createWall(), candidate).matched !== 14) {
      toast(
        "Esta combinación pide más fichas o comodines de los que existen. Revisa la tarjeta y sus grupos.",
      );
      return;
    }
    profile.personalPatterns.push(candidate);
    draft = [];
    editorOpen = false;
    save();
    render();
    toast("Línea guardada en este dispositivo.");
  }
});
document.addEventListener("keydown", (event) => {
  const modal = $("#modal");
  if (!modal) return;
  if (event.key === "Escape") closeDialog();
  if (event.key === "Tab") {
    const focus = [
      ...modal.querySelectorAll("button:not(:disabled),a,input,select"),
    ];
    const first = focus[0],
      last = focus.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
window.addEventListener("hashchange", () => {
  turnPlayer.stop();
  speech.stop();
  effects.stop();
  resetInteraction();
  closeDialog();
  render();
  window.scrollTo(0, 0);
  $("#main")?.focus();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    speech.stop();
    effects.stop();
  }
  turnPlayer.sync();
});
window.addEventListener("pagehide", () => {
  speech.stop();
  effects.stop();
  turnPlayer.stop();
});
window.addEventListener("pageshow", () => turnPlayer.sync());
render();
