import test from "node:test";
import assert from "node:assert/strict";
import { captureTiles, animateTiles, cancelTileMotion } from "../src/motion.js";

// A deliberately small DOM/WAAPI harness exercises lifecycle and geometry. It
// does not pretend to test browser rendering, which is checked on real screens.
function scene({ reduced = false } = {}) {
  const animations = [];
  const doc = {
    tiles: [],
    sources: [],
    defaultView: {
      innerWidth: 1000,
      matchMedia: () => ({ matches: reduced }),
      getComputedStyle: (node) => ({
        transform: "none",
        padding: "2px",
        boxSizing: "border-box",
        ...node.style,
      }),
    },
    querySelectorAll: (selector) =>
      selector === "[data-motion-id]" ? doc.tiles : doc.sources,
    createElement: (tag) => new Node(tag.toUpperCase()),
  };
  class Node {
    constructor(
      tag = "BUTTON",
      rect = { left: 0, top: 0, width: 60, height: 90 },
    ) {
      this.ownerDocument = doc;
      this.tagName = tag;
      this.rect = rect;
      this.style = {};
      this.attrs = new Map();
      this.children = [];
      this.classes = new Set();
      this.disabled = false;
      this.classList = {
        add: (...values) => values.forEach((value) => this.classes.add(value)),
        remove: (...values) =>
          values.forEach((value) => this.classes.delete(value)),
        contains: (value) => this.classes.has(value),
      };
    }
    get id() {
      return this.getAttribute("id");
    }
    get attributes() {
      return [...this.attrs].map(([name, value]) => ({ name, value }));
    }
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    }
    getAttribute(name) {
      return this.attrs.get(name) ?? null;
    }
    removeAttribute(name) {
      this.attrs.delete(name);
    }
    append(node) {
      node.parent = this;
      this.children.push(node);
    }
    remove() {
      if (this.parent)
        this.parent.children = this.parent.children.filter(
          (node) => node !== this,
        );
      this.removed = true;
    }
    querySelectorAll(selector) {
      assert.equal(selector, "*");
      return this.children.flatMap((child) => [
        child,
        ...child.querySelectorAll("*"),
      ]);
    }
    closest(selector) {
      if (selector === "[data-motion-zone]") return this.zone || null;
      if (selector === ".exposure")
        return this.zone?.classes.has("exposure") ? this.zone : null;
      return null;
    }
    cloneNode() {
      const clone = new Node(this.tagName, { ...this.rect });
      clone.attrs = new Map(this.attrs);
      clone.style = { ...this.style };
      clone.classes = new Set(this.classes);
      for (const child of this.children) clone.append(child.cloneNode(true));
      return clone;
    }
    getBoundingClientRect() {
      if (this.visualRect) return this.visualRect;
      return this.style.left === undefined
        ? this.rect
        : {
            left: Number.parseFloat(this.style.left),
            top: Number.parseFloat(this.style.top),
            width: Number.parseFloat(this.style.width),
            height: Number.parseFloat(this.style.height),
          };
    }
    animate(frames, options) {
      let resolve, reject;
      const animation = {
        node: this,
        frames,
        options,
        canceled: false,
        finished: new Promise((yes, no) => {
          resolve = yes;
          reject = no;
        }),
        finish: () => resolve(),
        cancel: () => {
          animation.canceled = true;
          reject(new Error("Canceled"));
        },
      };
      animations.push(animation);
      return animation;
    }
  }
  doc.body = new Node("BODY");
  function tile(id, left, top, zoneName = "hand", width = 60, height = 90) {
    const node = new Node("BUTTON", { left, top, width, height });
    node.setAttribute("data-motion-id", id);
    node.setAttribute("data-tile", "c2");
    node.zone = new Node("DIV");
    node.zone.setAttribute("data-motion-zone", zoneName);
    if (zoneName.startsWith("exposure")) node.zone.classList.add("exposure");
    return node;
  }
  function source(id, rect) {
    const node = new Node("DIV", rect);
    node.setAttribute("id", id);
    doc.sources.push(node);
    return node;
  }
  function finish() {
    for (const animation of animations)
      if (!animation.canceled) animation.finish();
  }
  return { doc, animations, tile, source, finish };
}

test("sorting follows physical identity even when several tiles have the same face", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("one", 10, 200), s.tile("two", 80, 200)];
  const before = captureTiles(s.doc);
  s.doc.tiles = [s.tile("two", 10, 200), s.tile("one", 80, 200)];
  const done = animateTiles(before, { root: s.doc, action: "sort" });
  assert.equal(s.animations.length, 2);
  assert.match(s.animations[0].frames[0].transform, /translate\(70px, 0px\)/);
  assert.match(s.animations[1].frames[0].transform, /translate\(-70px, 0px\)/);
  assert.equal(s.doc.body.children.length, 0);
  s.finish();
  await done;
});

