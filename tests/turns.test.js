import test from "node:test";
import assert from "node:assert/strict";
import {
  TRAINING_PATTERNS,
  createWall,
  newGame,
  passTiles,
  drawTile,
  discardTile,
  advanceBotStep,
  claimDiscard,
  skipClaim,
  declareMahjong,
  exchangeJoker,
  rankPatterns,
  suggestDiscard,
} from "../src/engine.js";

const main = TRAINING_PATTERNS[0];
const full = main.groups.flatMap((g) => Array(g.count).fill(g.kind));
const clone = (state) => JSON.parse(JSON.stringify(state));
const total = (player) =>
  player.hand.length + player.exposed.flatMap((g) => g.tiles).length;

function seeded(seed) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function conserved(state) {
  const tiles = [
    ...state.wall,
    ...state.discards.map((d) => d.tile),
    ...state.players.flatMap((p) => [
      ...p.hand,
      ...p.exposed.flatMap((g) => g.tiles),
    ]),
  ];
  assert.equal(tiles.length, 152);
  assert.equal(new Set(tiles.map((tile) => tile.id)).size, 152);
  assert.deepEqual(
    new Set(tiles.map((tile) => tile.id)),
    new Set(createWall().map((tile) => tile.id)),
  );
}

function drain(state, events = []) {
  let steps = 0;
  while (state.phase === "bots") {
    assert.ok(steps++ < 500, "Los turnos siempre deben llegar a una decisión");
    const before = clone(state);
    advanceBotStep(state);
    const event = state.botEvent;
    assert.equal(event.serial, before.botEventSerial + 1);
    assert.equal(
      before.wall.length - state.wall.length,
      event.type === "draw" ? 1 : 0,
    );
    if (event.type === "turn") {
      assert.deepEqual(state.players, before.players);
      assert.deepEqual(state.discards, before.discards);
    }
    if (event.type === "draw") {
      assert.equal(event.tile, undefined, "No se revela la ficha oculta");
      assert.equal(total(state.players[event.player]), 14);
      assert.deepEqual(state.discards, before.discards);
    }
    if (event.type === "discard") {
      assert.equal(total(state.players[event.player]), 13);
      assert.deepEqual(state.discards.at(-1), {
        player: event.player,
        tile: event.tile,
      });
    }
    if (event.type === "claim") {
      assert.equal(total(state.players[event.player]), 14);
      assert.equal(
        state.players[event.player].exposed.length,
        before.players[event.player].exposed.length + 1,
      );
    }
    conserved(state);
    events.push({ ...event });
  }
  assert.equal(state.botFlow, null);
  return events;
}

/** Reparte fichas reales; el resto de las manos evita los grupos del ejemplo. */
function fixture({ hands = [], top = [], discard, patterns = [main] } = {}) {
  const state = newGame({ mode: "random", rng: seeded(7), patterns });
  state.wall = createWall();
  state.players.forEach((p) => {
    p.hand = [];
    p.exposed = [];
    p.targetId = patterns[0].id;
  });
  const take = (kind) => {
    const at = state.wall.findIndex((tile) => tile.kind === kind);
    assert.ok(at >= 0, `Debe existir una ficha física ${kind}`);
    return state.wall.splice(at, 1)[0];
  };
  hands.forEach((kinds, index) => {
    state.players[index].hand = kinds.map(take);
  });
  state.discards = discard
    ? [{ tile: take(discard.kind), player: discard.player }]
    : [];
  const next = top.map(take);
  const useful = new Set(main.groups.map((group) => group.kind));
  state.players.forEach((player, index) => {
    const size = index === 0 && !discard ? 14 : 13;
    while (player.hand.length < size) {
      const at = state.wall.findIndex(
        (tile) => !useful.has(tile.kind) && tile.kind !== "j",
      );
      assert.ok(at >= 0);
      player.hand.push(...state.wall.splice(at, 1));
    }
  });
  state.wall.push(...next.reverse());
  state.phase = discard ? "claim" : "discard";
  state.turn = 0;
  state.passIndex = 3;
  state.canExchange = true;
  state.claim = discard
    ? {
        ...state.discards.at(-1),
        canWin: false,
        options: [{ groupIndex: 0, patternId: main.id, kind: "c1", count: 3 }],
      }
    : null;
  conserved(state);
  return state;
}

