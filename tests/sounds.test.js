import test from "node:test";
import assert from "node:assert/strict";
import { createSoundPlayer, resolveSoundPreference } from "../src/sounds.js";

test("sounds are on for a new profile and migrate the old silent default", () => {
  for (const profile of [
    undefined,
    null,
    {},
    { sound: false },
    { sound: true },
  ]) {
    assert.equal(resolveSoundPreference(profile), true);
  }
});

test("a deliberate sound preference survives future visits", () => {
  assert.equal(
    resolveSoundPreference({ soundPreferenceSet: true, sound: false }),
    false,
  );
  assert.equal(
    resolveSoundPreference({ soundPreferenceSet: true, sound: true }),
    true,
  );
  assert.equal(
    resolveSoundPreference({ soundPreferenceSet: true, sound: "false" }),
    true,
  );
});

function audioHarness() {
  const contexts = [];
  class AudioContext {
    constructor() {
      this.currentTime = 10;
      this.state = "suspended";
      this.destination = {};
      this.oscillators = [];
      this.gains = [];
      this.resumes = 0;
      contexts.push(this);
    }
    resume() {
      this.resumes += 1;
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      this.state = "closed";
      return Promise.resolve();
    }
    createOscillator() {
      const oscillator = {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
        start(at) {
          this.startedAt = at;
        },
        stop(at) {
          this.stoppedAt = at;
        },
      };
      this.oscillators.push(oscillator);
      return oscillator;
    }
    createGain() {
      const gain = {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {
          this.disconnected = true;
        },
      };
      this.gains.push(gain);
      return gain;
    }
  }
  return { contexts, AudioContext };
}

test("disabled, speech ducking, or an unsupported browser never opens audio", () => {
  const audio = audioHarness();
  for (const options of [{ enabled: () => false }, { ducked: () => true }]) {
    const player = createSoundPlayer({
      AudioContext: audio.AudioContext,
      ...options,
    });
    assert.equal(player.play(), false);
    player.dispose();
  }
  assert.equal(audio.contexts.length, 0);
  assert.equal(createSoundPlayer({ AudioContext: null }).play(), false);
});

test("every effect stops within half a second and releases audio nodes", () => {
  for (const effect of [
    "tap",
    "draw",
    "discard",
    "pass",
    "success",
    "retry",
    "win",
  ]) {
    const audio = audioHarness();
    const player = createSoundPlayer({ AudioContext: audio.AudioContext });
    assert.equal(
      audio.contexts.length,
      0,
      "creation is deferred until an action",
    );
    assert.equal(player.play(effect), true);
    const context = audio.contexts[0];
    assert.equal(context.resumes, 1);
    assert.ok(context.oscillators.length > 0);
    for (const oscillator of context.oscillators) {
      assert.ok(oscillator.stoppedAt > oscillator.startedAt);
      assert.ok(oscillator.stoppedAt - context.currentTime < 0.5);
      oscillator.onended();
      assert.equal(oscillator.disconnected, true);
    }
    assert.ok(context.gains.every((gain) => gain.disconnected));
    player.dispose();
    assert.equal(context.state, "closed");
    assert.equal(player.play(effect), false);
  }
});

test("a new action replaces an unfinished effect and disposal silences queued notes", () => {
  const audio = audioHarness();
  const player = createSoundPlayer({ AudioContext: audio.AudioContext });
  player.play("win");
  const context = audio.contexts[0];
  const previous = [...context.oscillators];
  player.play("discard");
  assert.equal(audio.contexts.length, 1, "reuse the same audio context");
  assert.ok(
    previous.every((source) => source.stoppedAt === context.currentTime),
  );
  assert.ok(previous.every((source) => source.disconnected));
  player.dispose();
  assert.ok(context.oscillators.every((source) => source.disconnected));
});

test("an action resumes audio after Safari interrupts the context", () => {
  const audio = audioHarness();
  const player = createSoundPlayer({ AudioContext: audio.AudioContext });
  assert.equal(player.play("tap"), true);
  const context = audio.contexts[0];
  context.state = "interrupted";
  assert.equal(player.play("draw"), true);
  assert.equal(context.resumes, 2);
  assert.equal(context.state, "running");
  assert.equal(audio.contexts.length, 1);
  player.dispose();
});
