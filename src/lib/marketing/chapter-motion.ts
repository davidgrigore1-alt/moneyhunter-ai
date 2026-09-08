// Finite marketing illustration: hidden/offscreen time never advances it.
export const chapterFinalPhase = 6;
export function chapterPhase(elapsed: number, duration: number) {
  // Let the last reveal settle before the coordinator stops transitions.
  const progression = Math.max(1, duration - Math.min(700, duration * .2));
  return Math.min(chapterFinalPhase, Math.floor(Math.max(0, elapsed) / progression * chapterFinalPhase));
}
export function chooseVisibleChapter(candidates: readonly { visibility: number; complete: boolean }[]) {
  let selected = -1, largest = .28;
  candidates.forEach((candidate, index) => {
    if (!candidate.complete && candidate.visibility > largest) { selected = index; largest = candidate.visibility; }
  });
  return selected;
}
