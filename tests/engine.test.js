import test from "node:test";
import assert from "node:assert/strict";
import {
  createWall,
  shuffle,
  tileName,
  TRAINING_PATTERNS,
  analyzeHand,
  rankPatterns,
  suggestDiscard,
  newGame,
  passTiles,
  drawTile,
  discardTile,
  claimDiscard,
  skipClaim,
  declareMahjong,
  exchangeJoker,
} from "../src/engine.js";

function seeded(seed = 42) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function pick(kinds) {
  const wall = createWall();
  return kinds.map((kind) => {
    const index = wall.findIndex((t) => t.kind === kind);
    assert.ok(index >= 0, `No physical ${kind} remains`);
    return wall.splice(index, 1)[0];
  });
}
const fullKinds = [
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
  "f",
];
const main = TRAINING_PATTERNS[0];
function allTiles(state) {
  return [
    ...state.wall,
    ...state.discards.map((d) => d.tile),
    ...state.players.flatMap((p) => [
      ...p.hand,
      ...p.exposed.flatMap((g) => g.tiles),
    ]),
  ];
}
function conserved(state) {
  const tiles = allTiles(state);
  assert.equal(tiles.length, 152);
  assert.equal(new Set(tiles.map((t) => t.id)).size, 152);
  assert.deepEqual(
    new Set(tiles.map((t) => t.id)),
    new Set(createWall().map((t) => t.id)),
  );
}
function afterCharleston(state) {
  for (let i = 0; i < 3; i++)
    passTiles(
      state,
      state.players[0].hand
        .filter((t) => t.kind !== "j")
        .slice(0, 3)
        .map((t) => t.id),
    );
  return state;
}
// Reparto físico controlado para comprobar reclamos y finales sin depender del azar.
function fixture(humanKinds, lastDiscardKind, customPatterns = [main]) {
  const state = newGame({
    patterns: customPatterns,
    rng: seeded(7),
    mode: "random",
  });
  state.wall = createWall();
  state.players.forEach((p) => {
    p.hand = [];
    p.exposed = [];
    p.targetId = customPatterns[0].id;
  });
  const remove = (kind) =>
    state.wall.splice(
      state.wall.findIndex((t) => t.kind === kind),
      1,
    )[0];
  state.players[0].hand = humanKinds.map(remove);
  state.discards = lastDiscardKind
    ? [{ tile: remove(lastDiscardKind), player: 3 }]
    : [];
  // Rivales sin tríos de un mismo grupo de entrenamiento, para aislar la acción.
  const safe = [
    "wn",
    "ws",
    "dg",
    "dr",
    "k1",
    "k2",
    "k4",
    "k5",
    "b1",
    "b3",
    "b5",
    "b7",
    "b8",
  ];
  for (let p = 1; p < 4; p++) state.players[p].hand = safe.map(remove);
  state.phase = lastDiscardKind ? "claim" : "discard";
  state.turn = 0;
  state.canExchange = true;
  state.passIndex = 3;
  state.claim = lastDiscardKind
    ? { tile: state.discards[0].tile, player: 3, options: [], canWin: false }
    : null;
  return state;
}

test("La pared tiene 152 fichas físicas: cuatro por ficha, ocho flores y ocho comodines", () => {
  const wall = createWall();
  assert.equal(wall.length, 152);
  assert.equal(new Set(wall.map((t) => t.id)).size, 152);
  assert.equal(wall.filter((t) => t.kind === "j").length, 8);
  assert.equal(wall.filter((t) => t.kind === "f").length, 8);
  assert.equal(wall.filter((t) => t.kind === "c1").length, 4);
  assert.equal(wall.filter((t) => /^w/.test(t.kind)).length, 16);
  assert.equal(wall.filter((t) => /^d/.test(t.kind)).length, 12);
});

