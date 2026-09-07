export function sourceProgress(elapsed: number, duration: number, index: number) {
  const ratio = elapsed / duration;
  const total = 5;
  const sequenceShare = 0.84;
  const lane = sequenceShare / total;
  const activeWindow = lane * 0.82;
  const start = index * lane;
  const inRange = (ratio - start) / activeWindow;

  return Math.max(0, Math.min(1, inRange));
}

/** Uses the chapter's elapsed time; no independent timer or CSS drawing clock. */
export function paintSources(root: HTMLElement, elapsed: number, duration: number) {
  root.querySelectorAll<SVGGElement>("[data-source-packet]").forEach((packet, index) => {
    const path = root.querySelector<SVGPathElement>(`[data-source-route="${index}"]`);
    if (!path) return;

    const progress = sourceProgress(elapsed, duration, index);
    const length = Number(path.dataset.length || (path.dataset.length = String(path.getTotalLength())));
    const point = path.getPointAtLength(length * progress);
    const svg = packet.ownerSVGElement;
    const sx = svg?.clientWidth ? 1000 / svg.clientWidth : 1;
    const sy = svg?.clientHeight ? 132 / svg.clientHeight : 1;

    packet.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${sx} ${sy})`);
    packet.style.opacity = progress === 1 ? "0" : String(Math.min(1, progress * 10));
  });
}
