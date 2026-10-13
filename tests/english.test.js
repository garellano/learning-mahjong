import test from "node:test";
import assert from "node:assert/strict";
import { VOCAB, LISTENING_LESSONS, ENGLISH_SOURCES } from "../src/english.js";
import { createWall } from "../src/engine.js";
import { LESSONS } from "../src/lessons.js";

const kinds = new Set(createWall().map((tile) => tile.kind));
const vocabulary = new Map(VOCAB.map((word) => [word.id, word]));

test("El vocabulario enlaza sonidos, significados y fichas reales sin nombres duplicados", () => {
  assert.ok(VOCAB.length >= 24 && VOCAB.length <= 32);
  assert.equal(vocabulary.size, VOCAB.length);
  for (const word of VOCAB) {
    assert.ok(/^[a-z]+(?:-[a-z]+)*$/.test(word.id), word.id);
    assert.ok(word.en && word.es && word.pronunciationTip, word.id);
    assert.ok(["tile", "group", "call"].includes(word.kind), word.id);
    assert.ok(Array.isArray(word.tiles), word.id);
    assert.ok(
      word.tiles.every((kind) => kinds.has(kind)),
      word.id,
    );
    if (word.kind !== "call") assert.ok(word.tiles.length > 0, word.id);
    assert.ok(word.mouth?.cue, word.id);
    // Solo se contextualizan dos heterónimos, con frases inglesas naturales.
    // No se escriben pronunciaciones aproximadas en español para la voz.
    if (word.speech) {
      assert.equal(
        word.speech,
        { winds: "The winds", discard: "Discard a tile" }[word.id],
        word.id,
      );
      assert.ok(word.pronunciationTip.includes(word.speech), word.id);
    }
  }
});

test("Los retos de escucha tienen audios existentes y una respuesta alcanzable", () => {
  assert.equal(LISTENING_LESSONS.length, 4);
  assert.equal(new Set(LISTENING_LESSONS.map((lesson) => lesson.id)).size, 4);
  const stepIds = new Set();
  for (const lesson of LISTENING_LESSONS) {
    assert.ok(lesson.title && lesson.subtitle, lesson.id);
    assert.equal(lesson.steps.length, 6, lesson.id);
    for (const step of lesson.steps) {
      assert.ok(!stepIds.has(step.id), step.id);
      stepIds.add(step.id);
      assert.ok(step.prompt && step.explanation, step.id);
      assert.ok(vocabulary.has(step.audioId), step.id);
      assert.ok(step.choices.length >= 2, step.id);
      assert.equal(
        new Set(step.choices.map((choice) => choice.id)).size,
        step.choices.length,
        step.id,
      );
      assert.equal(
        step.choices.filter((choice) => choice.id === step.answerId).length,
        1,
        step.id,
      );
      for (const choice of step.choices) {
        assert.ok(choice.label || choice.tiles?.length, step.id);
        assert.ok(!choice.en, step.id);
        if (choice.tiles)
          assert.ok(
            choice.tiles.every((kind) => kinds.has(kind)),
            step.id,
          );
      }
    }
  }
  assert.equal(stepIds.size, 24);
});

test("Cada respuesta visual representa exactamente las fichas del audio, sin revelar la palabra antes", () => {
  for (const lesson of LISTENING_LESSONS) {
    for (const step of lesson.steps) {
      const word = vocabulary.get(step.audioId);
      const correct = step.choices.find(
        (choice) => choice.id === step.answerId,
      );
      if (correct.tiles) assert.deepEqual(correct.tiles, word.tiles, step.id);
      const english = word.en.replace(/[!.,]/g, "").toLowerCase();
      assert.ok(!step.prompt.toLowerCase().includes(english), step.id);
      for (const choice of step.choices) {
        if (choice.label)
          assert.ok(!choice.label.toLowerCase().includes(english), step.id);
      }
    }
  }
});

test("La práctica conserva grupos legales y diferencia el pájaro, el dragón blanco y los vientos", () => {
  assert.deepEqual(vocabulary.get("one-bam").tiles, ["b1"]);
  assert.deepEqual(vocabulary.get("soap").tiles, ["dw"]);
  assert.deepEqual(vocabulary.get("white-dragon").tiles, ["dw"]);
  assert.deepEqual(vocabulary.get("west").tiles, ["ww"]);
  for (const [id, count] of [
    ["single", 1],
    ["pair", 2],
    ["pung", 3],
    ["kong", 4],
    ["quint", 5],
  ]) {
    const tiles = vocabulary.get(id).tiles;
    assert.equal(tiles.length, count, id);
    assert.equal(new Set(tiles.filter((kind) => kind !== "j")).size, 1, id);
    if (count <= 2) assert.ok(!tiles.includes("j"), id);
    assert.ok(tiles.filter((kind) => kind !== "j").length <= 4, id);
  }
  assert.ok(!vocabulary.get("charleston").tiles.includes("j"));
  assert.ok(!vocabulary.get("pass-three").tiles.includes("j"));
});

test("Las fuentes de nombres y pronunciación son enlaces primarios y la progresión inicial sigue en español", () => {
  assert.ok(ENGLISH_SOURCES.length >= 5);
  for (const source of ENGLISH_SOURCES) {
    assert.ok(source.title);
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:");
    assert.ok(
      [
        "guide.americanmahjonggassociation.com",
        "dictionary.cambridge.org",
      ].includes(url.hostname),
    );
  }
  assert.equal(LESSONS.length, 7);
  assert.equal(LESSONS.at(-1).id, "ingles");
  for (const lesson of LESSONS.slice(0, 6)) {
    assert.ok(!lesson.listening, lesson.id);
    for (const step of lesson.steps) assert.ok(!step.audioId, lesson.id);
  }
});

test("La voz recibe contexto real para distinguir vientos y la instrucción de descartar", () => {
  assert.equal(vocabulary.get("winds").en, "Winds");
  assert.equal(vocabulary.get("winds").speech, "The winds");
  assert.equal(vocabulary.get("discard").en, "Discard");
  assert.equal(vocabulary.get("discard").speech, "Discard a tile");
  const discard = LISTENING_LESSONS.flatMap((lesson) => lesson.steps).find(
    (step) => step.audioId === "discard",
  );
  assert.ok(discard.explanation.includes("Discard a tile"));
});
