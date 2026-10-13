import test from "node:test";
import assert from "node:assert/strict";
import {
  selectionImpact,
  lessonHint,
  selectionFeedback,
} from "../src/guidance.js";
import { TRAINING_PATTERNS, createWall } from "../src/engine.js";

const handOf = (kinds) =>
  kinds.map((kind, index) => ({ kind, id: `${kind}-${index}` }));
const target = TRAINING_PATTERNS[0];

test("comparison recognizes an excess identical tile, including the first physical copy", () => {
  const hand = handOf([
    "c1",
    "c1",
    "c1",
    "c1",
    "c2",
    "c2",
    "c2",
    "c3",
    "c3",
    "c3",
    "c4",
    "c4",
    "c4",
    "f",
  ]);
  const result = selectionImpact(hand, target, [], [hand[0].id]);
  assert.equal(result.before, 13);
  assert.equal(result.after, 13);
  assert.equal(result.lost, 0);
});

test("comparison explains a useful tile, a tile outside the target and a complete hand", () => {
  const hand = handOf([
    "c1",
    "c1",
    "c1",
    "c2",
    "c2",
    "c2",
    "c3",
    "c3",
    "c3",
    "c4",
    "c4",
    "c4",
    "f",
    "b8",
  ]);
  assert.equal(selectionImpact(hand, target, [], [hand[0].id]).lost, 1);
  assert.equal(selectionImpact(hand, target, [], [hand.at(-1).id]).lost, 0);
  hand.at(-1).kind = "f";
  assert.equal(selectionImpact(hand, target, [], [hand[0].id]).complete, true);
});

test("passing comparison counts the three selected physical tiles and keeps exposed groups fixed", () => {
  const wall = createWall();
  const take = (kind) =>
    wall.splice(
      wall.findIndex((tile) => tile.kind === kind),
      1,
    )[0];
  const exposed = [{ kind: "c1", tiles: [take("c1"), take("c1"), take("c1")] }];
  const hand = [
    take("c2"),
    take("c2"),
    take("c2"),
    take("b8"),
    take("k9"),
    take("wn"),
  ];
  const ids = hand.slice(-3).map((tile) => tile.id);
  assert.equal(selectionImpact(hand, target, exposed, ids).after, 6);
  assert.equal(selectionImpact(hand, target, exposed, ids).lost, 0);
  assert.equal(hand.length, 6);
});

test("quantity feedback supports correcting selection without naming the solution", () => {
  const task = { type: "select", answer: [0, 3] };
  assert.match(selectionFeedback(task, 3), /Seleccionaste 3.*buscamos 2/);
  assert.equal(selectionFeedback(task, 2), "");
  assert.equal(selectionFeedback({ type: "choice" }, 0), "");
  assert.match(lessonHint({ id: "turnos" }, {}), /no tomas además/);
  assert.equal(
    lessonHint({ id: "familias" }, { tip: "Mi pista específica" }),
    "Mi pista específica",
  );
});