test("Cada compañera muestra su turno, toma y descarte antes de pasar a la siguiente", () => {
  const state = fixture({ top: ["b9", "k9", "wn"] });
  const startWall = state.wall.length;
  discardTile(state, state.players[0].hand[0].id, { deferBots: true });
  assert.equal(state.phase, "bots");
  assert.equal(state.botEvent, null);
  assert.equal(
    state.wall.length,
    startWall,
    "El descarte humano no ejecuta a las compañeras",
  );
  assert.equal(state.canExchange, false);
  const events = drain(state);
  assert.deepEqual(
    events.map(({ type, player }) => [type, player]),
    [
      ["turn", 1],
      ["draw", 1],
      ["discard", 1],
      ["turn", 2],
      ["draw", 2],
      ["discard", 2],
      ["turn", 3],
      ["draw", 3],
      ["discard", 3],
      ["turn", 0],
    ],
  );
  assert.equal(state.phase, "draw");
  assert.equal(state.wall.length, startWall - 3);
  assert.deepEqual(state.players.map(total), [13, 13, 13, 13]);
});

test("Las acciones humanas quedan bloqueadas durante los turnos de las compañeras", () => {
  const state = fixture();
  discardTile(state, state.players[0].hand[0].id, { deferBots: true });
  const before = clone(state);
  const id = state.players[0].hand[0].id;
  for (const action of [
    () => drawTile(state),
    () => discardTile(state, id),
    () => claimDiscard(state),
    () => skipClaim(state),
    () => declareMahjong(state),
    () => exchangeJoker(state, id, 1, 0),
    () => passTiles(state, []),
  ])
    assert.throws(action, /Primero termina/);
  assert.deepEqual(state, before);
});

test("Un reclamo de compañera se muestra antes de descartar y no toma otra ficha", () => {
  const state = fixture({ hands: [["c1"], [], ["c1", "c1"]], top: ["wn"] });
  const startWall = state.wall.length;
  const id = state.players[0].hand.find((tile) => tile.kind === "c1").id;
  discardTile(state, id, { deferBots: true });
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "claim");
  assert.equal(state.botEvent.player, 2);
  assert.equal(state.turn, 2);
  assert.equal(state.botEvent.tile.id, id);
  assert.equal(state.wall.length, startWall);
  assert.equal(total(state.players[2]), 14);
  assert.equal(state.players[2].exposed.length, 1);
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "discard");
  assert.equal(state.botEvent.player, 2);
  assert.equal(state.wall.length, startWall);
  assert.equal(total(state.players[2]), 13);
  const events = drain(state);
  assert.deepEqual(
    events.map(({ type, player }) => [type, player]),
    [
      ["turn", 3],
      ["draw", 3],
      ["discard", 3],
      ["turn", 0],
    ],
  );
  conserved(state);
});

test("Ganar con un descarte tiene prioridad sobre mostrar un grupo", () => {
  const waiting = [...full];
  waiting.splice(waiting.indexOf("c1"), 1);
  const state = fixture({ hands: [["c1"], ["c1", "j"], waiting] });
  const id = state.players[0].hand.find((tile) => tile.kind === "c1").id;
  const startWall = state.wall.length;
  discardTile(state, id, { deferBots: true });
  const events = drain(state);
  assert.deepEqual(
    events.map(({ type, player }) => [type, player]),
    [["win", 2]],
  );
  assert.equal(state.phase, "finished");
  assert.equal(state.winner, 2);
  assert.equal(state.winningClaimTileId, id);
  assert.equal(state.players[1].exposed.length, 0);
  assert.equal(state.wall.length, startWall);
  assert.equal(total(state.players[2]), 14);
});

test("Una ficha ganadora de la pared se toma oculta y se revela en un paso posterior", () => {
  const waiting = [...full];
  waiting.pop();
  const state = fixture({ hands: [[], waiting], top: ["f"] });
  discardTile(state, state.players[0].hand[0].id, { deferBots: true });
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "turn");
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "draw");
  assert.equal(state.botEvent.tile, undefined);
  assert.equal(state.phase, "bots");
  assert.equal(total(state.players[1]), 14);
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "win");
  assert.equal(state.botEvent.source, "wall");
  assert.equal(state.botEvent.tile.kind, "f");
  assert.equal(state.winner, 1);
  assert.equal(state.botFlow, null);
  conserved(state);
});

