import test from "node:test";
import assert from "node:assert/strict";
import { createTurnPlayer } from "../src/turn-player.js";

function timers() {
  let nextId = 1;
  const pending = new Map();
  const callbacks = new Map();
  const delays = [];
  return {
    pending,
    delays,
    setTimer(callback, delay) {
      const id = nextId++;
      pending.set(id, callback);
      callbacks.set(id, callback);
      delays.push(delay);
      return id;
    },
    clearTimer(id) {
      pending.delete(id);
    },
    nextId() {
      return pending.keys().next().value;
    },
    fire(id = pending.keys().next().value) {
      assert.ok(callbacks.has(id), "the requested timer exists");
      pending.delete(id);
      callbacks.get(id)();
    },
  };
}

function table(options = {}) {
  const clock = timers();
  const state = { visible: true, phase: "bots", paused: false, modal: false };
  let events = 0;
  const player = createTurnPlayer({
    shouldRun: () =>
      state.visible && state.phase === "bots" && !state.paused && !state.modal,
    step: () => {
      events += 1;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    ...options,
  });
  return { clock, state, player, events: () => events };
}

test("one event runs after each full pause and repeated renders do not restart it", () => {
  const t = table();
  t.player.sync();
  const first = t.clock.nextId();
  for (let render = 0; render < 10; render += 1) t.player.sync();
  assert.equal(t.clock.pending.size, 1);
  assert.equal(t.clock.nextId(), first);
  assert.equal(t.events(), 0);
  t.clock.fire();
  assert.equal(t.events(), 1);
  assert.equal(t.clock.pending.size, 1);
  assert.notEqual(t.clock.nextId(), first);
  t.clock.fire();
  assert.equal(t.events(), 2);
  assert.equal(t.clock.pending.size, 1);
  assert.deepEqual(t.clock.delays, [850, 850, 850]);
  t.player.dispose();
});

test("pause cancels the pending event and resume starts a fresh pause", () => {
  const t = table({ delay: 1200 });
  t.player.sync();
  const beforePause = t.clock.nextId();
  t.state.paused = true;
  t.player.sync();
  assert.equal(t.clock.pending.size, 0);
  t.clock.fire(beforePause);
  assert.equal(t.events(), 0);
  t.state.paused = false;
  t.player.sync();
  assert.equal(t.clock.pending.size, 1);
  t.clock.fire();
  assert.equal(t.events(), 1);
  assert.deepEqual(t.clock.delays, [1200, 1200, 1200]);
  t.player.dispose();
});

test("the callback rechecks whether the table may advance", () => {
  for (const change of [
    (state) => {
      state.visible = false;
    },
    (state) => {
      state.phase = "discard";
    },
    (state) => {
      state.paused = true;
    },
    (state) => {
      state.modal = true;
    },
  ]) {
    const t = table();
    t.player.sync();
    change(t.state);
    t.clock.fire();
    assert.equal(t.events(), 0);
    assert.equal(t.clock.pending.size, 0);
    t.player.dispose();
  }
});

test("old queued callbacks cannot advance a replacement game or route", () => {
  const t = table();
  t.player.sync();
  const oldGame = t.clock.nextId();
  t.player.stop();
  t.player.sync();
  const newGame = t.clock.nextId();
  t.clock.fire(oldGame);
  assert.equal(t.events(), 0);
  assert.equal(t.clock.nextId(), newGame);
  assert.equal(t.clock.pending.size, 1);
  t.clock.fire(newGame);
  assert.equal(t.events(), 1);

  const beforeRoute = t.clock.nextId();
  t.player.stop();
  t.state.visible = false;
  t.clock.fire(beforeRoute);
  assert.equal(t.events(), 1);
  assert.equal(t.clock.pending.size, 0);
  t.player.dispose();
});

test("renders inside an event cannot schedule duplicate callbacks", () => {
  const clock = timers();
  let events = 0;
  const player = createTurnPlayer({
    shouldRun: () => events < 3,
    step: () => {
      events += 1;
      player.sync();
      player.sync();
      assert.equal(clock.pending.size, 0);
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  player.sync();
  clock.fire();
  assert.equal(clock.pending.size, 1);
  clock.fire();
  assert.equal(clock.pending.size, 1);
  clock.fire();
  assert.equal(events, 3);
  assert.equal(clock.pending.size, 0);
});

test("stop during an event prevents its automatic continuation", () => {
  const clock = timers();
  let events = 0;
  const player = createTurnPlayer({
    shouldRun: () => true,
    step: () => {
      events += 1;
      player.stop();
      player.sync();
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  player.sync();
  clock.fire();
  assert.equal(events, 1);
  assert.equal(clock.pending.size, 0);
  player.sync();
  assert.equal(clock.pending.size, 1);
  player.dispose();
});

test("an event error is reported once and never starts an automatic retry loop", () => {
  const clock = timers();
  const failure = new Error("No se pudo avanzar");
  const errors = [];
  const player = createTurnPlayer({
    shouldRun: () => true,
    step: () => {
      player.sync();
      throw failure;
    },
    onError: (error) => {
      errors.push(error);
      player.sync();
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
  });
  player.sync();
  clock.fire();
  assert.deepEqual(errors, [failure]);
  assert.equal(clock.pending.size, 0);
  assert.equal(clock.delays.length, 1);
  player.dispose();
});

test("dispose cancels queued work permanently", () => {
  const t = table();
  t.player.sync();
  const old = t.clock.nextId();
  t.player.dispose();
  t.player.sync();
  t.clock.fire(old);
  t.player.stop();
  t.player.sync();
  assert.equal(t.events(), 0);
  assert.equal(t.clock.pending.size, 0);
});