test("exposing a group crosses containers with inert ghosts and restores the real tiles", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("one", 30, 300)];
  s.doc.tiles[0].setAttribute("id", "old-control");
  const before = captureTiles(s.doc);
  const target = s.tile("one", 80, 220, "exposure-0-0", 29, 41);
  s.doc.tiles = [target];
  const done = animateTiles(before, { root: s.doc, action: "claim" });
  const overlay = s.doc.body.children[0];
  assert.equal(target.style.opacity, "0");
  assert.equal(overlay.getAttribute("aria-hidden"), "true");
  assert.equal(overlay.getAttribute("inert"), "");
  assert.equal(overlay.style.pointerEvents, "none");
  const ghost = overlay.children[0];
  assert.equal(ghost.getAttribute("data-motion-id"), null);
  assert.equal(ghost.getAttribute("id"), null);
  assert.equal(ghost.disabled, true);
  assert.match(
    s.animations[0].frames[1].transform,
    /translate\(50px, -80px\) scale\(0\.483/,
  );
  s.finish();
  await done;
  assert.equal(target.style.opacity, "");
  assert.equal(s.doc.body.children.length, 0);
});

test("interrupting a transition snapshots its visible position and cleans all previous effects", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("one", 30, 300)];
  const before = captureTiles(s.doc);
  const target = s.tile("one", 80, 220, "discards", 29, 41);
  s.doc.tiles = [target];
  const first = animateTiles(before, { root: s.doc, action: "discard" });
  const ghost = s.doc.body.children[0].children[0];
  ghost.visualRect = { left: 55, top: 260, width: 44, height: 65 };
  const inFlight = captureTiles(s.doc);
  assert.deepEqual(inFlight.get("one").rect, ghost.visualRect);
  cancelTileMotion(s.doc);
  await first;
  assert.equal(s.animations[0].canceled, true);
  assert.equal(target.style.opacity, "");
  assert.equal(s.doc.body.children.length, 0);
});

test("a wall draw starts at its wall and leaves an arrival marker after the pulse", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("old", 10, 300)];
  s.source("wall-source", { left: 300, top: 40, width: 80, height: 60 });
  const before = captureTiles(s.doc);
  const target = s.tile("new", 80, 300);
  s.doc.tiles = [s.doc.tiles[0], target];
  const done = animateTiles(before, {
    root: s.doc,
    action: "draw",
    incomingIds: ["new"],
  });
  const ghost = s.doc.body.children[0].children[0];
  assert.equal(ghost.style.left, "310px");
  assert.equal(ghost.style.top, "25px");
  assert.equal(target.classList.contains("tile-arrival"), true);
  assert.equal(
    s.animations.filter((animation) => animation.options.duration === 900)
      .length,
    1,
  );
  s.finish();
  await done;
  assert.equal(target.classList.contains("tile-arrival"), true);
  assert.equal(target.style.opacity, "");
});

test("a rerender without another arrival does not repeat the arrival pulse", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("old", 10, 300)];
  const before = captureTiles(s.doc);
  const target = s.tile("old", 10, 300);
  target.classList.add("tile-arrival");
  s.doc.tiles = [target];
  await animateTiles(before, { root: s.doc, action: "selection" });
  assert.equal(s.animations.length, 0);
  assert.equal(target.classList.contains("tile-arrival"), true);
});

test("reduced motion uses a static arrival border without ghosts or movement", async () => {
  const s = scene({ reduced: true });
  s.doc.tiles = [s.tile("departing", 10, 300)];
  const before = captureTiles(s.doc);
  const target = s.tile("incoming", 80, 300);
  s.doc.tiles = [target];
  await animateTiles(before, {
    root: s.doc,
    action: "pass",
    incomingIds: ["incoming"],
    outgoingIds: ["departing"],
  });
  assert.equal(target.classList.contains("tile-arrival"), true);
  assert.equal(s.animations.length, 0);
  assert.equal(s.doc.body.children.length, 0);
  assert.notEqual(target.style.opacity, "0");
});

test("a second action cancels a flying tile without leaving either render invisible", async () => {
  const s = scene();
  s.doc.tiles = [s.tile("one", 30, 300)];
  const before = captureTiles(s.doc);
  const firstTarget = s.tile("one", 80, 220, "discards", 29, 41);
  s.doc.tiles = [firstTarget];
  const first = animateTiles(before, { root: s.doc, action: "discard" });
  const inFlight = captureTiles(s.doc);
  const nextTarget = s.tile("one", 110, 220, "discards", 29, 41);
  s.doc.tiles = [nextTarget];
  const second = animateTiles(inFlight, { root: s.doc, action: "sort" });
  assert.equal(firstTarget.style.opacity, "");
  assert.notEqual(nextTarget.style.opacity, "0");
  assert.equal(s.doc.body.children.length, 0);
  assert.equal(s.animations[0].canceled, true);
  s.finish();
  await Promise.all([first, second]);
  assert.notEqual(nextTarget.style.opacity, "0");
  assert.equal(s.doc.body.children.length, 0);
});
