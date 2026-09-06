/** One elapsed clock owns arrivals, processing, connectors and inspection state. */
export function flowFrame(elapsed: number, count: number, duration: number) {
  const segment = duration / (count * 2 - 1);
  const time = Math.max(0, Math.min(duration, elapsed));
  const nodes = Array.from({length: count}, (_, i) => time < i * segment * 2 ? "pending" : i === count - 1 ? "review" : time < (i * 2 + 1) * segment ? "processing" : "complete");
  const edges = Array.from({length: count - 1}, (_, i) => Math.max(0, Math.min(1, (time - (i * 2 + 1) * segment) / segment)));
  return {nodes, edges, active: Math.min(count - 1, Math.floor(time / (segment * 2)))};
}
export function paintFlow(root: HTMLElement, elapsed: number, duration: number) {
  root.dataset.flowElapsed = String(elapsed); root.dataset.flowDuration = String(duration);
  const nodes = root.querySelectorAll<HTMLElement>("[data-flow-node]");
  if (!nodes.length) return;
  const frame = flowFrame(elapsed, nodes.length, duration);
  nodes.forEach((node, i) => { node.dataset.flowState = frame.nodes[i]; node.style.setProperty("--edge-fill", String(frame.edges[i] ?? 0)); });
  const inspected = elapsed >= duration && root.dataset.inspectedNode !== undefined ? Number(root.dataset.inspectedNode) : frame.active;
  root.querySelectorAll<HTMLElement>("[data-flow-panel]").forEach((panel, i) => { panel.hidden = i !== inspected; });
  root.querySelectorAll<SVGPathElement>("[data-flow-edge]").forEach((path, i) => {
    const progress = frame.edges[i];
    path.style.strokeDashoffset = String(1 - progress);
    const dot = root.querySelector<SVGCircleElement>(`[data-flow-dot="${i}"]`);
    const length = Number(path.dataset.length || 0);
    if (dot && length) {
      const point = path.getPointAtLength(length * progress);
      dot.setAttribute("cx", String(point.x)); dot.setAttribute("cy", String(point.y));
      dot.style.opacity = progress > 0 && progress < 1 ? "1" : "0";
    }
  });
  root.querySelectorAll<HTMLElement>("[data-flow-rail]").forEach((node, i) => { node.dataset.flowState = frame.nodes[i]; node.style.setProperty("--edge-fill", String(frame.edges[i] ?? 0)); });
}