test("La mezcla es reproducible, conserva fichas y no altera la entrada", () => {
  const wall = createWall();
  assert.deepEqual(shuffle(wall, seeded()), shuffle(wall, seeded()));
  assert.deepEqual(wall, createWall());
  assert.notDeepEqual(shuffle(wall, seeded()), wall);
  assert.equal(tileName("c3"), "3 de círculos");
  assert.equal(tileName("dg", "en"), "Green dragon");
});

test("Los seis ejemplos originales suman 14 y se pueden formar con una pared real", () => {
  assert.equal(TRAINING_PATTERNS.length, 6);
  for (const p of TRAINING_PATTERNS) {
    assert.equal(p.source, "training");
    assert.equal(
      p.groups.reduce((n, g) => n + g.count, 0),
      14,
    );
    assert.equal(analyzeHand(createWall(), p).matched, 14);
  }
});

test("Solo gana una mano exacta de 14; ni fichas sobrantes ni IDs repetidos ganan", () => {
  const hand = pick(fullKinds);
  assert.equal(analyzeHand(hand, main).complete, true);
  assert.equal(
    analyzeHand([...hand, { id: "extra", kind: "wn" }], main).complete,
    false,
  );
  assert.equal(
    analyzeHand([...hand.slice(0, 13), hand[0]], main).compatible,
    false,
  );
});

test("Un comodín completa un trío y un grupo de cinco, pero nunca una pareja o una ficha sola", () => {
  const hand = pick([...fullKinds.slice(0, 11), "j", "f", "f"]);
  const result = analyzeHand(hand, main);
  assert.equal(result.complete, true);
  assert.equal(result.jokerIds.length, 1);
  const withoutPair = analyzeHand(
    pick([...fullKinds.slice(0, 12), "f", "j"]),
    main,
  );
  assert.equal(withoutPair.complete, false);
  assert.deepEqual(withoutPair.missing, ["f"]);
  const single = TRAINING_PATTERNS[5];
  const natural = single.groups.flatMap((g) => Array(g.count).fill(g.kind));
  natural[natural.lastIndexOf("b9")] = "j";
  assert.equal(analyzeHand(pick(natural), single).complete, true);
  natural[0] = "j";
  assert.deepEqual(analyzeHand(pick(natural), single).missing, ["c1"]);
});

test("Los grupos expuestos quedan fijos y se cuentan en las 14 fichas", () => {
  const hand = pick(fullKinds);
  const exposure = { kind: "c1", count: 3, tiles: hand.splice(0, 3) };
  assert.equal(analyzeHand(hand, main, [exposure]).complete, true);
  assert.equal(
    analyzeHand(hand, TRAINING_PATTERNS[1], [exposure]).compatible,
    false,
  );
  assert.equal(
    analyzeHand(hand, { ...main, concealed: true }, [exposure]).compatible,
    false,
  );
  assert.equal(
    analyzeHand(hand, main, [{ ...exposure, count: 4 }]).compatible,
    false,
  );
});

test("El consejo conserva los grupos útiles y la clasificación reconoce la mano cercana", () => {
  const hand = pick([...fullKinds.slice(0, 13), "wn"]);
  assert.equal(rankPatterns(hand)[0].pattern.id, main.id);
  assert.equal(suggestDiscard(hand, main).tile.kind, "wn");
  assert.deepEqual(suggestDiscard(hand, main).missing, ["f"]);
});

test("Reparto y primer Charleston conservan las 152 fichas, sin pasar comodines", () => {
  const state = newGame({ rng: seeded() });
  assert.deepEqual(
    state.players.map((p) => p.hand.length),
    [14, 13, 13, 13],
  );
  assert.equal(state.wall.length, 99);
  assert.ok(analyzeHand(state.players[0].hand, main).matched >= 11);
  conserved(state);
  assert.throws(() => passTiles(state, []), /tres/);
  const joker = state.players[0].hand.find((t) => t.kind === "j");
  if (joker)
    assert.throws(
      () =>
        passTiles(state, [
          joker.id,
          ...state.players[0].hand
            .filter((t) => t.kind !== "j")
            .slice(0, 2)
            .map((t) => t.id),
        ]),
      /comodines/,
    );
  afterCharleston(state);
  assert.equal(state.passIndex, 3);
  assert.equal(state.phase, "discard");
  assert.equal(state.turn, 0);
  assert.equal(state.canExchange, false);
  assert.deepEqual(
    state.players.map((p) => p.hand.length),
    [14, 13, 13, 13],
  );
  conserved(state);
});

