import { VOCAB, LISTENING_LESSONS } from "./english.js";
import { LESSONS } from "./lessons.js";
import { tileFace, tileLabel } from "./tiles.js";

const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const speaker =
  '<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>';
const wave =
  '<span class="voice-indicator" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';
const isComplete = (profile, id) =>
  Array.isArray(profile?.listeningCompleted)
    ? profile.listeningCompleted.includes(id)
    : Boolean(profile?.listeningCompleted?.[id]);
const savedStep = (profile, lesson) =>
  Math.max(
    0,
    Math.min(
      lesson.steps.length,
      Number(profile?.listeningSteps?.[lesson.id]) || 0,
    ),
  );

function tilePictures(tiles = [], className = "") {
  return `<span class="listening-tiles ${className}" aria-hidden="true">${tiles.map((kind) => `<span class="tile">${tileFace(kind, "en")}</span>`).join("")}</span>`;
}

function voiceButtons(id, supported, revealed = true) {
  const label = revealed
    ? `Escuchar ${VOCAB.find((entry) => entry.id === id)?.en || "pronunciación"}`
    : "Escuchar la palabra del reto";
  return `<div class="voice-buttons"><button type="button" class="btn voice-play" data-speak="${escapeHTML(id)}" aria-label="${escapeHTML(label)}"${supported ? "" : " disabled"}>${speaker}<span>Escuchar</span></button><button type="button" class="btn secondary voice-slow" data-speak="${escapeHTML(id)}" data-slow="true" aria-label="Escuchar más despacio"${supported ? "" : " disabled"}>Más despacio</button><button type="button" class="text-button voice-stop" data-action="voice-stop" aria-label="Detener la voz">Detener</button></div>`;
}

function supportNotice(supported) {
  return supported
    ? ""
    : '<div class="notice listening-unsupported" role="status"><h3>La voz no está disponible en este navegador.</h3><p>Puedes revelar la palabra para seguir practicando. Prueba abrir esta página en Safari o Chrome para escucharla.</p></div>';
}

