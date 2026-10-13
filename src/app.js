import { LESSONS } from "./lessons.js";
import { tileHTML as renderTile, tileLabel } from "./tiles.js";
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
  sound: false,
  completed: [],
  steps: {},
  attempts: {},
  personalPatterns: [],
  ...saved.profile,
};
let game = saved.game || null;
let lang = saved.lang || "es";
const tileHTML = (kind, options = {}) => renderTile(kind, { lang, ...options });
let selected = new Set();
let chosen = null;
let feedback = null;
let showHint = false;
let editorOpen = false;
let draft = [];
let editorKind = "c1";
let toastTimer;
let audioContext;
let priorFocus;
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
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ profile, game, lang }));
  } catch {
    toast("Tu navegador no pudo guardar el progreso. Puedes seguir jugando.");
  }
}
function tone(ok = true) {
  if (!profile.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const o = audioContext.createOscillator(),
      g = audioContext.createGain();
    o.connect(g);
    g.connect(audioContext.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(ok ? 660 : 330, audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      ok ? 880 : 280,
      audioContext.currentTime + 0.13,
    );
    g.gain.setValueAtTime(0.035, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.24,
    );
    o.start();
    o.stop(audioContext.currentTime + 0.25);
  } catch {
    /* Sonido opcional. */
  }
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
    resetInteraction();
    render();
    window.scrollTo(0, 0);
  } else location.hash = hash;
}
function resetInteraction() {
  selected.clear();
  chosen = null;
  feedback = null;
}
function navLink(id, label, symbol) {
  return `<a href="#${id}" class="${route()[0] === id ? "active" : ""}" ${route()[0] === id ? 'aria-current="page"' : ""}><span class="nav-icon" aria-hidden="true">${symbol}</span>${label}</a>`;
}
function frame(body) {
  return `<header class="app-header"><a class="brand" href="#inicio" aria-label="Mahjong, a tu ritmo. Inicio"><img src="./assets/icon.svg" alt=""><span>mahjong<small>a tu ritmo</small></span></a><nav class="nav" aria-label="Navegación principal">${navLink("inicio", "Mi camino", "⌂")}${navLink("mesa", "La mesa", "▦")}${navLink("tarjeta", "Mi tarjeta", "▤")}${navLink("repaso", "El inglés", "Aa")}</nav><div class="header-actions"><button class="icon-button" data-action="sound" aria-label="${profile.sound ? "Desactivar" : "Activar"} sonidos" aria-pressed="${profile.sound}" title="Sonido ${profile.sound ? "activado" : "desactivado"}">${icons.sound}${profile.sound ? "" : '<span class="hide">apagado</span>'}</button><button class="icon-button" data-action="settings" aria-label="Mis preferencias">${icons.settings}</button></div></header><main id="main" class="shell" tabindex="-1">${body}</main><footer class="app-footer"><span>Hecho para aprender, disfrutar y volver a intentar.<br>Tu progreso se guarda en este navegador. Sin cuentas ni anuncios.</span><span>Mahjong Americano · <a href="https://www.nationalmahjonggleague.org/" target="_blank" rel="noopener">National Mah Jongg League ↗</a><br>Ejercicios propios · Sin afiliación con NMJL</span></footer>`;
}
const symbols = ["◎", "❧", "▤", "↗", "↻", "✧", "Aa"];
function home() {
  const done = profile.completed.length;
  const next =
    LESSONS.find((l) => !profile.completed.includes(l.id)) || LESSONS[0];
  return `<section class="hero"><div><span class="eyebrow">HOLA, ${esc(profile.name)} · ESTE MOMENTO ES PARA TI</span><h1>Una ficha a la vez.<br><em>Y cada vez, mejor.</em></h1><p>Un nuevo reto, sin ninguna prisa. Aprende Mahjong Americano jugando, con pasos pequeños y ayuda cuando la quieras.</p><div class="button-row"><a class="btn" href="#leccion/${next.id}">${done ? "Continuar mi camino" : "Vamos con el primer reto"} ${icons.arrow}</a></div><div class="hero-meta"><span>Desde cero</span><span>Primero en español</span><span>A tu ritmo</span></div></div><div class="hero-visual" aria-hidden="true"><span class="spark a">✧</span><span class="spark b">✧</span><div class="oval-table"><div class="tile-fan">${["b3", "c5", "f"].map((k) => tileHTML(k, { disabled: true })).join("")}</div></div><div class="floating-note"><span class="check">✓</span><div><b>Pequeños retos. Grandes avances.</b>Hoy solo necesitas dar el primer paso.</div></div></div></section><section aria-labelledby="path-heading"><div class="section-line"><div><h2 id="path-heading">Tu camino a la mesa</h2><p>Un reto a la vez. Puedes repetir o explorar cualquier fase.</p></div><div class="progress-note">${done} de ${LESSONS.length} fases<div class="progress-track" role="progressbar" aria-label="Fases completadas" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${LESSONS.length}"><span style="width:${(done / LESSONS.length) * 100}%"></span></div></div></div><div class="course-grid">${LESSONS.map((l, i) => `<a class="course-card ${profile.completed.includes(l.id) ? "completed" : ""}" href="#leccion/${l.id}"><div class="card-top"><span>FASE ${String(i + 1).padStart(2, "0")}</span>${profile.completed.includes(l.id) ? '<span class="check" aria-label="Completada">✓</span>' : `<span>${l.minutes} MIN</span>`}</div><span class="course-symbol" aria-hidden="true">${symbols[i]}</span><h3>${esc(l.title)}</h3><p>${esc(l.subtitle)}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`).join("")}<a class="course-card practice-card" href="#mesa"><div class="card-top"><span>TU ESPACIO DE PRÁCTICA</span><span>↗</span></div><h3>¿Y si ya<br>jugamos?</h3><p>Tu mesa, tres compañeras<br>y una guía a tu lado.</p><span class="card-arrow">${icons.arrow}</span></a></div></section><section class="quick-challenge"><div><span class="eyebrow" style="margin-bottom:8px">TU PRIMERA VICTORIA EMPIEZA AQUÍ</span><h3>Encuentra las dos que son iguales.</h3><p id="quick-feedback" aria-live="polite">Tócalas. No necesitas saber ninguna regla todavía.</p></div><div class="tile-row" id="quick-tiles">${["c3", "b2", "c3", "c5"].map((k, i) => `<span data-quick="${i}">${tileHTML(k, { id: String(i) })}</span>`).join("")}</div></section>`;
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
  return `<a class="back-link" href="#inicio">${icons.back} Mi camino</a><div class="page-title"><div><span class="eyebrow" style="margin:0">FASE ${String(index + 1).padStart(2, "0")}</span><h1>${esc(lesson.title)}</h1></div></div><div class="lesson-layout"><section class="lesson-panel"><div class="lesson-progress"><span>Reto ${stepIndex + 1} de ${lesson.steps.length}</span><div class="progress-track"><span style="width:${((stepIndex + 1) / lesson.steps.length) * 100}%"></span></div><span>Sin prisa</span></div><div class="lesson-content"><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p><div class="exercise"><p class="exercise-prompt">${esc(task.prompt)}</p>${step.tiles?.length ? `<div class="tile-row">${step.tiles.map((k, i) => `<span data-exercise-tile="${i}">${tileHTML(k, { id: String(i), selected: selected.has(String(i)), disabled: task.type !== "select" })}</span>`).join("")}</div>` : ""}${task.type === "choice" ? `<div class="choices">${task.options.map((o) => `<button class="choice ${chosen === o.id ? "selected" : ""}" data-choice="${esc(o.id)}" aria-pressed="${chosen === o.id}">${esc(o.label)}</button>`).join("")}</div>` : ""}</div>${feedback ? `<div class="feedback ${feedback.ok ? "" : "retry"}" role="status"><strong>${feedback.ok ? "¡Reto conseguido!" : "Probemos otra vez."}</strong>${esc(feedback.ok ? task.success : task.explanation)}${!feedback.ok && (profile.attempts[lesson.id + "-" + stepIndex] || 0) >= 2 ? '<p style="margin:10px 0 0">Puedes mirar la pista y tocar las fichas con calma. El progreso se construye practicando.</p>' : ""}</div>` : ""}</div><div class="lesson-actions"><button class="text-button" data-action="lesson-back" ${stepIndex === 0 ? "disabled" : ""}>← Anterior</button>${feedback?.ok ? '<button class="btn" data-action="lesson-next">Siguiente reto ' + icons.arrow + "</button>" : '<button class="btn" data-action="lesson-check">Comprobar mi respuesta</button>'}</div></section><aside><div class="coach"><div class="coach-icon">${icons.spark}</div><h3>Una pista a tu lado</h3><p>${esc(step.tip || "Mira el dibujo y el número. Compara una ficha a la vez; no hace falta memorizar todo hoy.")}</p><p class="tiny">No hay vidas que perder. Cada intento te ayuda a reconocer algo nuevo.</p></div><nav class="lesson-map" aria-label="Fases">${LESSONS.map((l, i) => `<a href="#leccion/${l.id}" class="${lesson.id === l.id ? "active" : ""}"><span class="step-dot">${profile.completed.includes(l.id) ? "✓" : i + 1}</span>${esc(l.title)}</a>`).join("")}</nav></aside></div>`;
}
function lessonComplete(lesson, index) {
  const next = LESSONS[index + 1];
  return `<a class="back-link" href="#inicio">${icons.back} Mi camino</a><div class="lesson-panel complete-banner"><div class="medal" aria-hidden="true">✧</div><span class="eyebrow">UN PASO MÁS, A TU MANERA</span><h2>Una nueva habilidad, ${esc(profile.name)}.</h2><p>Completaste «${esc(lesson.title)}».<br>¿Te apetece repetir, probarlo en la mesa o subir el reto?</p><div class="button-row"><button class="btn secondary" data-action="lesson-repeat">Otra práctica</button><a class="btn" href="#${next ? "leccion/" + next.id : "mesa/en"}">${next ? "Subir el reto" : "Jugar en inglés"} ${icons.arrow}</a><a class="text-button" href="#mesa">Probarlo en la mesa</a></div></div>`;
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
  feedback = { ok };
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
  if (game.phase === "finished") return tr("La mano terminó. Revisa la combinación ganadora o comienza una nueva mesa.", "The hand is over. Review the winning hand or start a new table.");
  if (game.phase === "charleston") return tr("Marqué tres fichas para pasar. Puedes cambiar la selección antes de enviarlas.", "I selected three tiles to pass. You can change the selection before passing.");
  if (game.phase === "draw") return tr("Primero toma una ficha de la pared. Después elegimos un descarte.", "Pick a tile from the wall first. Then choose a discard.");
  if (game.phase === "claim") return tr("Revisa la ficha ofrecida arriba. Solo reclámala para completar un grupo válido o ganar.", "Check the offered tile above. Only call to complete a valid group or win.");
  const player = game.players[0];
  if (analyzeHand(player.hand, currentPattern(), player.exposed).complete) return tr("Tu mano encaja por completo. ¡Declara Mahjong! No necesitas descartar.", "Your hand matches completely. Call Mahjong! You do not need to discard.");
  const tile = player.hand.find(t => selected.has(t.id));
  return tile ? tr(`${tileLabel(tile.kind)} es una candidata a descartar para este objetivo. Tú decides.`, `${tileLabel(tile.kind, "en")} is a discard candidate for this target. You decide.`) : tr("Compara tus fichas con el objetivo y revisa los huecos que faltan.", "Compare your tiles with the target and check the missing tiles.");
}
function gameMessage() {
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
function exposureHTML(g, playerIndex, groupIndex) {
  return `<div class="exposure">${g.tiles.map((t) => tileHTML(t.kind, { small: true, disabled: true })).join("")}${game.phase === "discard" && game.canExchange !== false && g.tiles.some((t) => t.kind === "j") && game.players[0].hand.some((t) => t.kind === g.kind) ? `<button class="exchange" data-exchange="${playerIndex},${groupIndex}">${tr("Cambiar comodín", "Swap Joker")}</button>` : ""}</div>`;
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
  const hint = suggestDiscard(player.hand, pattern, player.exposed);
  const rank = rankPatterns(player.hand, game.patterns, player.exposed);
  const total =
    player.hand.length + player.exposed.reduce((n, g) => n + g.tiles.length, 0);
  const selectedTile = player.hand.find((t) => selected.has(t.id));
  const unavailable = publicAvailability(pattern);
  return `<div class="page-title"><div><span class="eyebrow">${tr("TU MESA DE PRÁCTICA", "YOUR PRACTICE TABLE")} · ${game.mode === "guided" ? tr("GUIADA", "GUIDED") : tr("AL AZAR", "RANDOM")}</span><h1>${tr("Tu siguiente pequeño logro.", "One tile closer.")}</h1><p>${tr("Mira tus fichas. Elige una decisión. Puedes pedir ayuda.", "Look at your tiles. Make one decision. Ask for help whenever you like.")}</p></div><button class="btn secondary" data-action="game-menu">${tr("Otra mesa", "New table")}</button></div><div class="game-layout"><section><div class="table"><div class="opponents">${game.players
    .slice(1)
    .map(
      (p, i) =>
        `<div class="opponent"><span class="avatar">${esc(p.name[0])}</span>${esc(p.name)}<small>${tr("Compañera simulada", "Practice opponent")}</small><div class="backs" aria-label="${p.hand.length} ${tr("fichas ocultas", "hidden tiles")}">${p.hand.map(() => "<i></i>").join("")}</div>${p.exposed.map((g, j) => exposureHTML(g, i + 1, j)).join("")}</div>`,
    )
    .join(
      "",
    )}</div><div class="table-center"><span class="eyebrow">${tr("FICHAS EN LA PARED", "TILES IN THE WALL")}</span><div class="wall-count">${game.wall.length}</div><div class="table-status" aria-live="polite">${esc(gameMessage())}</div></div><p class="discard-label">${tr("DESCARTES · LAS MÁS RECIENTES AL FINAL", "DISCARDS · MOST RECENT LAST")}</p><div class="discard-tray">${
    game.discards
      .slice(-24)
      .map((d) => tileHTML(d.tile.kind, { small: true, disabled: true }))
      .join("") ||
    `<span class="small" style="color:#bdd1c0">${tr("La mesa empieza contigo.", "The table starts with you.")}</span>`
  }</div></div>${game.phase === "claim" ? `<div class="claim-box" role="status"><h3>${tr("Esa ficha puede servirte.", "That tile may help you.")}</h3><p>${esc(gameMessage())}</p><div class="button-row">${tileHTML(game.claim.tile.kind, { small: true, disabled: true })}${game.claim.canWin ? `<button class="btn" data-action="win">Mahjong!</button>` : game.claim.options.map((o) => `<button class="btn" data-claim="${o.groupIndex}">${tr("Reclamar grupo de", "Call group of")} ${o.count}</button>`).join("")}<button class="btn secondary" data-action="skip-claim">${tr("Dejarla pasar", "Pass")}</button></div></div>` : ""}<div class="rack-panel"><div class="rack-title"><span><strong>${esc(profile.name)}</strong> · ${tr("tu mano", "your hand")}</span><small>${total} ${tr("fichas en total", "tiles total")}</small></div>${player.exposed.length ? `<p class="small muted">${tr("Tus grupos mostrados: quedan fijos.", "Your exposed groups stay fixed.")}</p><div class="exposed-row">${player.exposed.map((g, j) => exposureHTML(g, 0, j)).join("")}</div>` : ""}${game.winner === 0 && game.winningClaimTileId ? `<p class="small muted">${tr("Ficha reclamada para ganar, arriba del soporte:", "Winning claimed tile, above the rack:")} ${tileHTML(player.hand.find((t) => t.id === game.winningClaimTileId)?.kind || "f", { small: true, disabled: true })}</p>` : ""}<div class="rack" aria-label="${tr("Tus fichas. Toca para seleccionar.", "Your tiles. Tap to select.")}" id="hand">${player.hand
    .filter((t) => t.id !== game.winningClaimTileId)
    .map((t) =>
      tileHTML(t.kind, { id: t.id, selected: selected.has(t.id), lang }),
    )
    .join(
      "",
    )}</div><div class="rack-actions">${game.phase === "charleston" ? `<button class="btn" data-action="pass" ${selected.size !== 3 ? "disabled" : ""}>${tr("Pasar 3", "Pass 3")} ${["→", "↑", "←"][game.passIndex]}</button>` : ""}${game.phase === "draw" ? `<button class="btn" data-action="draw">${tr("Tomar una ficha", "Pick a tile")} ${icons.arrow}</button>` : ""}${game.phase === "discard" ? `<button class="btn" data-action="discard" ${selected.size !== 1 ? "disabled" : ""}>${tr("Descartar", "Discard")} ${selectedTile ? esc(tileLabel(selectedTile.kind, lang)) : tr("una ficha", "one tile")}</button><button class="btn secondary" data-action="win">Mahjong!</button>` : ""}${game.phase === "finished" ? `<button class="btn" data-action="game-menu">${tr("Volver a practicar", "Practice again")}</button>` : ""}<button class="btn subtle" data-action="sort">${tr("Ordenar fichas", "Sort tiles")}</button><button class="btn subtle" data-action="advice">${tr("Dame una pista", "Give me a hint")}</button></div>${showHint ? `<p class="inline-hint" role="status">${esc(shortHint())}</p>` : ""}</div><p class="table-help">${tr("Mesa de aprendizaje: practicamos el primer intercambio de tres pases. La segunda ronda, el pase a ciegas, el intercambio de cortesía y la puntuación quedan fuera de esta simulación. El orden de las compañeras es derecha → enfrente → izquierda.", "Learning table: we practice the first three Charleston passes. The second Charleston, blind passes, courtesy pass and scoring are outside this simulation. Opponents are shown right → across → left.")}</p>${game.phase === "finished" ? finishedHand() : ""}</section><aside class="game-coach"><div class="target-card"><span class="eyebrow" style="margin-bottom:10px">${tr("TU COMBINACIÓN OBJETIVO", "YOUR TARGET HAND")}</span><label class="field" style="margin-bottom:0"><span class="hide">${tr("Elegir combinación", "Choose a target")}</span><select id="target-select">${rank.map((r) => `<option value="${esc(r.pattern.id)}" ${r.pattern.id === pattern.id ? "selected" : ""} ${!r.compatible ? "disabled" : ""}>${esc(patternName(r.pattern))} · ${r.matched}/14</option>`).join("")}</select></label><p style="margin-top:10px">${pattern.source === "personal" ? tr("Añadida por ti · comprueba tu tarjeta 2026.", "Added by you · check your 2026 card.") : tr("Ejercicio didáctico propio · no es una línea oficial 2026.", "Original training hand · not an official 2026 line.")} ${pattern.concealed ? tr("Mano oculta.", "Concealed hand.") : ""}</p>${miniatureGroups(pattern, analysis)}<p class="small muted">${tr("Las fichas claras aún te faltan.", "Faded tiles are still missing.")}</p><div class="match-summary"><strong>${analysis.matched} ${tr("de 14 encajan", "of 14 match")}</strong></div><div class="progress-track"><span style="width:${(analysis.matched / 14) * 100}%"></span></div>${analysis.missing.length ? `<p class="missing-label">${tr("TE FALTAN PARA ESTE OBJETIVO", "STILL NEEDED FOR THIS TARGET")}</p><div class="tile-row" style="justify-content:flex-start;gap:7px">${analysis.missing.map((k) => tileHTML(k, { small: true, disabled: true, lang })).join("")}</div>` : `<p class="small">${tr("¡Todas encajan! Declara Mahjong en tu turno.", "All tiles match! Call Mahjong on your turn.")}</p>`}${unavailable ? `<div class="feedback retry">${esc(unavailable)}</div>` : ""}</div><div class="hint-card"><h3>${icons.spark} ${tr("Tu guía de mesa", "Your table guide")}</h3><p>${showHint ? esc(game.phase === "charleston" ? tr("Conserva las fichas que encajan y pasa tres de las que menos ayudan. Nunca pases comodines. Ya marqué una propuesta; puedes cambiarla.", "Keep tiles that match your target. Pass three less useful tiles, never Jokers. I selected a suggestion; you can change it.") : game.phase === "draw" ? tr("Tienes 13 fichas en total. Primero toma una de la pared; después elegimos cuál descartar.", "You have 13 tiles total. Pick from the wall first, then choose a discard.") : game.phase === "claim" ? tr("Solo reclama si completas un grupo permitido o toda tu mano. Un grupo mostrado ya no puede cambiar.", "Only call to complete a permitted group or your whole hand. An exposed group stays fixed.") : analysis.complete ? tr("Tu mano está completa: declara Mahjong para terminar. No necesitas descartar.", "Your hand is complete: call Mahjong to finish. You do not need to discard.") : hint.tile ? tr(`Para este objetivo, ${tileLabel(hint.tile.kind)} es una candidata a descartar. Te marqué esa candidata; puedes elegir otra y comparar otros objetivos.`, `${tileLabel(hint.tile.kind, "en")} is a discard candidate for this target. I selected that candidate. You can choose another and compare targets too.`) : tr("Tu mano encaja: comprueba el objetivo y declara Mahjong.", "Your hand matches: check the target and call Mahjong.")) : esc(tr("Cuando quieras, pide una pista. Te ayudaré a ver qué conservar y qué falta, usando solo tu mano y las fichas visibles.", "Ask for a hint whenever you like. We use your hand and visible tiles, never your opponents’ hidden tiles."))}</p><button class="text-button hint-toggle" data-action="advice">${tr("Muéstrame una sugerencia", "Show me a suggestion")} →</button></div><div class="target-card"><h3>${tr("El pequeño reto de este turno", "This turn’s small challenge")}</h3><p>${esc(gameMessage())}</p><button class="text-button" data-action="language">${en() ? "Volver al español" : "Probar la mesa en inglés"} →</button></div></aside></div>`;
}
function finishedHand() {
  if (game.winner === null)
    return `<div class="notice">${tr("La pared se terminó. No pasa nada: cada decisión cuenta. Puedes empezar otra mano.", "The wall is empty. Every decision is practice. Start a new hand when you are ready.")}</div>`;
  const winner = game.players[game.winner],
    p = game.patterns.find((p) => p.id === winner.targetId);
  return `<div class="notice"><h3>${game.winner === 0 ? tr("¡Un nuevo logro, " + esc(profile.name) + "!", "A new achievement, " + esc(profile.name) + "!") : tr(esc(winner.name) + " completó su mano.", esc(winner.name) + " completed her hand.")}</h3><p>${tr("Así quedó la combinación ganadora. Puedes compararla con el objetivo.", "Here is the winning hand. Compare it with the target.")}</p>${p ? miniatureGroups(p) : ""}<div class="tile-row">${winner.hand.map((t) => tileHTML(t.kind, { small: true, disabled: true, lang })).join("")}</div>${winner.exposed.map((g, i) => exposureHTML(g, game.winner, i)).join("")}</div>`;
}
function startGame(mode = "guided", patternId) {
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
  selected.clear();
  showHint = false;
  save();
  closeDialog();
  go("mesa" + (en() ? "/en" : ""));
}
function gameAction(action, arg) {
  try {
    if (action === "pass") passTiles(game, [...selected]);
    if (action === "draw") drawTile(game);
    if (action === "discard") discardTile(game, [...selected][0]);
    if (action === "claim") claimDiscard(game, Number(arg));
    if (action === "skip-claim") skipClaim(game);
    if (action === "win") declareMahjong(game);
    selected.clear();
    showHint = false;
    save();
    tone();
    render();
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
function advise() {
  if (!game) return;
  showHint = true;
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
  render();
  if (game.phase === "discard")
    $("#hand")
      ?.querySelector(".selected")
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
const glossary = [
  ["c3", "Círculos", "Dots"],
  ["b3", "Bambúes", "Bams"],
  ["k3", "Caracteres", "Craks"],
  ["f", "Flores", "Flowers"],
  ["j", "Comodín", "Joker"],
  ["dw", "Dragón blanco", "Soap"],
  ["c1", "Ficha suelta", "Single"],
  ["c2", "Pareja", "Pair"],
  ["c3", "Grupo de tres", "Pung"],
  ["c4", "Grupo de cuatro", "Kong"],
  ["c5", "Grupo de cinco", "Quint"],
  ["we", "Viento este", "East"],
];
function reviewPage() {
  return `<div class="page-title"><div><span class="eyebrow">PRIMERO LO ENTIENDES. DESPUÉS LE PONES NOMBRE.</span><h1>Ahora, el inglés te suena.</h1><p>Las fichas son las mismas. Solo cambia cómo las escuchas en una mesa.</p></div></div><div class="notice"><h3>Ya conoces la idea. Une las palabras.</h3><p>Una pareja sigue siendo dos fichas iguales, aunque alguien diga «Pair». Consulta este repaso cuando lo necesites.</p><div class="button-row"><a class="btn" href="#leccion/${LESSONS.at(-1).id}">Probar el reto de vocabulario ${icons.arrow}</a><button class="btn secondary" data-action="english-game">Practicar la mesa en inglés →</button></div></div><div class="glossary">${glossary.map(([k, esName, enName]) => `<div class="glossary-item">${tileHTML(k, { small: true, disabled: true })}<div><strong>${esc(esName)}</strong><span>${esc(enName)}</span></div></div>`).join("")}</div><div class="coach"><h3>Frases que vas a reconocer</h3><p><strong>Pick a tile</strong> → Toma una ficha.<br><strong>Discard</strong> → Descarta una ficha.<br><strong>Call</strong> → Reclama el descarte.<br><strong>Exposed hand</strong> → Mano que permite mostrar grupos.<br><strong>Concealed hand</strong> → Mano oculta.<br><strong>Charleston</strong> → Intercambio inicial.<br><strong>Mahjong!</strong> → ¡Completé mi combinación!</p></div>`;
}
function render() {
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
            : home();
  $("#app").innerHTML = frame(body);
  document.documentElement.lang = en() && page === "mesa" ? "en" : "es";
  document.title =
    (page === "leccion"
      ? "Tu siguiente reto"
      : page === "mesa"
        ? "Tu mesa de práctica"
        : page === "tarjeta"
          ? "Mi tarjeta"
          : "Mahjong") + " · A tu ritmo";
}
function openDialog(html) {
  closeDialog();
  priorFocus = document.activeElement;
  const container = document.createElement("div");
  container.className = "dialog-backdrop";
  container.id = "modal";
  container.innerHTML = `<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${html}</section>`;
  document.body.appendChild(container);
  container.querySelector("input,button,a,select")?.focus();
}
function closeDialog() {
  const modal = $("#modal");
  if (!modal) return;
  modal.remove();
  priorFocus?.focus();
  priorFocus = null;
}
function settings() {
  openDialog(
    `<h2 id="dialog-title">A tu manera.</h2><p>Pequeños detalles para sentirte a gusto.</p><form id="settings-form"><label class="field">¿Cómo quieres que te llamemos?<input name="name" value="${esc(profile.name)}" maxlength="30" required autocomplete="given-name"></label><label class="toggle-label"><input name="sound" type="checkbox" ${profile.sound ? "checked" : ""}>Sonidos suaves al responder y jugar</label><p>Tu progreso y tus líneas personales se guardan en este navegador. En otro dispositivo puedes empezar un camino independiente.</p><div class="button-row"><button class="btn" type="submit">Guardar</button><button class="btn secondary" type="button" data-action="close-dialog">Cerrar</button></div></form><div class="divider"></div><button class="text-button" data-action="reset-confirm">Reiniciar mi progreso</button>`,
  );
}
function gameMenu() {
  openDialog(
    `<h2 id="dialog-title">${tr("Un nuevo pequeño reto.", "A fresh start.")}</h2><p>${tr("La mesa actual será reemplazada. Tus lecciones y líneas personales se conservan.", "Your current table will be replaced. Your lessons and personal lines are kept.")}</p><div class="button-row"><button class="btn" data-action="new-guided">${tr("Mesa guiada", "Guided table")}</button><button class="btn secondary" data-action="new-random">${tr("Reparto al azar", "Random deal")}</button><button class="text-button" data-action="close-dialog">${tr("Seguir aquí", "Stay here")}</button></div>`,
  );
}
function chooseTile(button) {
  const [page] = route();
  const id = button.dataset.id;
  if (page === "leccion") {
    const i = button.closest("[data-exercise-tile]")?.dataset.exerciseTile;
    if (i === undefined) return;
    selected.has(i) ? selected.delete(i) : selected.add(i);
    feedback = null;
    render();
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
    render();
    return;
  }
  if (page === "tarjeta" && button.closest(".editor-grid")) {
    const name = $("#pattern-name").value,
      count = $("#group-count").value,
      concealed = $("#concealed").checked;
    editorKind = button.dataset.tile;
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
  const tile = event.target.closest("button.tile");
  if (tile && !tile.disabled) {
    chooseTile(tile);
    return;
  }
  const choice = event.target.closest("[data-choice]");
  if (choice) {
    chosen = choice.dataset.choice;
    feedback = null;
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
      const [p, g] = exchange.dataset.exchange.split(",").map(Number);
      const own = game.players[0].hand.find(
        (t) => t.kind === game.players[p].exposed[g].kind,
      );
      exchangeJoker(game, own.id, p, g);
      save();
      selected.clear();
      render();
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
  if (action === "sound") {
    profile.sound = !profile.sound;
    save();
    tone();
    render();
    toast(profile.sound ? "Sonidos activados" : "Sonidos desactivados");
  }
  if (action === "settings") settings();
  if (action === "close-dialog") closeDialog();
  if (action === "lesson-check") checkLesson();
  if (action === "lesson-next") {
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
    const { lesson, index } = currentLesson();
    profile.steps[lesson.id] = Math.max(0, index - 1);
    save();
    resetInteraction();
    render();
  }
  if (action === "lesson-repeat") {
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
    const order = [...allKinds, "j"];
    game.players[0].hand.sort(
      (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
    );
    save();
    render();
  }
  if (action === "advice") advise();
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
    profile.steps = {};
    profile.completed = [];
    profile.attempts = {};
    game = null;
    save();
    closeDialog();
    go("inicio");
    render();
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "target-select") {
    game.players[0].targetId = event.target.value;
    selected.clear();
    showHint = false;
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
  resetInteraction();
  closeDialog();
  render();
  window.scrollTo(0, 0);
  $("#main")?.focus();
});
render();
