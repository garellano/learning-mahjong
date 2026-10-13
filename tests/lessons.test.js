import test from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "../src/lessons.js";
import { createWall } from "../src/engine.js";
import { tileFace, tileHTML, tileLabel } from "../src/tiles.js";

const kinds = [...new Set(createWall().map((tile) => tile.kind))];
const exercises = LESSONS.flatMap((lesson) => lesson.steps);

test("Cada reto tiene una respuesta comprobable, sin respuestas vacías ni índices inexistentes", () => {
  assert.equal(LESSONS.length, 7);
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, 7);
  for (const lesson of LESSONS) {
    assert.ok(
      lesson.steps.length >= 3 && lesson.steps.length <= 5,
      lesson.title,
    );
    for (const step of lesson.steps) {
      const context = `${lesson.id}: ${step.title}`;
      assert.ok(
        step.title &&
          step.text &&
          step.task.prompt &&
          step.task.success &&
          step.task.explanation,
        context,
      );
      assert.ok(
        step.tiles.length > 0 &&
          step.tiles.every((kind) => kinds.includes(kind)),
        context,
      );
      const { task } = step;
      if (task.type === "select") {
        assert.ok(
          Array.isArray(task.answer) && task.answer.length > 0,
          context,
        );
        assert.equal(new Set(task.answer).size, task.answer.length, context);
        assert.ok(
          task.answer.every(
            (index) =>
              Number.isInteger(index) &&
              index >= 0 &&
              index < step.tiles.length,
          ),
          context,
        );
        // Cada selección tiene al menos una ficha que se debe dejar sin tocar.
        assert.ok(task.answer.length < step.tiles.length, context);
      } else {
        assert.equal(task.type, "choice", context);
        assert.ok(
          typeof task.answer === "string" && task.answer.length > 0,
          context,
        );
        assert.ok(task.options.length >= 2, context);
        assert.ok(
          task.options.every((option) => option.id && option.label),
          context,
        );
        assert.equal(
          new Set(task.options.map((option) => option.id)).size,
          task.options.length,
          context,
        );
        assert.equal(
          task.options.filter((option) => option.id === task.answer).length,
          1,
          context,
        );
      }
    }
  }
});

test("Las respuestas de reconocimiento seleccionan la familia solicitada y todas sus fichas", () => {
  const recognition = LESSONS[0].steps;
  const families = [/^c[1-9]$/, /^b[1-9]$/, /^k[1-9]$/, /^w[eswn]$/, /^j$/];
  recognition.forEach((step, index) => {
    const expected = step.tiles.flatMap((kind, tileIndex) =>
      families[index].test(kind) ? [tileIndex] : [],
    );
    assert.deepEqual(step.task.answer, expected, step.title);
  });
  const dotsEnglish = LESSONS.at(-1).steps[0];
  assert.deepEqual(
    dotsEnglish.task.answer,
    dotsEnglish.tiles.flatMap((kind, index) =>
      kind.startsWith("c") ? [index] : [],
    ),
  );
});

test("Las parejas enseñadas tienen dos fichas idénticas, y los tríos y cuartetos sus cantidades exactas", () => {
  const grouping = LESSONS[1].steps.slice(0, 3);
  grouping.forEach((step, index) => {
    const selected = step.task.answer.map((answer) => step.tiles[answer]);
    assert.equal(selected.length, index + 2, step.title);
    assert.equal(new Set(selected).size, 1, step.title);
    assert.ok(!selected.includes("j"), step.title);
  });
  const pairEnglish = LESSONS.at(-1).steps[1];
  const selectedPair = pairEnglish.task.answer.map(
    (index) => pairEnglish.tiles[index],
  );
  assert.equal(selectedPair.length, 2);
  assert.equal(selectedPair[0], selectedPair[1]);
  assert.ok(selectedPair[0] !== "j");
});

test("Los retos de comodines y Charleston conservan las restricciones que enseñan", () => {
  const groups = LESSONS[1].steps;
  assert.equal(groups[3].task.answer, "si");
  assert.deepEqual(groups[3].tiles, ["c6", "c6", "j"]);
  assert.equal(groups[4].task.answer, "no");
  const passing = LESSONS.find((lesson) => lesson.id === "charleston").steps[0];
  const passed = passing.task.answer.map((index) => passing.tiles[index]);
  assert.equal(passed.length, 3);
  assert.ok(!passed.includes("j"));
  assert.deepEqual(
    passing.tiles.filter((_, index) => !passing.task.answer.includes(index)),
    ["c2", "c2", "j"],
  );
  const completing = LESSONS.find((lesson) => lesson.id === "estrategia")
    .steps[1];
  assert.deepEqual(
    completing.task.answer.map((index) => completing.tiles[index]),
    ["c3", "j"],
  );
});

test("Todas las fichas físicas tienen SVG propio y nombre accesible en español e inglés", () => {
  assert.equal(kinds.length, 36);
  const drawings = new Set();
  for (const kind of kinds) {
    const svg = tileFace(kind);
    drawings.add(svg);
    assert.match(svg, /^<svg /, kind);
    assert.match(svg, /viewBox="0 0 72 96"/, kind);
    assert.doesNotMatch(svg, /[\u{1F000}-\u{1F02F}]/u, kind);
    for (const lang of ["es", "en"]) {
      const label = tileLabel(kind, lang);
      assert.ok(label && !/Unknown|desconocida/.test(label), kind);
      const html = tileHTML(kind, { lang, selected: true });
      assert.ok(html.includes(`aria-label="${label}"`), kind);
      assert.match(html, /type="button"/);
      assert.match(html, /aria-pressed="true"/);
    }
  }
  assert.equal(drawings.size, kinds.length);
});

test("Las caras inglesas cambian las iniciales visibles y mantienen el nombre correcto", () => {
  assert.match(tileFace("ww"), />O<\/text>/);
  assert.match(tileFace("ww", "en"), />W<\/text>/);
  assert.match(tileHTML("ww", { lang: "en" }), /aria-label="West wind"/);
  assert.match(tileHTML("ww", { lang: "en" }), />W<\/text>/);
  assert.match(tileFace("dg"), />V<\/text>/);
  assert.match(tileFace("dg", "en"), />G<\/text>/);
  assert.match(tileHTML("dg", { lang: "en" }), /aria-label="Green dragon"/);
  assert.match(tileHTML("dg", { lang: "en" }), />G<\/text>/);
});

test("Las etiquetas y los identificadores no pueden introducir HTML en el botón", () => {
  const html = tileHTML("c1", { id: '\" onclick=\"alert(1)<', label: true });
  assert.ok(html.includes('data-id="&quot; onclick=&quot;alert(1)&lt;"'));
  assert.ok(!html.includes('data-id="" onclick='));
  assert.match(html, /class="tile-caption"/);
  assert.ok(exercises.length >= 28);
});