export function renderEnglishHome({
  profile = {},
  speechSupported = true,
  category = "tile",
  expanded = false,
} = {}) {
  const activeCategory = ["tile", "group", "call", "all"].includes(category)
    ? category
    : "tile";
  const categories = [
    ["tile", "Fichas"],
    ["group", "Grupos"],
    ["call", "En la mesa"],
    ["all", "Todo"],
  ];
  const filtered =
    activeCategory === "all"
      ? VOCAB
      : VOCAB.filter((entry) => entry.kind === activeCategory);
  const completed = LISTENING_LESSONS.filter((lesson) =>
    isComplete(profile, lesson.id),
  ).length;
  const heard = Array.isArray(profile.audioHeard)
    ? VOCAB.filter((entry) => profile.audioHeard.includes(entry.id)).length
    : 0;
  const units = LISTENING_LESSONS.map((lesson, index) => {
    const done = isComplete(profile, lesson.id);
    const progress = done ? lesson.steps.length : savedStep(profile, lesson);
    return `<article class="listening-unit${done ? " is-complete" : ""}"><div class="listening-unit-top"><span class="listening-number">${String(index + 1).padStart(2, "0")}</span><span class="listening-unit-state">${done ? "✓ Completada" : progress ? "Ya empezaste" : "A tu ritmo"}</span></div><h3>${escapeHTML(lesson.title)}</h3><p>${escapeHTML(lesson.subtitle)}</p><div class="listening-unit-progress"><span>${progress} de ${lesson.steps.length} retos</span><div class="progress-track" role="progressbar" aria-label="Progreso de ${escapeHTML(lesson.title)}" aria-valuemin="0" aria-valuemax="${lesson.steps.length}" aria-valuenow="${progress}"><span style="width:${(progress / lesson.steps.length) * 100}%"></span></div></div><a class="btn ${done ? "secondary" : ""}" href="#escuchar/${escapeHTML(lesson.id)}"${done ? ` data-restart-listening="${escapeHTML(lesson.id)}"` : ""}>${done ? "Volver a practicar" : progress ? "Continuar" : "Empezar a escuchar"}<span aria-hidden="true">→</span></a></article>`;
  }).join("");
  const visibleWords = expanded ? filtered : filtered.slice(0, 6);
  const dictionary = visibleWords
    .map(
      (entry) =>
        `<article class="voice-card vocabulary-card" data-voice-id="${escapeHTML(entry.id)}"><div class="vocabulary-visual">${entry.tiles.length ? tilePictures(entry.tiles) : `<span class="vocabulary-phrase-icon" aria-hidden="true">${speaker}</span><span class="small muted">Una frase de la mesa</span>`}</div><div class="vocabulary-heading"><div><h3 lang="en">${escapeHTML(entry.en)}</h3><p>${escapeHTML(entry.es)}</p></div>${wave}</div>${voiceButtons(entry.id, speechSupported)}<span class="voice-status" data-voice-status="${escapeHTML(entry.id)}" aria-live="polite">Toca para escuchar</span><details class="pronunciation-details"><summary>Una pista para decirlo</summary><p>${escapeHTML(entry.pronunciationTip)}</p>${entry.mouth?.cue ? `<p class="mouth-cue"><strong>Prueba el gesto.</strong> ${escapeHTML(entry.mouth.cue)}</p>` : ""}</details></article>`,
    )
    .join("");
  return `<section class="listening-home"><div class="page-title"><div><span class="eyebrow">DEL DIBUJO AL SONIDO, PASO A PASO</span><h1>El inglés también se entrena.</h1><p>Escucha y mira las fichas en la biblioteca. Después, prueba reconocerlas en cuatro retos pequeños.</p></div></div><div class="listening-welcome"><div class="listening-welcome-symbol" aria-hidden="true">${speaker}</div><div><h2>Oye. Reconoce. Repite.</h2><p>Escucha en inglés, con un botón para ir más despacio. No necesitas escribir ni activar el micrófono.</p></div><span class="listening-total">${completed} de ${LISTENING_LESSONS.length}<small>unidades completadas</small></span></div>${supportNotice(speechSupported)}<nav class="listening-section-nav" aria-label="Secciones de inglés"><button type="button" class="btn secondary" data-scroll-to="biblioteca">Mi biblioteca de sonidos</button><button type="button" class="btn secondary" data-scroll-to="metas">Ir a mis cuatro retos ↓</button></nav><section id="biblioteca" class="listening-library" aria-labelledby="biblioteca-title" tabindex="-1"><div class="section-line listening-dictionary-title"><div><span class="eyebrow">TU BIBLIOTECA DE SONIDOS</span><h2 id="biblioteca-title">Así se oye en la mesa.</h2><p>Escucha, mira las fichas y une cada palabra con lo que ya sabes.</p></div><span class="listening-heard">${heard} de ${VOCAB.length} sonidos explorados</span></div><div class="vocabulary-filters" aria-label="Filtrar vocabulario">${categories.map(([id, label]) => `<button type="button" data-vocab-category="${id}" aria-pressed="${activeCategory === id}"${activeCategory === id ? ' class="active"' : ""}>${label}</button>`).join("")}</div><div class="vocabulary-grid" id="vocabulary-list">${dictionary}</div><div class="vocabulary-library-actions"><span class="small muted">${visibleWords.length} de ${filtered.length} sonidos de esta sección</span>${filtered.length > 6 ? `<button type="button" class="btn secondary" data-action="vocab-expand" aria-expanded="${Boolean(expanded)}" aria-controls="vocabulary-list">${expanded ? "Ver menos sonidos" : `Ver todos los sonidos (${filtered.length})`}</button>` : ""}<button type="button" class="text-button" data-scroll-to="metas">Ahora, practicar con mis retos ↓</button></div></section><section id="metas" class="listening-goals" aria-labelledby="metas-title" tabindex="-1"><div class="section-line"><div><h2 id="metas-title">Cuatro metas pequeñas</h2><p>Empieza por las familias o elige lo que quieras reforzar.</p></div><button type="button" class="text-button" data-scroll-to="biblioteca">Volver a la biblioteca ↑</button></div><div class="listening-units">${units}</div></section><aside class="listening-finish-card"><div><h2>Llévalo a tu partida.</h2><p>Cuando te sientas lista, reconoce las palabras entre jugadas.</p></div><div class="button-row"><a class="btn secondary" href="#leccion/${escapeHTML(LESSONS.at(-1).id)}">Repasar el reto de vocabulario</a><button class="btn" type="button" data-action="english-game">Mi mesa en inglés →</button></div></aside><p class="listening-audio-note">Priorizamos una voz de inglés estadounidense; la voz disponible depende de tu dispositivo. Las voces y los efectos tienen controles independientes.</p></section>`;
}

