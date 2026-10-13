import { tileLabel } from "./tiles.js";

// Escenarios propios. No reproducen líneas de una tarjeta oficial.
// Los datos de cada escenario también permiten comprobar sus reglas en el motor.
const variants = [
  {
    groups: [
      ["c2", 3],
      ["c5", 3],
      ["b4", 3],
      ["k7", 3],
      ["f", 2],
    ],
    extra: "k9",
  },
  {
    groups: [
      ["b3", 3],
      ["b6", 3],
      ["k4", 3],
      ["c8", 3],
      ["dr", 2],
    ],
    extra: "c9",
  },
];

const expand = (groups) =>
  groups.flatMap((group) => Array(group.count).fill(group.kind));
const withoutOne = (tiles, kind) => {
  const copy = [...tiles];
  copy.splice(copy.indexOf(kind), 1);
  return copy;
};
const choice = (id, label) => ({ id, label });
const targetSection = (target) => ({
  label: "Objetivo de entrenamiento · 14 fichas",
  tiles: expand(target.groups),
  groups: target.groups,
});

export function createReadinessRound(variant = 0) {
  const value = Number(variant);
  const variantIndex = Number.isFinite(value)
    ? ((Math.trunc(value) % variants.length) + variants.length) %
      variants.length
    : 0;
  const selected = variants[variantIndex];
  const target = {
    id: `decision-target-${variantIndex}`,
    name: "Objetivo de esta práctica",
    source: "training",
    concealed: false,
    groups: selected.groups.map(([kind, count]) => ({ kind, count })),
  };
  const fullHand = expand(target.groups);
  const pairKind = target.groups.at(-1).kind;
  const claimKind = target.groups[0].kind;
  const neededKind = target.groups[1].kind;
  const beforeDraw = withoutOne(fullHand, neededKind);
  const discardHand = [...beforeDraw, selected.extra];
  const claimHand = [
    ...withoutOne(withoutOne(fullHand, claimKind), pairKind),
    selected.extra,
  ];
  const jokerHand = [...withoutOne(fullHand, pairKind), "j"];
  const extraLabel = tileLabel(selected.extra);
  const neededLabel = tileLabel(neededKind);
  const claimLabel = tileLabel(claimKind);

  const round = {
    id: `cuatro-decisiones-${variantIndex}`,
    variant: variantIndex,
    steps: [
      {
        id: "ritmo",
        title: "Después de tomar una ficha",
        prompt:
          "Tenías 13 fichas y acabas de tomar una. Tu mano aún no completa el objetivo. ¿Qué sigue?",
        contextSections: [
          { label: "Tu mano antes de tomar · 13 fichas", tiles: beforeDraw },
          { label: "La ficha que acabas de tomar", tiles: [selected.extra] },
        ],
        choices: [
          choice("tomar-otra", "Tomar otra ficha de la pared"),
          choice("descartar", "Elegir una ficha y descartarla"),
        ],
        answerId: "descartar",
        reasonChoices: [
          choice(
            "ritmo-turno",
            "En un turno normal, tomo una y descarto una para conservar 13 mientras no gane.",
          ),
          choice(
            "seguir-tomando",
            "Puedo seguir tomando fichas en el mismo turno hasta encontrar una que sirva.",
          ),
        ],
        reasonAnswerId: "ritmo-turno",
        explanation:
          "Ahora tienes 14. Como la mano no está completa, decides qué conservar y descartas una para volver a 13. La siguiente toma será en otro turno.",
        hint: "Cuenta lo que tienes después de tomar. Recuerda cuántas fichas conservas entre tus turnos mientras la mano no gana.",
        reviewLessonId: "turnos",
        scenario: {
          phase: "discard",
          hand: discardHand,
          beforeDraw,
          drawnTile: selected.extra,
          target,
        },
      },
      {
        id: "descarte",
        title: "Una decisión con un motivo",
        prompt:
          "Compara tu mano con este objetivo. Entre estas dos fichas, ¿cuál soltarías para conservar lo que encaja?",
        contextSections: [
          targetSection(target),
          { label: "Tu mano ahora · 14 fichas", tiles: discardHand },
        ],
        choices: [
          choice("conservar-necesaria", `Descartar ${neededLabel}`),
          choice("soltar-extra", `Descartar ${extraLabel}`),
        ],
        answerId: "soltar-extra",
        reasonChoices: [
          choice(
            "numero-menor",
            "Conviene descartar siempre la ficha que tenga el número más bajo.",
          ),
          choice(
            "encaja-objetivo",
            "Conservo las fichas que necesita el objetivo y suelto una que queda fuera.",
          ),
        ],
        reasonAnswerId: "encaja-objetivo",
        explanation: `${extraLabel} queda fuera de este objetivo. ${neededLabel} sí forma parte de un trío que todavía debes completar. La elección depende del objetivo, no de que un número sea alto o bajo.`,
        hint: "Compara número, familia y cantidad. Busca qué ficha aparece en tu mano pero no tiene un lugar en el objetivo.",
        reviewLessonId: "estrategia",
        scenario: {
          phase: "discard",
          hand: discardHand,
          target,
          preferredDiscard: selected.extra,
          otherCandidate: neededKind,
        },
      },
      {
        id: "reclamo",
        title: "Si decides pedir el descarte",
        prompt:
          "Este objetivo permite grupos mostrados. Si pides el último descarte para formar el trío, ¿cómo sigue tu turno?",
        contextSections: [
          targetSection(target),
          { label: "Tus fichas antes de pedir · 13 fichas", tiles: claimHand },
          {
            label: "Último descarte · puedes pedirlo ahora",
            tiles: [claimKind],
          },
        ],
        choices: [
          choice(
            "mostrar-descartar",
            "Mostrar el trío completo y después descartar una ficha",
          ),
          choice(
            "guardar-tomar",
            "Guardar la ficha sin mostrar el trío y tomar otra de la pared",
          ),
        ],
        answerId: "mostrar-descartar",
        reasonChoices: [
          choice(
            "toma-extra",
            "Pedir un descarte me da una ficha extra y luego puedo tomar otra.",
          ),
          choice(
            "grupo-visible",
            "Pedir este descarte sustituye la toma; el grupo queda visible y mi turno termina con un descarte.",
          ),
        ],
        reasonAnswerId: "grupo-visible",
        explanation: `Tus dos ${claimLabel} y el descarte forman el trío del objetivo. Lo muestras y luego descartas una ficha de tu mano. El grupo queda fijo y no tomas otra ficha de la pared en ese turno.`,
        hint: "Distingue tomar de la pared y pedir el último descarte. Al pedirlo para formar un grupo, colocas ese grupo a la vista de las demás.",
        reviewLessonId: "turnos",
        scenario: {
          phase: "claim",
          hand: claimHand,
          target,
          discard: claimKind,
          groupIndex: 0,
          preferredDiscard: selected.extra,
        },
      },
      {
        id: "pareja",
        title: "Antes de anunciar que ganaste",
        prompt:
          "Tienes 14 fichas. Compáralas con todos los grupos del objetivo. ¿Esta mano ya permite anunciar Mahjong?",
        contextSections: [
          targetSection(target),
          { label: "Tu mano · 14 fichas", tiles: jokerHand },
        ],
        choices: [
          choice("ganar", "Sí, ya puedo anunciar Mahjong"),
          choice("seguir", "Todavía falta una ficha; sigo jugando"),
        ],
        answerId: "seguir",
        reasonChoices: [
          choice(
            "pareja-real",
            "Una pareja necesita sus dos fichas reales; el comodín no puede sustituir una de ellas.",
          ),
          choice(
            "comodin-cualquiera",
            "El comodín puede cubrir cualquier hueco de una mano de 14 fichas.",
          ),
        ],
        reasonAnswerId: "pareja-real",
        explanation:
          "El objetivo pide dos fichas reales para la pareja; aquí tienes una y un comodín. Los otros grupos encajan, pero el comodín no completa una pareja. Tener 14 fichas es necesario; también deben cumplir todo el objetivo.",
        hint: "Revisa cada grupo por separado, incluida la pareja. Pregúntate qué tamaños de grupo admiten comodines.",
        reviewLessonId: "grupos",
        scenario: { phase: "discard", hand: jokerHand, target, pairKind },
      },
    ],
  };
  // Cambia la posición de las opciones junto con las fichas. Cada llamada
  // construye sus propios datos: repetir no modifica una ronda ya abierta.
  return {
    ...round,
    steps: round.steps.map((step) => ({
      ...step,
      choices: variantIndex ? [...step.choices].reverse() : [...step.choices],
      reasonChoices: variantIndex
        ? [...step.reasonChoices].reverse()
        : [...step.reasonChoices],
    })),
  };
}

export function evaluateReadiness(
  step,
  { choice: decision = null, reason = null } = {},
) {
  const decisionOk = Boolean(
    step &&
      decision &&
      step.choices.some((option) => option.id === decision) &&
      decision === step.answerId,
  );
  const reasonOk = Boolean(
    step &&
      reason &&
      step.reasonChoices.some((option) => option.id === reason) &&
      reason === step.reasonAnswerId,
  );
  const ok = decisionOk && reasonOk;
  const introduction = ok
    ? "Tu decisión y tu motivo encajan. "
    : decisionOk
      ? "La acción encaja. Revisa el motivo para entender por qué. "
      : reasonOk
        ? "El motivo es útil. Busca una acción que siga esa misma idea. "
        : "Compara de nuevo las fichas y la regla. Puedes cambiar tu respuesta o pedir una pista. ";
  return {
    ok,
    decisionOk,
    reasonOk,
    message:
      introduction +
      (step?.explanation ||
        "Elige una decisión y un motivo para comprobarlos."),
  };
}
