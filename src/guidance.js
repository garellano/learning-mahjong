import { analyzeHand } from "./engine.js";

// Compare the hand that would remain, rather than treating a physical tile ID
// assigned to a group as indispensable when another identical tile can fill it.
export function selectionImpact(hand, pattern, exposed = [], ids = []) {
  const selected = new Set(ids);
  const before = analyzeHand(hand, pattern, exposed);
  const after = analyzeHand(
    hand.filter((tile) => !selected.has(tile.id)),
    pattern,
    exposed,
  );
  return {
    before: before.matched,
    after: after.matched,
    lost: Math.max(0, before.matched - after.matched),
    complete: before.complete,
    selected: hand.filter((tile) => selected.has(tile.id)),
  };
}

export function lessonHint(lesson, step) {
  if (step.tip) return step.tip;
  return (
    {
      familias:
        "Compara los dibujos: círculos, cañas y caracteres. El pájaro pertenece a los bambúes.",
      grupos:
        "Cuenta las fichas iguales. Revisa su número y familia; el comodín solo sustituye en grupos de tres o más iguales.",
      tarjeta:
        "Compara los grupos y sus cantidades con el objetivo. Reunir 14 fichas es solo una parte de la revisión.",
      charleston:
        "Mira qué fichas encajan con el objetivo de este ejemplo. Conserva los comodines y vuelve a revisar lo que recibes.",
      turnos:
        "Identifica qué es tuyo y cuál es el último descarte. Si reclamas un grupo, lo muestras y después descartas; no tomas además de la pared.",
      estrategia:
        "Compara número, familia y cantidad de cada grupo del objetivo. Una ficha de otra familia no sustituye a la que buscas.",
      ingles:
        "Escucha una vez más y relaciona el sonido con el dibujo o la idea que ya conoces.",
    }[lesson.id] ||
    "Compara una parte a la vez. Puedes volver a intentar sin perder progreso."
  );
}

export function selectionFeedback(task, count) {
  if (task.type !== "select" || count === task.answer.length) return "";
  return `Seleccionaste ${count}. En este reto buscamos ${task.answer.length}. Toca otra vez una ficha para quitarla de la selección.`;
}
