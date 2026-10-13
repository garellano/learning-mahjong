/**
 * Motor didáctico de Mahjong Americano, independiente de la interfaz.
 * Los seis ejemplos son composiciones originales, NO líneas de la tarjeta NMJL.
 * Simplificaciones: primer Charleston solamente; pases abiertos de tres fichas;
 * no puntuación, apuestas, penalizaciones ni regla de mano muerta. La pared es
 * física y finita. Los rivales conocen solo sus fichas y los descartes públicos.
 */
const SUITS = ["c", "b", "k"];
const HONORS = ["we", "ws", "ww", "wn", "dr", "dg", "dw"];
const KINDS = [
  ...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${s}${i + 1}`)),
  ...HONORS,
  "f",
  "j",
];
const VALID_KINDS = new Set(KINDS);

const pattern = (id, name, description, groups) => ({
  id,
  name,
  description,
  concealed: false,
  groups: groups.map(([kind, count]) => ({ kind, count })),
  source: "training",
});
export const TRAINING_PATTERNS = [
  pattern(
    "circle-stairs",
    "Escalera de círculos",
    "Cuatro tríos de círculos, del uno al cuatro, y una pareja de flores.",
    [
      ["c1", 3],
      ["c2", 3],
      ["c3", 3],
      ["c4", 3],
      ["f", 2],
    ],
  ),
  pattern(
    "bamboo-garden",
    "Jardín de bambú",
    "Dos flores, cuatro doses, cuatro cuatros y cuatro seises de bambú.",
    [
      ["f", 2],
      ["b2", 4],
      ["b4", 4],
      ["b6", 4],
    ],
  ),
  pattern(
    "three-families",
    "Tres familias",
    "Una pareja de cincos de círculos y un cuarteto de treses de cada familia.",
    [
      ["c5", 2],
      ["c3", 4],
      ["b3", 4],
      ["k3", 4],
    ],
  ),
  pattern(
    "red-and-green",
    "Dragones en el jardín",
    "Una pareja de flores y cuatro tríos: dragón rojo, dragón verde, cinco de bambú y cinco de caracteres.",
    [
      ["f", 2],
      ["dr", 3],
      ["dg", 3],
      ["b5", 3],
      ["k5", 3],
    ],
  ),
  pattern(
    "wind-friends",
    "Encuentro de vientos",
    "Cuatro estes, cuatro oestes, cuatro flores y una pareja de dragones blancos.",
    [
      ["we", 4],
      ["ww", 4],
      ["f", 4],
      ["dw", 2],
    ],
  ),
  pattern(
    "little-and-large",
    "Del uno al nueve",
    "Un uno de círculos, un dos de bambú y una flor solos; una pareja de caracteres tres, cuatro círculos nueve y cinco bambúes nueve. El grupo de cinco necesita un comodín.",
    [
      ["c1", 1],
      ["b2", 1],
      ["k3", 2],
      ["c9", 4],
      ["b9", 5],
      ["f", 1],
    ],
  ),
];

export function createWall() {
  return KINDS.flatMap((kind) =>
    Array.from({ length: kind === "f" || kind === "j" ? 8 : 4 }, (_, i) => ({
      id: `${kind}-${i + 1}`,
      kind,
    })),
  );
}

/** Devuelve una copia mezclada. No modifica la colección recibida. */
export function shuffle(array, rng = Math.random) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const value = Number(rng());
    const j = Math.min(
      i,
      Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * (i + 1))),
    );
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function tileName(kind, lang = "es") {
  const names =
    lang === "en"
      ? {
          we: "East wind",
          ws: "South wind",
          ww: "West wind",
          wn: "North wind",
          dr: "Red dragon",
          dg: "Green dragon",
          dw: "White dragon",
          f: "Flower",
          j: "Joker",
        }
      : {
          we: "Viento este",
          ws: "Viento sur",
          ww: "Viento oeste",
          wn: "Viento norte",
          dr: "Dragón rojo",
          dg: "Dragón verde",
          dw: "Dragón blanco",
          f: "Flor",
          j: "Comodín",
        };
  if (names[kind]) return names[kind];
  if (/^[cbk][1-9]$/.test(kind)) {
    const suit =
      lang === "en"
        ? { c: "dots", b: "bamboo", k: "characters" }
        : { c: "círculos", b: "bambú", k: "caracteres" };
    return lang === "en"
      ? `${kind[1]} ${suit[kind[0]]}`
      : `${kind[1]} de ${suit[kind[0]]}`;
  }
  return String(kind);
}

function validPattern(p) {
  return (
    p &&
    Array.isArray(p.groups) &&
    p.groups.length > 0 &&
    p.groups.every(
      (g) =>
        VALID_KINDS.has(g.kind) &&
        g.kind !== "j" &&
        Number.isInteger(g.count) &&
        g.count >= 1 &&
        g.count <= 6,
    ) &&
    p.groups.reduce((n, g) => n + g.count, 0) === 14
  );
}

export function analyzeHand(hand, p, exposed = []) {
  const groups = (p?.groups || []).map((g) => ({
    kind: g.kind,
    count: g.count,
    tiles: [],
    missing: [],
  }));
  const invalid = (reason) => ({
    matched: 0,
    missing: groups.flatMap((g) => Array(g.count).fill(g.kind)),
    keptIds: [],
    jokerIds: [],
    complete: false,
    groups,
    compatible: false,
    reason,
  });
  if (!validPattern(p))
    return invalid(
      "La combinación debe contener exactamente 14 fichas, sin comodines como objetivo.",
    );
  if (!Array.isArray(hand) || !Array.isArray(exposed))
    return invalid("La mano no es válida.");
  const allTiles = [...hand, ...exposed.flatMap((g) => g.tiles || [])];
  if (
    allTiles.some((t) => !t || !VALID_KINDS.has(t.kind) || !t.id) ||
    new Set(allTiles.map((t) => t.id)).size !== allTiles.length
  )
    return invalid("Hay fichas inválidas o repetidas.");
  const fixed = new Set();
  for (const exposure of exposed) {
    const tiles = exposure.tiles || [];
    const kind = exposure.kind || tiles.find((t) => t.kind !== "j")?.kind;
    const count = exposure.count ?? tiles.length;
    const index = groups.findIndex(
      (g, i) => !fixed.has(i) && g.kind === kind && g.count === count,
    );
    if (
      p.concealed ||
      index < 0 ||
      count < 3 ||
      tiles.length !== count ||
      tiles.some((t) => t.kind !== kind && t.kind !== "j")
    )
      return invalid(
        "Un grupo expuesto no encaja en esta combinación y no se puede cambiar.",
      );
    fixed.add(index);
    groups[index].tiles = [...tiles];
  }
  const available = [...hand];
  // Primero solos y parejas: un comodín nunca puede cubrir sus faltantes.
  const order = groups
    .map((_, i) => i)
    .filter((i) => !fixed.has(i))
    .sort((a, b) => (groups[a].count >= 3) - (groups[b].count >= 3));
  for (const index of order) {
    const group = groups[index];
    for (let n = 0; n < group.count; n++) {
      const at = available.findIndex((t) => t.kind === group.kind);
      if (at < 0) break;
      group.tiles.push(...available.splice(at, 1));
    }
  }
  for (const index of order) {
    const group = groups[index];
    while (group.count >= 3 && group.tiles.length < group.count) {
      const at = available.findIndex((t) => t.kind === "j");
      if (at < 0) break;
      group.tiles.push(...available.splice(at, 1));
    }
    group.missing = Array(group.count - group.tiles.length).fill(group.kind);
  }
  const kept = groups.flatMap((g) => g.tiles);
  const missing = groups.flatMap((g) => g.missing);
  return {
    matched: kept.length,
    missing,
    keptIds: kept.map((t) => t.id),
    jokerIds: kept.filter((t) => t.kind === "j").map((t) => t.id),
    complete: missing.length === 0 && allTiles.length === 14,
    groups,
    compatible: true,
  };
}

export function rankPatterns(hand, patterns = TRAINING_PATTERNS, exposed = []) {
  return patterns
    .map((p) => ({ pattern: p, ...analyzeHand(hand, p, exposed) }))
    .sort(
      (a, b) =>
        Number(b.compatible) - Number(a.compatible) || b.matched - a.matched,
    );
}

export function suggestDiscard(hand, p, exposed = []) {
  if (!hand.length)
    return {
      tile: null,
      reason: "No hay fichas para descartar.",
      keptIds: [],
      missing: [],
      matched: 0,
    };
  const analysis = analyzeHand(hand, p, exposed);
  const scored = hand.map((tile) => ({
    tile,
    score: analyzeHand(
      hand.filter((t) => t.id !== tile.id),
      p,
      exposed,
    ).matched,
  }));
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Number(a.tile.kind === "j") - Number(b.tile.kind === "j") ||
      Number(analysis.keptIds.includes(a.tile.id)) -
        Number(analysis.keptIds.includes(b.tile.id)),
  );
  const tile = scored[0].tile;
  return {
    tile,
    reason: analysis.keptIds.includes(tile.id)
      ? `${tileName(tile.kind)} forma parte de tu objetivo. Revisa otras combinaciones antes de soltarla.`
      : `${tileName(tile.kind)} no hace falta en esta combinación. Conserva las fichas que sí encajan.`,
    keptIds: analysis.keptIds,
    missing: analysis.missing,
    matched: analysis.matched,
  };
}

function requirePhase(state, ...phases) {
  if (state.phase === "finished")
    throw new Error("Esta partida ya terminó. Puedes comenzar otra.");
  if (!phases.includes(state.phase))
    throw new Error("Primero termina la acción que aparece en la mesa.");
}

function bestFor(state, player) {
  const ranked = rankPatterns(player.hand, state.patterns, player.exposed);
  const preferred = ranked.find(
    (r) => r.pattern.id === player.targetId && r.compatible,
  );
  return preferred || ranked.find((r) => r.compatible) || ranked[0];
}

function finish(state, winner, message) {
  state.phase = "finished";
  state.status = winner === null ? "draw" : "won";
  state.winner = winner;
  state.message = message;
  state.claim = null;
  state.botFlow = null;
  return state;
}

function takeFromWall(state, player) {
  if (!state.wall.length) {
    finish(
      state,
      null,
      "Se terminó la pared. La partida acaba sin ganadora; puedes volver a practicar.",
    );
    return null;
  }
  const tile = state.wall.pop();
  player.hand.push(tile);
  return tile;
}

export function newGame({
  patterns = TRAINING_PATTERNS,
  mode = "guided",
  rng = Math.random,
} = {}) {
  if (
    !Array.isArray(patterns) ||
    !patterns.length ||
    patterns.some((p) => !validPattern(p))
  )
    throw new Error(
      "Cada combinación necesita grupos válidos que sumen 14 fichas.",
    );
  if (patterns.some((p) => analyzeHand(createWall(), p).matched !== 14))
    throw new Error(
      "Una combinación pide más fichas o comodines de los que existen en la pared.",
    );
  const state = {
    patterns,
    mode,
    players: ["Tú", "Clara", "Inés", "Luz"].map((name) => ({
      name,
      hand: [],
      exposed: [],
      targetId: patterns[0].id,
    })),
    wall: shuffle(createWall(), rng),
    discards: [],
    phase: "charleston",
    passIndex: 0,
    turn: 0,
    status: "active",
    message:
      "Elige tres fichas para pasar a la derecha. Conserva tus comodines.",
    winner: null,
    claim: null,
    canExchange: false,
    winningClaimTileId: null,
    botFlow: null,
    botEvent: null,
    botEventSerial: 0,
  };
  if (mode === "guided") {
    // Extraemos 11 fichas útiles de la misma pared, sin crear copias nuevas.
    const desired = patterns[0].groups
      .flatMap((g) => Array(g.count).fill(g.kind))
      .slice(0, 11);
    for (const kind of desired) {
      let at = state.wall.findIndex((t) => t.kind === kind);
      if (at < 0) at = state.wall.findIndex((t) => t.kind === "j");
      state.players[0].hand.push(...state.wall.splice(at, 1));
    }
  }
  for (let i = 0; i < state.players.length; i++) {
    while (state.players[i].hand.length < (i === 0 ? 14 : 13))
      takeFromWall(state, state.players[i]);
    state.players[i].targetId = rankPatterns(
      state.players[i].hand,
      patterns,
    )[0].pattern.id;
  }
  return state;
}

export function passTiles(state, ids) {
  requirePhase(state, "charleston");
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3)
    throw new Error("Elige exactamente tres fichas diferentes para pasar.");
  const human = state.players[0];
  const selected = ids.map((id) => human.hand.find((t) => t.id === id));
  if (selected.some((t) => !t))
    throw new Error("Solo puedes pasar fichas que estén en tu mano.");
  if (selected.some((t) => t.kind === "j"))
    throw new Error(
      "Los comodines se quedan contigo: no se pasan en el intercambio inicial.",
    );
  const passes = state.players.map((player, i) => {
    if (i === 0) return selected;
    const pool = player.hand.filter((t) => t.kind !== "j");
    const choice = [];
    const p = bestFor(state, player).pattern;
    for (let n = 0; n < 3; n++) {
      const tile = suggestDiscard(pool, p).tile;
      choice.push(tile);
      pool.splice(
        pool.findIndex((t) => t.id === tile.id),
        1,
      );
    }
    return choice;
  });
  for (let i = 0; i < 4; i++) {
    const idsToPass = new Set(passes[i].map((t) => t.id));
    state.players[i].hand = state.players[i].hand.filter(
      (t) => !idsToPass.has(t.id),
    );
  }
  const offset = [1, 2, 3][state.passIndex];
  for (let i = 0; i < 4; i++)
    state.players[(i + offset) % 4].hand.push(...passes[i]);
  state.passIndex++;
  state.message = [
    "",
    "Ahora pasa tres fichas a la jugadora de enfrente.",
    "Un último pase: tres fichas a la izquierda.",
    "Terminó el intercambio inicial. Tienes 14 fichas: elige una para descartar.",
  ][state.passIndex];
  if (state.passIndex === 3) state.phase = "discard";
  return state;
}

export function drawTile(state) {
  requirePhase(state, "draw");
  if (state.turn !== 0)
    throw new Error("Espera a tu turno para tomar una ficha.");
  const tile = takeFromWall(state, state.players[0]);
  if (tile) {
    state.phase = "discard";
    state.canExchange = true;
    state.lastDrawId = tile.id;
    state.message = `Tomaste ${tileName(tile.kind)}. Revisa tu combinación y descarta una ficha.`;
  }
  return state;
}

function winningPattern(state, player, extra) {
  return state.patterns.find(
    (p) =>
      analyzeHand(
        extra ? [...player.hand, extra] : player.hand,
        p,
        player.exposed,
      ).complete,
  );
}

function claimOptions(state, player, tile) {
  if (tile.kind === "j") return [];
  const p = bestFor(state, player)?.pattern;
  if (!p || p.concealed) return [];
  const analysis = analyzeHand(player.hand, p, player.exposed);
  if (!analysis.compatible) return [];
  const already = new Set();
  for (const exposure of player.exposed) {
    const index = p.groups.findIndex(
      (g, i) =>
        !already.has(i) &&
        g.kind === exposure.kind &&
        g.count === exposure.count,
    );
    already.add(index);
  }
  return p.groups.flatMap((g, groupIndex) => {
    if (already.has(groupIndex) || g.count < 3 || g.kind !== tile.kind)
      return [];
    const naturals = player.hand.filter((t) => t.kind === g.kind).length;
    const jokers = player.hand.filter((t) => t.kind === "j").length;
    // Las fichas que hoy sirven para una pareja/suelta también pueden usarse:
    // la jugadora podrá conseguir después las que le falten en esos grupos.
    if (naturals + jokers < g.count - 1) return [];
    return [{ groupIndex, patternId: p.id, kind: g.kind, count: g.count }];
  });
}

function exposeClaim(state, playerIndex, option) {
  const discard = state.discards.pop();
  const player = state.players[playerIndex];
  const tiles = [discard.tile];
  const p = state.patterns.find((p) => p.id === option.patternId);
  const reserved = p.groups
    .filter(
      (g, i) =>
        i !== option.groupIndex && g.kind === option.kind && g.count < 3,
    )
    .reduce((n, g) => n + g.count, 0);
  while (tiles.length < option.count) {
    const naturalCount = player.hand.filter(
      (t) => t.kind === option.kind,
    ).length;
    let at =
      naturalCount > reserved
        ? player.hand.findIndex((t) => t.kind === option.kind)
        : -1;
    if (at < 0) at = player.hand.findIndex((t) => t.kind === "j");
    if (at < 0) at = player.hand.findIndex((t) => t.kind === option.kind);
    if (at < 0)
      throw new Error("No tienes fichas suficientes para completar ese grupo.");
    tiles.push(...player.hand.splice(at, 1));
  }
  player.exposed.push({ kind: option.kind, count: option.count, tiles });
  player.targetId = option.patternId;
  state.turn = playerIndex;
  state.claim = null;
  if (playerIndex === 0) state.canExchange = true;
}

function botDiscard(state, index) {
  const player = state.players[index];
  const ranked = rankPatterns(player.hand, state.patterns, player.exposed);
  const best = ranked.find((r) => r.compatible) || bestFor(state, player);
  player.targetId = best.pattern.id;
  const tile = suggestDiscard(player.hand, best.pattern, player.exposed).tile;
  player.hand.splice(
    player.hand.findIndex((t) => t.id === tile.id),
    1,
  );
  state.discards.push({ tile, player: index });
  return index;
}

function botEvent(state, type, player, details = {}) {
  state.botEventSerial = (state.botEventSerial || 0) + 1;
  state.botEvent = { type, player, serial: state.botEventSerial, ...details };
  return state;
}

/**
 * Continúa una sola acción visible. No usa temporizadores: la interfaz decide
 * cuándo continuar. Todo el progreso vive en botFlow para poder guardar y
 * recuperar una partida incluso entre tomar una ficha y descartarla.
 * Las fichas tomadas permanecen ocultas en los eventos públicos.
 */
export function advanceBotStep(state) {
  requirePhase(state, "bots");
  const flow = state.botFlow;
  if (!flow) throw new Error("No hay un turno de compañera pendiente.");

  if (flow.stage === "draw") {
    const player = state.players[flow.player];
    if (!takeFromWall(state, player))
      return botEvent(state, "end", null, { reason: "wall" });
    state.botFlow = { stage: "afterDraw", player: flow.player };
    state.message = `${player.name} tomó una ficha de la pared. Ahora elige qué descartar.`;
    return botEvent(state, "draw", flow.player);
  }

  if (flow.stage === "afterDraw") {
    const player = state.players[flow.player];
    const p = winningPattern(state, player);
    if (p) {
      player.targetId = p.id;
      finish(
        state,
        flow.player,
        `${player.name} completó su combinación al tomar una ficha y declaró Mahjong.`,
      );
      return botEvent(state, "win", flow.player, {
        tile: { ...player.hand.at(-1) },
        source: "wall",
      });
    }
    // Tras mostrar la toma, el siguiente paso visible es el descarte.
    return discardBotStep(state, flow.player);
  }

  if (flow.stage === "discard") return discardBotStep(state, flow.player);

  if (flow.stage === "resolve") {
    const { from, skipHuman } = flow;
    const discard = state.discards.at(-1);
    const order = [1, 2, 3].map((n) => (from + n) % 4);
    // Ganar tiene prioridad sobre una exposición ordinaria.
    let winner = null;
    for (const index of order) {
      if (index === 0 && skipHuman) continue;
      const p =
        discard.tile.kind === "j"
          ? null
          : winningPattern(state, state.players[index], discard.tile);
      if (p) {
        winner = { index, p };
        break;
      }
    }
    if (winner) {
      if (winner.index === 0) {
        state.phase = "claim";
        state.turn = 0;
        state.claim = {
          ...discard,
          options: claimOptions(state, state.players[0], discard.tile),
          canWin: true,
        };
        state.message = `${state.players[from].name} descartó ${tileName(discard.tile.kind)}. ¡Con esa ficha puedes declarar Mahjong!`;
        state.botFlow = null;
        return botEvent(state, "claim-option", 0, {
          tile: { ...discard.tile },
          from,
          canWin: true,
        });
      }
      const winningTile = state.discards.pop().tile;
      state.players[winner.index].hand.push(winningTile);
      // La interfaz mantiene esta ficha visible arriba del soporte al ganar.
      state.winningClaimTileId = winningTile.id;
      state.players[winner.index].targetId = winner.p.id;
      finish(
        state,
        winner.index,
        `${state.players[winner.index].name} completó su combinación y declaró Mahjong. Puedes revisar la mano y volver a practicar.`,
      );
      return botEvent(state, "win", winner.index, {
        tile: { ...winningTile },
        from,
        source: "discard",
      });
    }
    for (const index of order) {
      if (index === 0 && skipHuman) continue;
      const options = claimOptions(state, state.players[index], discard.tile);
      if (!options.length) continue;
      if (index === 0) {
        state.phase = "claim";
        state.turn = 0;
        state.claim = { ...discard, options, canWin: false };
        state.message = `${state.players[from].name} descartó ${tileName(discard.tile.kind)}. Puedes reclamarla para completar y mostrar un grupo.`;
        state.botFlow = null;
        return botEvent(state, "claim-option", 0, {
          tile: { ...discard.tile },
          from,
          canWin: false,
        });
      }
      exposeClaim(state, index, options[0]);
      state.botFlow = { stage: "discard", player: index };
      state.message = `${state.players[index].name} reclamó ${tileName(discard.tile.kind)} y mostró un grupo. Ahora debe descartar.`;
      return botEvent(state, "claim", index, {
        tile: { ...discard.tile },
        from,
        exposureIndex: state.players[index].exposed.length - 1,
      });
    }
    const next = (from + 1) % 4;
    state.turn = next;
    state.claim = null;
    if (next === 0) {
      state.phase = "draw";
      state.message = "Es tu turno. Toma una ficha de la pared.";
      state.botFlow = null;
      return botEvent(state, "turn", 0);
    }
    state.canExchange = false;
    state.botFlow = { stage: "draw", player: next };
    state.message = `Es el turno de ${state.players[next].name}. Va a tomar una ficha de la pared.`;
    return botEvent(state, "turn", next);
  }
  throw new Error("No se reconoce la acción pendiente de la compañera.");
}

function discardBotStep(state, index) {
  botDiscard(state, index);
  const discard = state.discards.at(-1);
  state.botFlow = { stage: "resolve", from: index, skipHuman: false };
  state.message = `${state.players[index].name} descartó ${tileName(discard.tile.kind)}.`;
  return botEvent(state, "discard", index, { tile: { ...discard.tile } });
}

/** El modo inmediato usa los mismos pasos para conservar las mismas reglas. */
function advance(state, from, skipHuman = false, deferBots = false) {
  state.phase = "bots";
  state.botFlow = { stage: "resolve", from, skipHuman };
  state.botEvent = null;
  if (!deferBots) while (state.phase === "bots") advanceBotStep(state);
  return state;
}

export function discardTile(state, id, { deferBots = false } = {}) {
  requirePhase(state, "discard");
  if (state.turn !== 0) throw new Error("Espera a tu turno para descartar.");
  const player = state.players[0];
  const at = player.hand.findIndex((t) => t.id === id);
  if (at < 0) throw new Error("Elige una ficha de tu mano para descartar.");
  if (
    player.hand.length +
      player.exposed.reduce((n, g) => n + g.tiles.length, 0) !==
    14
  )
    throw new Error("Necesitas tener 14 fichas antes de descartar.");
  state.discards.push({ tile: player.hand.splice(at, 1)[0], player: 0 });
  state.phase = "draw";
  state.canExchange = false;
  state.lastDrawId = null;
  return advance(state, 0, false, deferBots);
}

export function claimDiscard(state, groupIndex) {
  requirePhase(state, "claim");
  if (state.claim.canWin && groupIndex === undefined)
    return declareMahjong(state);
  const option =
    groupIndex === undefined
      ? state.claim.options[0]
      : state.claim.options.find((o) => o.groupIndex === groupIndex);
  if (!option)
    throw new Error("Esta ficha no completa un grupo que puedas mostrar.");
  exposeClaim(state, 0, option);
  state.phase = "discard";
  state.message =
    "Completaste y mostraste un grupo. Ese grupo queda fijo; ahora descarta una ficha de tu mano.";
  return state;
}

export function skipClaim(state, { deferBots = false } = {}) {
  requirePhase(state, "claim");
  const from = state.claim.player;
  state.claim = null;
  state.phase = "draw";
  return advance(state, from, true, deferBots);
}

export function declareMahjong(state) {
  requirePhase(state, "discard", "claim");
  const player = state.players[0];
  const extra = state.phase === "claim" ? state.claim.tile : null;
  const p = winningPattern(state, player, extra);
  if (!p)
    throw new Error(
      "Aún falta completar una combinación de 14 fichas. Los comodines no sirven para fichas solas ni parejas.",
    );
  if (extra) {
    player.hand.push(state.discards.pop().tile);
    state.winningClaimTileId = extra.id;
  }
  player.targetId = p.id;
  return finish(
    state,
    0,
    "¡Mahjong! Completaste las 14 fichas de tu combinación. Puedes revisar los grupos y volver a practicar.",
  );
}

export function exchangeJoker(state, ownId, playerIndex, exposureIndex) {
  requirePhase(state, "discard");
  if (state.turn !== 0)
    throw new Error(
      "Solo puedes cambiar un comodín durante tu turno, después de tomar una ficha.",
    );
  if (!state.canExchange)
    throw new Error(
      "Antes del primer descarte no puedes cambiar comodines. Espera un turno en el que tomes una ficha o reclames un grupo.",
    );
  const hand = state.players[0].hand;
  const at = hand.findIndex((t) => t.id === ownId);
  const exposure = state.players[playerIndex]?.exposed[exposureIndex];
  if (
    at < 0 ||
    !exposure ||
    hand[at].kind !== exposure.kind ||
    hand[at].kind === "j"
  )
    throw new Error(
      "Necesitas la ficha exacta del grupo expuesto para recuperar su comodín.",
    );
  const jokerAt = exposure.tiles.findIndex((t) => t.kind === "j");
  if (jokerAt < 0)
    throw new Error("Ese grupo no tiene un comodín para cambiar.");
  const own = hand[at];
  hand[at] = exposure.tiles[jokerAt];
  exposure.tiles[jokerAt] = own;
  state.message =
    "Cambiaste tu ficha exacta por el comodín del grupo expuesto. Ahora el comodín está en tu mano.";
  return state;
}