test("Reclamar para Gaby frena la secuencia; omitir no ofrece otra vez el mismo descarte", () => {
  const rival = {
    id: "rival",
    name: "Rival",
    concealed: false,
    groups: [
      { kind: "b4", count: 4 },
      { kind: "b6", count: 4 },
      { kind: "k8", count: 4 },
      { kind: "f", count: 2 },
    ],
  };
  const rivalHand = rival.groups
    .flatMap((g) => Array(g.count).fill(g.kind))
    .slice(0, 13);
  const state = fixture({
    hands: [["c1", "c1"], rivalHand],
    top: ["c1", "wn", "ws"],
    patterns: [main, rival],
  });
  state.players[1].targetId = rival.id;
  const safe = state.players[0].hand.find((tile) => tile.kind !== "c1").id;
  discardTile(state, safe, { deferBots: true });
  drain(state);
  assert.equal(state.phase, "claim");
  assert.equal(state.botEvent.type, "claim-option");
  assert.equal(state.claim.tile.kind, "c1");
  assert.equal(state.turn, 0);
  const claiming = clone(state);
  claimDiscard(claiming);
  assert.equal(claiming.phase, "discard");
  assert.equal(claiming.canExchange, true);
  assert.equal(total(claiming.players[0]), 14);
  conserved(claiming);

  skipClaim(state, { deferBots: true });
  assert.equal(state.phase, "bots");
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "turn");
  assert.equal(state.botEvent.player, 2);
  const events = drain(state);
  assert.equal(
    events.some((event) => event.type === "claim-option"),
    false,
  );
  assert.equal(state.phase, "draw");
});

test("Guardar y recargar después de tomar conserva el turno y evita una toma duplicada", () => {
  let state = fixture({ top: ["b9", "k9", "wn"] });
  discardTile(state, state.players[0].hand[0].id, { deferBots: true });
  advanceBotStep(state);
  advanceBotStep(state);
  assert.equal(state.botFlow.stage, "afterDraw");
  const immediate = clone(state);
  state = clone(state);
  const wallSize = state.wall.length;
  const serial = state.botEvent.serial;
  advanceBotStep(state);
  assert.equal(state.botEvent.type, "discard");
  assert.equal(state.botEvent.serial, serial + 1);
  assert.equal(state.wall.length, wallSize);
  assert.equal(total(state.players[1]), 13);
  drain(state);
  drain(immediate);
  assert.deepEqual(state, immediate);
});

test("La pared agotada se muestra al siguiente intento de tomar y termina sin nuevas fichas", () => {
  const state = fixture();
  state.discards.push(
    ...state.wall.splice(0).map((tile) => ({ tile, player: 3 })),
  );
  discardTile(state, state.players[0].hand[0].id, { deferBots: true });
  const events = drain(state);
  assert.deepEqual(
    events.map(({ type, player }) => [type, player]),
    [
      ["turn", 1],
      ["end", null],
    ],
  );
  assert.equal(state.phase, "finished");
  assert.equal(state.winner, null);
  assert.equal(state.status, "draw");
  assert.deepEqual(state.players.map(total), [13, 13, 13, 13]);
  assert.throws(() => advanceBotStep(state), /terminó/);
});

test("Los turnos por pasos y los inmediatos producen partidas idénticas, incluso al recargar", () => {
  for (let seed = 1; seed <= 12; seed++) {
    const immediate = newGame({ mode: "random", rng: seeded(seed) });
    for (let n = 0; n < 3; n++)
      passTiles(
        immediate,
        immediate.players[0].hand
          .filter((tile) => tile.kind !== "j")
          .slice(0, 3)
          .map((tile) => tile.id),
      );
    let stepped = clone(immediate);
    let actions = 0;
    while (immediate.phase !== "finished" && actions++ < 500) {
      if (immediate.phase === "draw") {
        drawTile(immediate);
        drawTile(stepped);
      } else if (immediate.phase === "claim") {
        if (immediate.claim.canWin) {
          declareMahjong(immediate);
          declareMahjong(stepped);
        } else if (seed % 2 === 0) {
          claimDiscard(immediate);
          claimDiscard(stepped);
        } else {
          skipClaim(immediate);
          skipClaim(stepped, { deferBots: true });
        }
      } else {
        assert.equal(immediate.phase, "discard");
        const player = immediate.players[0];
        const ranked = rankPatterns(
          player.hand,
          immediate.patterns,
          player.exposed,
        );
        if (ranked.some((result) => result.complete)) {
          declareMahjong(immediate);
          declareMahjong(stepped);
        } else {
          const best =
            ranked.find((result) => result.compatible)?.pattern || main;
          const id = suggestDiscard(player.hand, best, player.exposed).tile.id;
          discardTile(immediate, id);
          discardTile(stepped, id, { deferBots: true });
        }
      }
      // Cada pausa se puede serializar; al recargar sigue desde el mismo paso.
      while (stepped.phase === "bots") {
        stepped = clone(stepped);
        advanceBotStep(stepped);
        conserved(stepped);
      }
      assert.deepEqual(
        stepped,
        immediate,
        `La partida coincide en semilla ${seed}, acción ${actions}`,
      );
      conserved(immediate);
    }
    assert.equal(immediate.phase, "finished");
  }
});