test("No se admiten patrones imposibles o que no suman 14", () => {
  assert.throws(
    () =>
      newGame({ patterns: [{ ...main, groups: [{ kind: "c1", count: 3 }] }] }),
    /14/,
  );
  const impossible = {
    ...main,
    groups: [
      { kind: "c1", count: 6 },
      { kind: "c1", count: 6 },
      { kind: "c1", count: 2 },
    ],
  };
  assert.throws(() => newGame({ patterns: [impossible] }), /pared/);
});

test("Reclamar un trío toma el descarte, expone el grupo y obliga a descartar", () => {
  const kinds = [
    "c1",
    "c1",
    "c2",
    "c2",
    "c3",
    "c3",
    "c4",
    "c4",
    "f",
    "f",
    "b9",
    "b9",
    "j",
  ];
  const state = fixture(kinds, "c1");
  state.claim.options = [
    { groupIndex: 0, patternId: main.id, kind: "c1", count: 3 },
  ];
  claimDiscard(state, 0);
  assert.equal(state.phase, "discard");
  assert.equal(state.players[0].exposed[0].tiles.length, 3);
  assert.equal(state.players[0].hand.length, 11);
  assert.equal(state.discards.length, 0);
  conserved(state);
});

test("Un reclamo puede usar la ficha que también necesita una suelta del mismo tipo", () => {
  const personal = {
    id: "personal-overlap",
    name: "Suelta y trío",
    source: "personal",
    concealed: false,
    groups: [
      { kind: "c1", count: 1 },
      { kind: "c1", count: 3 },
      { kind: "b2", count: 4 },
      { kind: "k3", count: 4 },
      { kind: "f", count: 2 },
    ],
  };
  const rivalTarget = {
    id: "rival",
    name: "Rival",
    source: "training",
    concealed: false,
    groups: [
      { kind: "b4", count: 4 },
      { kind: "b6", count: 4 },
      { kind: "k8", count: 4 },
      { kind: "f", count: 2 },
    ],
  };
  const state = fixture(
    [
      "c1",
      "j",
      "b2",
      "b2",
      "b2",
      "k3",
      "k3",
      "k3",
      "f",
      "f",
      "wn",
      "ws",
      "dr",
      "dg",
    ],
    null,
    [personal, rivalTarget],
  );
  state.wall.push(...state.players[1].hand);
  state.players[1].hand = [
    "b4",
    "b4",
    "b4",
    "b4",
    "b6",
    "b6",
    "b6",
    "b6",
    "k8",
    "k8",
    "k8",
    "k8",
    "f",
  ].map(
    (kind) =>
      state.wall.splice(
        state.wall.findIndex((t) => t.kind === kind),
        1,
      )[0],
  );
  state.players[1].targetId = rivalTarget.id;
  const nextC1 = state.wall.splice(
    state.wall.findIndex((t) => t.kind === "c1"),
    1,
  )[0];
  state.wall.push(nextC1);
  discardTile(state, state.players[0].hand.find((t) => t.kind === "dg").id);
  assert.equal(state.phase, "claim");
  assert.equal(state.claim.tile.kind, "c1");
  assert.ok(state.claim.options.some((option) => option.groupIndex === 1));
  conserved(state);
  claimDiscard(state, 1);
  assert.deepEqual(
    state.players[0].exposed[0].tiles.map((t) => t.kind).sort(),
    ["c1", "c1", "j"],
  );
  const result = analyzeHand(
    state.players[0].hand,
    personal,
    state.players[0].exposed,
  );
  assert.equal(result.compatible, true);
  assert.deepEqual(result.groups[0].missing, ["c1"]);
  assert.equal(
    state.players[0].hand.length +
      state.players[0].exposed.flatMap((g) => g.tiles).length,
    14,
  );
  conserved(state);
});

