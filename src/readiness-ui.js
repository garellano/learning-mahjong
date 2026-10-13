import { tileFace, tileLabel } from "./tiles.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const lessonNames = {
  turnos: "Tomar, pedir y descartar",
  estrategia: "Elegir qué conservar",
  grupos: "Grupos y comodines",
};
const picture = (kind) =>
  `<span class="readiness-tile" role="img" aria-label="${esc(tileLabel(kind))}">${tileFace(kind)}</span>`;

function contextSection(section) {
  const groups = section.groups
    ? section.groups
        .map(
          (group) =>
            `<span class="readiness-tile-group" aria-label="Grupo de ${group.count}">${Array.from({ length: group.count }, () => picture(group.kind)).join("")}</span>`,
        )
        .join("")
    : section.tiles.map(picture).join("");
  return `<section class="readiness-context-card${section.groups ? " readiness-target" : ""}"><h2>${esc(section.label)}</h2><div class="readiness-tiles">${groups}</div></section>`;
}

function options(items, selected, type, disabled) {
  return items
    .map(
      (option) =>
        `<button type="button" class="readiness-option${selected === option.id ? " is-selected" : ""}" data-readiness-${type}="${esc(option.id)}" aria-pressed="${selected === option.id}"${disabled ? " disabled" : ""}><span class="readiness-option-mark" aria-hidden="true">${selected === option.id ? "✓" : ""}</span><span>${esc(option.label)}</span></button>`,
    )
    .join("");
}

function completed(round, results) {
  const resolved = round.steps.map((step, index) => ({
    step,
    result:
      results.find((result) => result?.stepId === step.id) || results[index],
  }));
  const known = resolved.filter(({ result }) => result && result.ok !== false);
  const independent = known.filter(
    ({ result }) => !result.hintUsed && result.attempts === 1,
  ).length;
  const supported = known.filter(({ result }) => result.hintUsed).length;
  const retried = known.filter(({ result }) => result.attempts > 1).length;
  const review = [
    ...new Set(
      resolved
        .filter(
          ({ result }) => !result || result.hintUsed || result.attempts > 1,
        )
        .map(({ step }) => step.reviewLessonId),
    ),
  ];
  const reviewIds = review.length
    ? review
    : [...new Set(round.steps.map((step) => step.reviewLessonId))];
  return `<section class="readiness-page readiness-complete"><a class="back-link" href="#inicio">← Mi camino</a><span class="eyebrow">LO QUE DESCUBRISTE AL DECIDIR</span><h1>Cuatro decisiones,<br>a tu manera.</h1><p>Practicaste el ritmo del turno, un descarte, un grupo mostrado y la revisión de una mano. La próxima mano tendrá otras fichas: vuelve a compararlas antes de decidir.</p>${known.length ? `<div class="readiness-reflection" aria-label="Cómo practicaste"><p><strong>${independent}</strong> al primer intento y sin pista</p><p><strong>${supported}</strong> con una pista o un repaso</p><p><strong>${retried}</strong> después de volver a probar</p></div><p class="small muted">Una decisión puede incluir una pista y otro intento. Son formas de practicar, sin puntos ni penalizaciones.</p>` : ""}<div class="readiness-next"><h2>${review.length ? "Puedes reforzar estas ideas" : "Para volver cuando quieras"}</h2><p>Elige un repaso o prueba decisiones distintas en la mesa.</p><div class="readiness-review-links">${reviewIds.map((id) => `<a class="btn secondary" data-review-lesson="${esc(id)}" href="#leccion/${esc(id)}">${esc(lessonNames[id] || id)} →</a>`).join("")}</div></div><div class="button-row"><a class="btn" href="#mesa">Probar mi mesa en español →</a><button type="button" class="btn secondary" data-action="readiness-repeat">Probar con otras fichas</button></div></section>`;
}

export function renderReadiness({
  round,
  index = 0,
  choice = null,
  reason = null,
  feedback = null,
  hintUsed = false,
  results = [],
} = {}) {
  if (!round?.steps?.length)
    return '<section class="readiness-page"><h1>Una decisión a la vez.</h1><a class="btn" href="#inicio">Volver a mi camino →</a></section>';
  const currentIndex = Math.max(0, Math.floor(Number(index) || 0));
  if (currentIndex >= round.steps.length) return completed(round, results);
  const step = round.steps[currentIndex];
  const successful = feedback?.ok === true;
  return `<section class="readiness-page"><a class="back-link" href="#inicio">← Mi camino</a><div class="readiness-heading"><div><span class="eyebrow">AHORA PRUEBA TU DECISIÓN</span><h1>${esc(step.title)}</h1></div><span class="readiness-count">${currentIndex + 1} de ${round.steps.length}</span></div><p class="readiness-intro">Elige qué harías y por qué. Puedes cambiar de idea, pedir ayuda o volver a intentar.</p><div class="readiness-progress progress-track" role="progressbar" aria-label="Decisiones practicadas" aria-valuenow="${currentIndex}" aria-valuemin="0" aria-valuemax="${round.steps.length}"><span style="width:${(currentIndex / round.steps.length) * 100}%"></span></div><div class="readiness-challenge"><div class="readiness-context">${step.contextSections.map(contextSection).join("")}<p class="readiness-original small muted">Las combinaciones son ejercicios originales para aprender.</p></div><div class="readiness-decision"><h2>${esc(step.prompt)}</h2><fieldset><legend>1. ¿Qué harías?</legend><div class="readiness-options">${options(step.choices, choice, "choice", successful)}</div></fieldset><fieldset><legend>2. ¿Por qué?</legend><div class="readiness-options">${options(step.reasonChoices, reason, "reason", successful)}</div></fieldset>${hintUsed ? `<aside class="readiness-hint" role="status"><strong>Una pista para comparar.</strong><p>${esc(step.hint)}</p></aside>` : '<button type="button" class="text-button readiness-hint-button" data-action="readiness-hint">Necesito una pista</button>'}${feedback ? `<div class="feedback readiness-feedback${successful ? "" : " retry"}" role="status"><strong>${successful ? "Decisión comprobada." : "Puedes volver a probar."}</strong>${esc(feedback.message)}</div>` : ""}</div></div><div class="readiness-actions"><a class="text-button" data-review-lesson="${esc(step.reviewLessonId)}" href="#leccion/${esc(step.reviewLessonId)}">Repasar esta idea</a>${successful ? `<button type="button" class="btn" data-action="readiness-next">${currentIndex + 1 === round.steps.length ? "Ver cómo practiqué" : "Siguiente decisión"} →</button>` : `<button type="button" class="btn" data-action="readiness-check"${!choice || !reason ? " disabled" : ""}>${feedback ? "Comprobar otra vez" : "Comprobar decisión y motivo"}</button>`}</div></section>`;
}
