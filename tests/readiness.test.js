import test from "node:test";
import assert from "node:assert/strict";
import { createReadinessRound, evaluateReadiness } from "../src/readiness.js";
import { renderReadiness } from "../src/readiness-ui.js";
import {
  createWall,
  analyzeHand,
  suggestDiscard,
  newGame,
  drawTile,
  discardTile,
  advanceBotStep,
  claimDiscard,
  declareMahjong,
} from "../src/engine.js";

const pick = (kinds, wall = createWall()) =>
  kinds.map((kind) => {
    const index = wall.findIndex((tile) => tile.kind === kind);
    assert.ok(index >= 0, `Existe físicamente ${kind}`);
    return wall.splice(index, 1)[0];
  });

function stateFor(scenario) {
  const target = scenario.target;
  const state = newGame({ patterns: [target], mode: "random", rng: () => 0.4 });
  state.wall = createWall();
  state.players.forEach((player) => {
    player.hand = [];
    player.exposed = [];
    player.targetId = target.id;
  });
  state.players[0].hand = pick(scenario.hand, state.wall);
  state.discards = [];
  state.phase = scenario.phase;
  state.turn = 0;
  state.passIndex = 3;
  state.claim = null;
  return state;
}

test("Las dos variantes son reproducibles y cada una plantea cuatro decisiones con sus motivos", () => {
  assert.deepEqual(createReadinessRound(0), createReadinessRound(2));
  assert.deepEqual(createReadinessRound(1), createReadinessRound(-1));
  assert.deepEqual(createReadinessRound("otra"), createReadinessRound(0));
  assert.notDeepEqual(
    createReadinessRound(0).steps[1].scenario.hand,
    createReadinessRound(1).steps[1].scenario.hand,
  );
  for (const variant of [0, 1]) {
    const round = createReadinessRound(variant);
    assert.equal(round.steps.length, 4);
    assert.equal(new Set(round.steps.map((step) => step.id)).size, 4);
    for (const step of round.steps) {
      assert.equal(step.choices.length, 2);
      assert.equal(step.reasonChoices.length, 2);
      assert.ok(step.choices.some((option) => option.id === step.answerId));
      assert.ok(
        step.reasonChoices.some((option) => option.id === step.reasonAnswerId),
      );
      assert.equal(
        step.scenario.target.groups.reduce(
          (total, group) => total + group.count,
          0,
        ),
        14,
      );
      assert.equal(
        analyzeHand(createWall(), step.scenario.target).complete,
        false,
      );
      assert.equal(analyzeHand(createWall(), step.scenario.target).matched, 14);
      assert.ok(step.hint);
    }
  }
});

test("Al cambiar de variante cambian las posiciones de decisiones y motivos, sin alterar otra ronda", () => {
  const first = createReadinessRound(0);
  const snapshot = structuredClone(first);
  const second = createReadinessRound(1);
  for (let index = 0; index < first.steps.length; index++) {
    const a = first.steps[index];
    const b = second.steps[index];
    assert.equal(a.id, b.id);
    assert.equal(a.answerId, b.answerId);
    assert.equal(a.reasonAnswerId, b.reasonAnswerId);
    assert.deepEqual(
      a.choices.map((option) => option.id),
      [...b.choices].reverse().map((option) => option.id),
    );
    assert.deepEqual(
      a.reasonChoices.map((option) => option.id),
      [...b.reasonChoices].reverse().map((option) => option.id),
    );
    assert.notEqual(
      a.choices.findIndex((option) => option.id === a.answerId),
      b.choices.findIndex((option) => option.id === b.answerId),
    );
    assert.notEqual(
      a.reasonChoices.findIndex((option) => option.id === a.reasonAnswerId),
      b.reasonChoices.findIndex((option) => option.id === b.reasonAnswerId),
    );
    assert.equal(
      evaluateReadiness(b, { choice: b.answerId, reason: b.reasonAnswerId }).ok,
      true,
    );
    assert.notDeepEqual(a.scenario.target.groups, b.scenario.target.groups);
  }
  second.steps[0].choices.reverse();
  second.steps[0].scenario.target.groups[0].count = 99;
  assert.deepEqual(first, snapshot);
  assert.deepEqual(createReadinessRound(0), snapshot);
  assert.equal(
    createReadinessRound(1).steps[0].scenario.target.groups[0].count,
    3,
  );
});

