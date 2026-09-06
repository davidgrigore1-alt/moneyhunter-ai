// Marketing-only navigation through five illustrative product moments.
export const theatreBeats = ["Întreabă", "Răspuns", "Companii", "Workflow", "Rapoarte"] as const;
export const beatDuration = [3000, 5500, 4200, 5100, 4600, 450] as const;
export type TheatreBeat = 0 | 1 | 2 | 3 | 4;
export type PlaybackState = { beat: TheatreBeat | 5; mode: "playing" | "paused" | "complete" };
export type PlaybackAction = { type: "start" | "advance" | "pause" | "toggle" | "reduce" } | { type: "select"; beat: TheatreBeat };
// SSR, hydration and reduced motion share the same first screen.
export const staticPlayback: PlaybackState = { beat: 0, mode: "complete" };
export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "start": return { beat: 0, mode: "playing" };
    case "reduce": return staticPlayback;
    case "pause": return state.mode === "playing" ? { ...state, mode: "paused" } : state;
    case "select": return { beat: action.beat, mode: "paused" };
    case "toggle": return state.mode === "complete" ? state : { ...state, mode: state.mode === "playing" ? "paused" : "playing" };
    case "advance": return state.mode !== "playing" ? state : { beat: ((state.beat + 1) % 6) as PlaybackState["beat"], mode: "playing" };
  }
}
export function adjacentBeat(beat: TheatreBeat, key: string): TheatreBeat {
  if (key === "Home") return 0;
  if (key === "End") return 4;
  if (key === "ArrowRight") return ((beat + 1) % 5) as TheatreBeat;
  if (key === "ArrowLeft") return ((beat + 4) % 5) as TheatreBeat;
  return beat;
}
