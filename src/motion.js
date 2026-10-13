// Tile identities connect the same physical tile across a complete page render.
// Capture before replacing the DOM, then animate after replacement. Visual motion
// never changes the game state, delays a turn, or takes focus away from a control.
const TILE_SELECTOR = "[data-motion-id]";
const sessions = new WeakMap();
const EASING = "cubic-bezier(.2,.75,.25,1)";

function documentFor(root) {
  return root.ownerDocument || root;
}

function windowFor(root) {
  return documentFor(root).defaultView || globalThis;
}

function rectangle(node) {
  if (!node?.getBoundingClientRect) return null;
  const { left, top, width, height } = node.getBoundingClientRect();
  if (
    ![left, top, width, height].every(Number.isFinite) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  return { left, top, width, height };
}

function computed(node, root) {
  return windowFor(root).getComputedStyle?.(node) || node.style || {};
}

function zoneFor(node) {
  const zone = node.closest?.("[data-motion-zone]");
  return zone?.getAttribute("data-motion-zone") || "";
}

function recordTile(node, root, visual = node) {
  const rect = rectangle(visual);
  if (!rect) return null;
  const style = computed(node, root);
  return {
    rect,
    node,
    // Reading the final CSS transform preserves the selected tile's raised state.
    transform:
      style.transform && style.transform !== "none" ? style.transform : "",
    zone: zoneFor(node),
    origin: node.getAttribute("data-motion-origin"),
    appearance: {
      padding: style.padding,
      border: style.border,
      borderRadius: style.borderRadius,
      background: style.background,
      boxShadow: style.boxShadow,
      color: style.color,
      boxSizing: style.boxSizing || "border-box",
    },
  };
}

/**
 * Snapshot only physical tiles, never decorative examples or opponents' backs.
 * Records retain detached nodes so a departing tile can be cloned after render.
 * Source geometry belongs to the snapshot too: inserting a new exposure can
 * move the rack, and a wall draw should start where the wall was before render.
 */
export function captureTiles(root = document) {
  const before = new Map();
  const session = sessions.get(root);
  for (const node of root.querySelectorAll(TILE_SELECTOR)) {
    const id = node.getAttribute("data-motion-id");
    if (!id || before.has(id)) continue;
    const visual = session?.ghosts.get(id)?.node || node;
    const record = recordTile(node, root, visual);
    if (record) before.set(id, record);
  }
  before.sources = new Map();
  for (const node of root.querySelectorAll("#wall-source, .opponent[id]")) {
    const rect = rectangle(node);
    if (rect) before.sources.set(node.id, rect);
  }
  return before;
}

/** Cancel effects before navigating away, or before a nonanimated render. */
export function cancelTileMotion(root = document) {
  const session = sessions.get(root);
  if (!session) return;
  sessions.delete(root);
  for (const animation of session.animations) animation.cancel();
  for (const cleanup of session.cleanups) cleanup();
  session.overlay?.remove();
}

function animate(session, node, frames, options, cleanup = () => {}) {
  if (typeof node.animate !== "function") {
    cleanup();
    return;
  }
  let animation;
  try {
    animation = node.animate(frames, { easing: EASING, ...options });
  } catch {
    cleanup();
    return;
  }
  session.animations.add(animation);
  session.cleanups.add(cleanup);
  const finished = Promise.resolve(animation.finished).then(
    () => finish(),
    () => finish(),
  );
  function finish() {
    cleanup();
    session.cleanups.delete(cleanup);
    session.animations.delete(animation);
  }
  session.promises.push(finished);
}

function overlayFor(session, root) {
  if (session.overlay) return session.overlay;
  const doc = documentFor(root);
  const overlay = doc.createElement("div");
  overlay.className = "tile-motion-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "80",
    overflow: "visible",
  });
  (doc.body || doc.documentElement).append(overlay);
  session.overlay = overlay;
  return overlay;
}

