/** Five non-overlapping journeys with reading time before movement. */
export function sourceFrame(elapsed: number, duration: number, index: number) {
  const slot = duration / 5;
  const time = Math.max(0, elapsed) - index * slot;
  // At 9.5s: 180ms emerge, 650ms read, 650ms travel, 220ms merge, 200ms pause.
  const appear = slot * 18 / 190, dwell = slot * 65 / 190, travel = slot * 65 / 190, merge = slot * 22 / 190;
  const departure = appear + dwell, arrival = departure + travel;
  const progress = Math.max(0, Math.min(1, (time - departure) / travel));
  const active = time >= 0 && time < arrival + merge;
  const opacity = !active ? 0 : time < appear ? time / appear : time <= arrival ? 1 : 1 - (time-arrival)/merge;
  return { progress, opacity, active, merged: time >= arrival, merging: time >= arrival && time < arrival + merge };
}
export function sourceProgress(elapsed: number, duration: number, index: number) {
  return sourceFrame(elapsed,duration,index).progress;
}
/** Uses the visible chapter clock. No independent timers or concurrent journeys. */
export function paintSources(root: HTMLElement, elapsed: number, duration: number) {
  let merging = false;
  root.querySelectorAll<SVGGElement>("[data-source-packet]").forEach((packet, index) => {
    const path = root.querySelector<SVGPathElement>(`[data-source-route="${index}"]`);
    if (!path) return;
    const state = sourceFrame(elapsed,duration,index);
    const svg = packet.ownerSVGElement;
    // A phone uses a single short vertical transfer below the source strip.
    // Keep labels at full reading size instead of sending miniatures across five lanes.
    const compact = !!svg && svg.clientWidth < 540;
    path.dataset.originalPath ??= path.getAttribute("d") ?? "";
    const geometry = compact ? "M500 0V132" : path.dataset.originalPath;
    if (path.getAttribute("d") !== geometry) path.setAttribute("d",geometry);
    const length = path.getTotalLength();
    const point = path.getPointAtLength(length * state.progress);
    const sx = svg?.clientWidth ? 1000 / svg.clientWidth : 1;
    const sy = svg?.clientHeight ? 132 / svg.clientHeight : 1;
    packet.setAttribute("transform",`translate(${point.x} ${point.y}) scale(${sx} ${sy})`);
    packet.style.opacity = String(state.opacity);
    root.querySelector<HTMLElement>(`[data-source-object="${index}"]`)?.setAttribute("data-source-state",state.active?"active":state.merged?"complete":"pending");
    merging ||= state.merging;
  });
  root.querySelector<HTMLElement>("[data-context-core]")?.setAttribute("data-receiving",String(merging));
}