test("El ritmo parte de 13, tomar da 14 y un descarte devuelve 13 en ambas variantes", () => {
  for (const variant of [0, 1]) {
    const scenario = createReadinessRound(variant).steps[0].scenario;
    assert.equal(scenario.beforeDraw.length, 13);
    assert.equal(scenario.hand.length, 14);
    assert.equal(
      analyzeHand(pick(scenario.hand), scenario.target).complete,
      false,
    );
    const state = stateFor(scenario);
    state.players[0].hand = pick(scenario.beforeDraw);
    state.wall = pick([scenario.drawnTile]);
    state.phase = "draw";
    drawTile(state);
    assert.equal(state.players[0].hand.length, 14);
    discardTile(state, state.players[0].hand.at(-1).id, { deferBots: true });
    assert.equal(state.players[0].hand.length, 13);
  }
});

test("El descarte propuesto conserva más fichas del objetivo que la otra opción", () => {
  for (const variant of [0, 1]) {
    const scenario = createReadinessRound(variant).steps[1].scenario;
    const hand = pick(scenario.hand);
    const spare = hand.find((tile) => tile.kind === scenario.preferredDiscard);
    const useful = hand.find((tile) => tile.kind === scenario.otherCandidate);
    const withoutSpare = analyzeHand(
      hand.filter((tile) => tile.id !== spare.id),
      scenario.target,
    );
    const withoutUseful = analyzeHand(
      hand.filter((tile) => tile.id !== useful.id),
      scenario.target,
    );
    assert.ok(withoutSpare.matched > withoutUseful.matched);
    assert.equal(
      suggestDiscard(hand, scenario.target).tile.kind,
      scenario.preferredDiscard,
    );
  }
});

test("El descarte de los escenarios forma un trío válido, expuesto y seguido de descarte, sin ganar", () => {
  for (const variant of [0, 1]) {
    const scenario = createReadinessRound(variant).steps[2].scenario;
    const state = stateFor(scenario);
    const tile = pick([scenario.discard], state.wall)[0];
    assert.equal(state.players[0].hand.length, 13);
    assert.equal(
      state.players[0].hand.filter((own) => own.kind === tile.kind).length,
      2,
    );
    assert.equal(
      analyzeHand([...state.players[0].hand, tile], scenario.target).complete,
      false,
    );
    state.discards = [{ tile, player: 3 }];
    state.phase = "bots";
    state.botFlow = { stage: "resolve", from: 3, skipHuman: false };
    advanceBotStep(state);
    assert.equal(state.phase, "claim");
    assert.equal(state.claim.canWin, false);
    assert.ok(
      state.claim.options.some(
        (option) =>
          option.groupIndex === scenario.groupIndex && option.count === 3,
      ),
    );
    claimDiscard(state, scenario.groupIndex);
    assert.equal(state.phase, "discard");
    assert.equal(state.players[0].exposed.length, 1);
    assert.equal(state.players[0].exposed[0].tiles.length, 3);
    assert.equal(state.players[0].hand.length, 11);
    assert.throws(() => drawTile(state));
    const spare = state.players[0].hand.find(
      (own) => own.kind === scenario.preferredDiscard,
    );
    discardTile(state, spare.id, { deferBots: true });
    assert.equal(
      state.players[0].hand.length + state.players[0].exposed[0].tiles.length,
      13,
    );
  }
});

test("Una pareja incompleta no gana con un comodín aunque haya 14 fichas", () => {
  for (const variant of [0, 1]) {
    const scenario = createReadinessRound(variant).steps[3].scenario;
    const state = stateFor(scenario);
    const analysis = analyzeHand(state.players[0].hand, scenario.target);
    assert.equal(state.players[0].hand.length, 14);
    assert.equal(analysis.complete, false);
    assert.deepEqual(analysis.missing, [scenario.pairKind]);
    assert.throws(() => declareMahjong(state));
    const naturalPair = scenario.hand.map((kind) =>
      kind === "j" ? scenario.pairKind : kind,
    );
    assert.equal(
      analyzeHand(pick(naturalPair), scenario.target).complete,
      true,
    );
  }
});