function visualClone(record) {
  const ghost = record.node.cloneNode(true);
  // The overlay must not produce duplicate tile identities or active controls.
  for (const node of [ghost, ...ghost.querySelectorAll("*")]) {
    for (const attribute of [...node.attributes]) {
      if (attribute.name === "id" || attribute.name.startsWith("data-"))
        node.removeAttribute(attribute.name);
    }
    if ("disabled" in node) node.disabled = true;
    node.setAttribute("tabindex", "-1");
  }
  ghost.classList.remove("selected", "tile-arrival");
  ghost.classList.add("motion-ghost");
  ghost.setAttribute("aria-hidden", "true");
  ghost.removeAttribute("aria-pressed");
  Object.assign(ghost.style, record.appearance, {
    position: "absolute",
    left: `${record.rect.left}px`,
    top: `${record.rect.top}px`,
    width: `${record.rect.width}px`,
    height: `${record.rect.height}px`,
    minWidth: "0",
    minHeight: "0",
    maxWidth: "none",
    maxHeight: "none",
    margin: "0",
    transform: "none",
    transformOrigin: "0 0",
    transition: "none",
    pointerEvents: "none",
    opacity: "1",
  });
  return ghost;
}

function fly(
  session,
  root,
  id,
  start,
  end,
  { target = null, fade = false, delay = 0 } = {},
) {
  const ghost = visualClone(start);
  const previousOpacity = target?.style.opacity || "";
  if (target) target.style.opacity = "0";
  overlayFor(session, root).append(ghost);
  session.ghosts.set(id, { node: ghost });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (target) target.style.opacity = previousOpacity;
    ghost.remove();
    session.ghosts.delete(id);
    if (!session.ghosts.size) {
      session.overlay?.remove();
      session.overlay = null;
    }
  };
  const dx = end.left - start.rect.left;
  const dy = end.top - start.rect.top;
  const sx = end.width / start.rect.width;
  const sy = end.height / start.rect.height;
  animate(
    session,
    ghost,
    [
      {
        transform: "translate(0px, 0px) scale(1, 1)",
        opacity: fade ? 1 : 0.86,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        opacity: fade ? 0 : 1,
      },
    ],
    { duration: 470, delay, fill: "both" },
    cleanup,
  );
}

function offsetRect(rect, x, y) {
  return { ...rect, left: rect.left + x, top: rect.top + y };
}

function passVector(direction, incoming, root) {
  const distance = Math.min(
    180,
    Math.max(90, (windowFor(root).innerWidth || 800) * 0.18),
  );
  if (direction === "across" || direction === "up") return [0, -distance];
  const sign = direction === "left" ? -1 : 1;
  return [distance * sign * (incoming ? -1 : 1), -24];
}

function centerAt(rect, destination) {
  return {
    ...rect,
    left: destination.left + (destination.width - rect.width) / 2,
    top: destination.top + (destination.height - rect.height) / 2,
  };
}

function arrivalPulse(session, node, delay = 0) {
  // A pair of slow, low-contrast breaths complements the persistent arrival
  // border. Selecting the tile later does not replay this event animation.
  animate(
    session,
    node,
    [
      {
        outlineColor: "#b9904c66",
        outlineOffset: "2px",
        outlineWidth: "3px",
        outlineStyle: "solid",
      },
      {
        outlineColor: "#b9904c",
        outlineOffset: "5px",
        outlineWidth: "3px",
        outlineStyle: "solid",
        offset: 0.22,
      },
      {
        outlineColor: "#b9904c66",
        outlineOffset: "2px",
        outlineWidth: "3px",
        outlineStyle: "solid",
        offset: 0.5,
      },
      {
        outlineColor: "#b9904c",
        outlineOffset: "4px",
        outlineWidth: "3px",
        outlineStyle: "solid",
        offset: 0.75,
      },
      {
        outlineColor: "#b9904c66",
        outlineOffset: "2px",
        outlineWidth: "3px",
        outlineStyle: "solid",
      },
    ],
    { duration: 900, delay, easing: "ease-in-out" },
  );
}

/**
 * Run after render. `incomingIds` describes this event only; the app can keep a
 * separate recent-ID set to render .tile-arrival until the next game action.
 * `direction` is the outgoing Charleston pass: right, across, or left.
 * The returned promise is for optional verification, never required by gameplay.
 */