test("Se puede reclamar para ganar con pareja; la declaración prematura explica el error", () => {
  const state = fixture(fullKinds.slice(0, 13), "f");
  state.claim.canWin = true;
  declareMahjong(state);
  assert.equal(state.winner, 0);
  assert.equal(state.phase, "finished");
  assert.equal(state.players[0].hand.length, 14);
  assert.equal(state.winningClaimTileId, state.players[0].hand.at(-1).id);
  conserved(state);
  const incomplete = fixture([...fullKinds.slice(0, 12), "b9", "b9"]);
  assert.throws(() => declareMahjong(incomplete), /falta/);
});

test("El intercambio de comodín sustituye fichas físicas sin duplicarlas", () => {
  const state = fixture([...fullKinds.slice(3), "c1", "b9", "b9"]);
  const natural = state.players[0].hand.find((t) => t.kind === "c1");
  const kinds = ["c1", "c1", "j"];
  const tiles = kinds.map(
    (kind) =>
      state.wall.splice(
        state.wall.findIndex((t) => t.kind === kind),
        1,
      )[0],
  );
  // El rival pasa de trece ocultas a diez ocultas + tres expuestas.
  state.wall.push(...state.players[1].hand.splice(0, 3));
  state.players[1].exposed = [{ kind: "c1", count: 3, tiles }];
  const jokerId = tiles.find((t) => t.kind === "j").id;
  state.canExchange = false;
  assert.throws(
    () => exchangeJoker(state, natural.id, 1, 0),
    /primer descarte/,
  );
  state.canExchange = true;
  exchangeJoker(state, natural.id, 1, 0);
  assert.ok(state.players[0].hand.some((t) => t.id === jokerId));
  assert.ok(state.players[1].exposed[0].tiles.some((t) => t.id === natural.id));
  conserved(state);
});

test("Los turnos de rivales, reclamos y robos conservan fichas durante partidas completas", () => {
  let endings = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const state = afterCharleston(
      newGame({ mode: "random", rng: seeded(seed) }),
    );
    let actions = 0;
    while (state.phase !== "finished" && actions++ < 500) {
      const player = state.players[0];
      if (state.phase === "draw") drawTile(state);
      else if (state.phase === "claim") {
        if (state.claim.canWin) declareMahjong(state);
        else if (seed % 2 === 0) claimDiscard(state);
        else skipClaim(state);
      } else if (state.phase === "discard") {
        if (
          rankPatterns(player.hand, state.patterns, player.exposed).some(
            (r) => r.complete,
          )
        )
          declareMahjong(state);
        else {
          const best = rankPatterns(
            player.hand,
            state.patterns,
            player.exposed,
          ).find((r) => r.compatible);
          if (best) player.targetId = best.pattern.id;
          discardTile(
            state,
            suggestDiscard(player.hand, best?.pattern || main, player.exposed)
              .tile.id,
          );
        }
      } else assert.fail(`Unexpected phase ${state.phase}`);
      conserved(state);
    }
    assert.equal(state.phase, "finished");
    assert.ok(actions < 500);
    endings++;
  }
  assert.equal(endings, 12);
});

test("Pared agotada termina la partida y no inventa fichas de reemplazo", () => {
  const state = afterCharleston(newGame({ rng: seeded(3) }));
  state.discards.push(
    ...state.wall.splice(0).map((tile) => ({ tile, player: 1 })),
  );
  state.phase = "draw";
  drawTile(state);
  assert.equal(state.phase, "finished");
  assert.equal(state.winner, null);
  assert.equal(state.wall.length, 0);
  conserved(state);
  assert.throws(() => drawTile(state), /terminó/);
});