function completeLesson(lesson, profile) {
  const index = LISTENING_LESSONS.findIndex((item) => item.id === lesson.id);
  const next = LISTENING_LESSONS[index + 1];
  return `<section class="listening-complete"><span class="listening-complete-icon" aria-hidden="true">✓</span><span class="eyebrow">UNA META MÁS, ${escapeHTML(profile?.name || "Gaby")}</span><h1>Ya te suena<br>un poco más.</h1><p>Completaste «${escapeHTML(lesson.title)}». Sonidos, dibujos y significados empiezan a ir juntos.</p><p class="muted">Escuchar otra vez también es practicar. Vuelve cuando quieras, sin prisa.</p><div class="button-row">${next ? `<a class="btn" href="#escuchar/${escapeHTML(next.id)}">Siguiente unidad →</a>` : '<button class="btn" type="button" data-action="english-game">Probar mi mesa en inglés →</button>'}<button type="button" class="btn secondary" data-action="listening-repeat" data-lesson="${escapeHTML(lesson.id)}">Repetir esta unidad</button><a class="text-button" href="#repaso">Volver a los sonidos</a></div></section>`;
}

export function renderListeningLesson({
  lesson,
  stepIndex = 0,
  selectedId = null,
  feedback = null,
  showText = false,
  speechSupported = true,
  hasListened = false,
  profile = {},
} = {}) {
  if (!lesson?.steps?.length)
    return '<div class="notice"><h1>Elige un reto para escuchar.</h1><a class="btn" href="#repaso">Ver las unidades →</a></div>';
  if (stepIndex >= lesson.steps.length) return completeLesson(lesson, profile);
  const index = Math.max(0, Math.floor(Number(stepIndex) || 0));
  const step = lesson.steps[index];
  const entry = VOCAB.find((item) => item.id === step.audioId);
  const revealed = Boolean(showText || feedback);
  const canAnswer = Boolean(hasListened || revealed);
  const successful = feedback?.ok === true;
  const allPictures = step.choices.every(
    (choice) => choice.tiles?.length && !choice.label,
  );
  const choices = step.choices
    .map((choice, choiceIndex) => {
      const selected = choice.id === selectedId;
      const label =
        choice.label ||
        choice.tiles?.map((kind) => tileLabel(kind, "es")).join(", ") ||
        `Opción ${choiceIndex + 1}`;
      const correct = Boolean(feedback) && choice.id === step.answerId;
      return `<button type="button" class="listening-choice${selected ? " is-selected" : ""}${correct ? " is-correct" : ""}${feedback && !feedback.ok && selected ? " is-retry" : ""}" data-listening-answer="${escapeHTML(choice.id)}" aria-label="${escapeHTML(`Opción ${choiceIndex + 1}: ${label}`)}" aria-pressed="${selected}"${successful ? " disabled" : ""}>${choice.tiles?.length ? tilePictures(choice.tiles) : ""}${choice.label ? `<span class="listening-choice-label">${escapeHTML(choice.label)}</span>` : `<span class="listening-option-label">Opción ${choiceIndex + 1}</span>`}${selected ? '<span class="listening-choice-check" aria-hidden="true">✓</span>' : ""}</button>`;
    })
    .join("");
  return `<section class="listening-lesson"><a class="back-link" href="#repaso">← Mis sonidos en inglés</a><div class="listening-lesson-heading"><div><span class="eyebrow">ESCUCHAR TAMBIÉN ES PRACTICAR</span><h1>${escapeHTML(lesson.title)}</h1></div><span class="listening-step-count">Reto ${index + 1} de ${lesson.steps.length}</span></div><div class="listening-lesson-track progress-track" role="progressbar" aria-label="Retos completados" aria-valuemin="0" aria-valuemax="${lesson.steps.length}" aria-valuenow="${index}"><span style="width:${(index / lesson.steps.length) * 100}%"></span></div>${supportNotice(speechSupported)}<div class="listening-exercise"><div class="voice-card listening-player" data-voice-id="${escapeHTML(step.audioId)}"><div class="listening-player-head">${wave}<span class="listening-player-caption">Inglés · puedes repetirlo</span></div><h2>${revealed ? `<span lang="en">${escapeHTML(entry?.en || "")}</span>` : "Primero, escucha."}</h2>${revealed ? `<p class="listening-translation">${escapeHTML(entry?.es || "")}</p>` : "<p>Deja que el sonido te dé la pista.</p>"}${voiceButtons(step.audioId, speechSupported, revealed)}<span class="voice-status" data-voice-status="${escapeHTML(step.audioId)}" aria-live="polite">${hasListened ? "Ya lo escuchaste. Puedes volver a oírlo." : "Toca Escuchar para empezar"}</span>${!revealed ? '<button type="button" class="text-button listening-reveal" data-action="listening-reveal">Necesito ver la palabra y su significado</button>' : ""}</div><div class="listening-answer-area"><h2>${escapeHTML(step.prompt)}</h2><p class="listening-answer-note">${hasListened || revealed ? "Elige una opción. Puedes escuchar otra vez antes de decidir." : "Escucha primero; después toca el dibujo o el significado."}</p><div class="listening-choices${allPictures ? " is-pictures" : ""}">${choices}</div>${feedback ? `<div class="feedback${feedback.ok ? "" : " retry"}" role="status"><strong>${feedback.ok ? "¡Eso es! Ya uniste sonido y significado." : "Vamos a unirlo una vez más."}</strong>${escapeHTML(step.explanation)}</div>` : ""}${revealed ? `<aside class="listening-pronunciation"><h3>Escucha y prueba decirlo.</h3><p>${escapeHTML(entry?.pronunciationTip || step.tip || "Puedes volver a escucharlo y repetirlo sin prisa.")}</p>${entry?.mouth?.cue ? `<p class="mouth-cue"><strong>Una pista para tu boca.</strong> ${escapeHTML(entry.mouth.cue)}</p>` : ""}<span class="small muted">Repite para ti. No grabamos ni evaluamos tu voz.</span></aside>` : step.tip ? `<p class="listening-gentle-tip">${escapeHTML(step.tip)}</p>` : ""}</div></div><div class="listening-actions"><button type="button" class="btn subtle" data-action="listening-back"${index ? "" : " disabled"}>← Anterior</button>${successful ? `<button type="button" class="btn" data-action="listening-next">${index + 1 === lesson.steps.length ? "Completar unidad" : "Siguiente reto"} →</button>` : `<button type="button" class="btn" data-action="listening-check"${!selectedId || !canAnswer ? " disabled" : ""}>${feedback ? "Comprobar otra vez" : "Comprobar"}</button>`}</div><p class="listening-audio-note">Priorizamos una voz de inglés estadounidense; la voz disponible depende de tu dispositivo.</p></section>`;
}