export function animateTiles(
  before,
  {
    root = document,
    action = null,
    incomingIds = [],
    outgoingIds = [],
    drawPlayer = null,
    direction = "right",
    reducedMotion = windowFor(root).matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches || false,
  } = {},
) {
  cancelTileMotion(root);
  const after = captureTiles(root);
  const incoming = new Set(incomingIds);
  for (const id of incoming) after.get(id)?.node.classList.add("tile-arrival");
  if (reducedMotion) return Promise.resolve([]);

  const session = {
    animations: new Set(),
    cleanups: new Set(),
    ghosts: new Map(),
    promises: [],
    overlay: null,
  };
  sessions.set(root, session);
  if (drawPlayer !== null) {
    const wall =
      before?.sources?.get("wall-source") || after.sources.get("wall-source");
    const seat = after.sources.get(`opponent-${drawPlayer}`);
    if (wall && seat) {
      // Only the back travels from the wall. A companion's draw stays hidden.
      const back = documentFor(root).createElement("span");
      back.className = "tile tile-back";
      const rect = { left: 0, top: 0, width: 23, height: 34 };
      fly(
        session,
        root,
        `hidden-draw-${drawPlayer}`,
        {
          node: back,
          rect: centerAt(rect, wall),
          appearance: {
            padding: "2px",
            border: "2px solid #f8e3ac",
            borderRadius: "4px",
            background:
              "repeating-linear-gradient(90deg, #decb99 0px, #decb99 5px, #c2a567 5px, #c2a567 6px)",
            boxShadow: "0 3px 0 #a78e5a",
            boxSizing: "border-box",
          },
        },
        centerAt(rect, seat),
        { fade: true },
      );
    }
  }
  let entranceIndex = 0;
  const exposed = new Set();
  for (const [id, next] of after) {
    const previous = before?.get(id);
    let arrivalDelay = 0;
    if (previous) {
      const dx = previous.rect.left - next.rect.left;
      const dy = previous.rect.top - next.rect.top;
      const sx = previous.rect.width / next.rect.width;
      const sy = previous.rect.height / next.rect.height;
      if (
        Math.abs(dx) > 0.5 ||
        Math.abs(dy) > 0.5 ||
        Math.abs(sx - 1) > 0.01 ||
        Math.abs(sy - 1) > 0.01
      ) {
        if (previous.zone !== next.zone) {
          fly(session, root, id, previous, next.rect, { target: next.node });
          arrivalDelay = 380;
          if (next.zone.startsWith("exposure"))
            exposed.add(next.node.closest(".exposure"));
        } else {
          const transform = next.transform ? ` ${next.transform}` : "";
          animate(
            session,
            next.node,
            [
              {
                transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})${transform}`,
                transformOrigin: "0 0",
              },
              { transform: next.transform || "none", transformOrigin: "0 0" },
            ],
            { duration: action === "selection" ? 190 : 360 },
          );
        }
      }
    } else if (incoming.has(id) || (action && next.zone === "discards")) {
      const delay = Math.min(entranceIndex++ * 45, 135);
      const origin =
        next.origin &&
        (before?.sources?.get(next.origin) || after.sources.get(next.origin));
      const wall =
        action === "draw" &&
        (before?.sources?.get("wall-source") ||
          after.sources.get("wall-source"));
      const [x, y] = passVector(direction, true, root);
      const startRect =
        origin || wall
          ? centerAt(next.rect, origin || wall)
          : action === "pass"
            ? offsetRect(next.rect, x, y)
            : offsetRect(next.rect, 0, -22);
      fly(session, root, id, { ...next, rect: startRect }, next.rect, {
        target: next.node,
        delay,
      });
      arrivalDelay = 380 + delay;
    }
    if (incoming.has(id)) arrivalPulse(session, next.node, arrivalDelay);
  }

  for (const id of outgoingIds) {
    const previous = before?.get(id);
    if (!previous || after.has(id)) continue;
    const [x, y] = passVector(direction, false, root);
    fly(session, root, id, previous, offsetRect(previous.rect, x, y), {
      fade: true,
    });
  }
  for (const group of exposed) {
    if (!group) continue;
    animate(
      session,
      group,
      [
        { outline: "2px solid #b9904c88", outlineOffset: "3px" },
        { outline: "2px solid #b9904c00", outlineOffset: "7px" },
      ],
      { duration: 600, easing: "ease-out" },
    );
  }
  return Promise.allSettled(session.promises).then((results) => {
    if (sessions.get(root) === session && !session.animations.size)
      sessions.delete(root);
    return results;
  });
}
