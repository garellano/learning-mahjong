/**
 * Plays one table event per timeout. Rendering can call sync() freely without
 * restarting the pause or creating another timer.
 */
export function createTurnPlayer({
  step,
  shouldRun,
  onError = () => {},
  delay = 850,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  let pending = null;
  let generation = 0;
  let stepping = false;
  let disposed = false;

  function stop() {
    generation += 1;
    if (pending !== null) {
      clearTimer(pending.handle);
      pending = null;
    }
  }

  function sync() {
    if (disposed) return;
    if (!shouldRun()) {
      stop();
      return;
    }
    if (stepping || pending !== null) return;

    const token = { generation, handle: null };
    pending = token;
    token.handle = setTimer(() => {
      // A cleared callback may already be queued by the browser. Its identity
      // and generation must still belong to the current table before advancing.
      if (disposed || pending !== token || generation !== token.generation)
        return;
      pending = null;
      if (!shouldRun()) return;

      stepping = true;
      try {
        step();
      } catch (error) {
        stop();
        onError(error);
        return;
      } finally {
        stepping = false;
      }

      // A stop during step() belongs to a new game, route, or other lifecycle
      // change. Let that caller explicitly resume instead of reviving this run.
      if (!disposed && generation === token.generation) sync();
    }, delay);
  }

  function dispose() {
    disposed = true;
    stop();
  }

  return { sync, stop, dispose };
}