test("La evaluación necesita una decisión y un motivo correctos y permite corregir cada uno", () => {
  for (const step of [0, 1].flatMap(
    (variant) => createReadinessRound(variant).steps,
  )) {
    assert.equal(
      evaluateReadiness(step, {
        choice: step.answerId,
        reason: step.reasonAnswerId,
      }).ok,
      true,
    );
    const otherChoice = step.choices.find(
      (choice) => choice.id !== step.answerId,
    ).id;
    const otherReason = step.reasonChoices.find(
      (reason) => reason.id !== step.reasonAnswerId,
    ).id;
    const decisionOnly = evaluateReadiness(step, {
      choice: step.answerId,
      reason: otherReason,
    });
    assert.equal(decisionOnly.ok, false);
    assert.equal(decisionOnly.decisionOk, true);
    assert.equal(decisionOnly.reasonOk, false);
    const reasonOnly = evaluateReadiness(step, {
      choice: otherChoice,
      reason: step.reasonAnswerId,
    });
    assert.equal(reasonOnly.ok, false);
    assert.equal(reasonOnly.reasonOk, true);
    assert.equal(
      evaluateReadiness(step, { choice: "ajena", reason: "ajena" }).ok,
      false,
    );
    assert.equal(evaluateReadiness(step).ok, false);
  }
});

test("La vista inicial oculta explicación y pista, y conserva selecciones accesibles al reintentar", () => {
  const round = createReadinessRound();
  const step = round.steps[1];
  const initial = renderReadiness({ round, index: 1 });
  assert.ok(!initial.includes(step.explanation));
  assert.ok(!initial.includes(step.hint));
  assert.match(initial, /data-action="readiness-check" disabled/);
  assert.equal((initial.match(/data-readiness-choice=/g) || []).length, 2);
  assert.equal((initial.match(/data-readiness-reason=/g) || []).length, 2);
  const feedback = evaluateReadiness(step, {
    choice: step.answerId,
    reason: "otra",
  });
  const retry = renderReadiness({
    round,
    index: 1,
    choice: step.answerId,
    reason: "otra",
    hintUsed: true,
    feedback,
  });
  assert.ok(retry.includes(step.hint));
  assert.match(
    retry,
    new RegExp(`data-readiness-choice="${step.answerId}" aria-pressed="true"`),
  );
  assert.match(retry, /data-action="readiness-check">Comprobar otra vez/);
  assert.match(retry, /class="feedback readiness-feedback retry"/);
  assert.match(
    retry,
    /data-review-lesson="estrategia" href="#leccion\/estrategia"/,
  );
  assert.ok(!retry.includes('data-action="readiness-next"'));
});

test("El cierre refleja ayuda e intentos sin afirmar dominio y enlaza repaso y mesa", () => {
  const round = createReadinessRound();
  const results = round.steps.map((step, index) => ({
    stepId: step.id,
    ok: true,
    attempts: index === 2 ? 2 : 1,
    hintUsed: index === 1,
  }));
  const html = renderReadiness({ round, index: 4, results });
  assert.match(html, /<strong>2<\/strong> al primer intento y sin pista/);
  assert.match(html, /<strong>1<\/strong> con una pista/);
  assert.match(html, /<strong>1<\/strong> después de volver a probar/);
  assert.match(html, /href="#leccion\/estrategia"/);
  assert.match(html, /href="#leccion\/turnos"/);
  assert.match(html, /data-review-lesson="turnos" href="#leccion\/turnos"/);
  assert.match(html, /href="#mesa"/);
  assert.match(html, /data-action="readiness-repeat"/);
  assert.doesNotMatch(html, /dominas|lista para jugar|has aprendido/i);
});
