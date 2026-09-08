import { flowFrame as theatreFrame, paintFlow as theatrePaint } from "./flow-timing";

// Map the lower story's unequal reading/travel windows onto the original painter.
// The Theatre implementation and its clock are not changed.
// Four 600ms travels, 300ms ordinary dwells, 500ms preparation, 900ms human hold.
const boundaries = [0, 300, 900, 1200, 1800, 2100, 2700, 3200, 3800, 4700];
function storyClock(elapsed: number, count: number, duration: number) {
  if (count !== 5) return { elapsed, duration };
  const time = Math.max(0, Math.min(4700, elapsed * (4700 / duration)));
  const segment = boundaries.findIndex((end, index) => index > 0 && time < end);
  if (segment < 0) return { elapsed: 9, duration: 9 };
  const start = boundaries[segment - 1];
  return { elapsed: segment - 1 + (time - start) / (boundaries[segment] - start), duration: 9 };
}

export function flowFrame(elapsed: number, count: number, duration: number) {
  const clock = storyClock(elapsed, count, duration);
  return theatreFrame(clock.elapsed, count, clock.duration);
}

export function paintFlow(root: HTMLElement, elapsed: number, duration: number) {
  const count = root.querySelectorAll("[data-flow-node]").length;
  const clock = storyClock(elapsed, count, duration);
  theatrePaint(root, clock.elapsed, clock.duration);
  // Resize and manual inspection use the real chapter clock, including its hold.
  root.dataset.flowElapsed = String(elapsed);
  root.dataset.flowDuration = String(duration);
}
