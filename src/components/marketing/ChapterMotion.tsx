"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { chapterFinalPhase, chapterPhase, chooseVisibleChapter } from "@/lib/marketing/chapter-motion";
import { paintFlow } from "@/lib/marketing/flow-timing";
import s from "./chapters.module.css";

type Scene = { element: HTMLDivElement; visibility: number; elapsed: number; duration: number; complete: boolean; paused: boolean };
const scenes = new Set<Scene>();
let dispose: (() => void) | undefined;
function startCoordinator() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0, previous = 0;
  const paint = (scene: Scene, playing: boolean) => {
    scene.element.dataset.playing = String(playing);
    paintFlow(scene.element, scene.complete ? scene.duration : scene.elapsed, scene.duration);
    scene.element.dataset.phase = String(scene.complete ? chapterFinalPhase : chapterPhase(scene.elapsed, scene.duration));
  };
  const tick = (now: number) => {
    const candidates = Array.from(scenes);
    const selected = document.hidden || reduced.matches ? -1 : chooseVisibleChapter(candidates.map(scene => ({...scene, complete: scene.complete || scene.paused})));
    const current = candidates[selected];
    candidates.forEach(scene => paint(scene, scene === current));
    if (current) {
      current.elapsed += previous ? Math.min(now - previous, 64) : 0;
      current.complete = current.elapsed >= current.duration; paint(current, !current.complete);
    }
    previous = now; frame = 0;
    if (current && (!current.complete || chooseVisibleChapter(candidates) >= 0)) frame = requestAnimationFrame(tick);
  };
  const update = () => {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (reduced.matches) scenes.forEach(scene => { scene.complete = true; paint(scene, false); });
    else frame = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", update); reduced.addEventListener("change", update);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const scene = Array.from(scenes).find(item => item.element === entry.target);
      if (scene) scene.visibility = entry.intersectionRect.height / Math.min(entry.boundingClientRect.height, innerHeight * .76);
    }
    update();
  }, { rootMargin: "-12% 0px -12% 0px", threshold: [0, .15, .3, .45, .6, .8, 1] });
  const register = (scene: Scene) => { scene.complete = reduced.matches; paint(scene, false); observer.observe(scene.element); update(); };
  const unregister = (scene: Scene) => { observer.unobserve(scene.element); scenes.delete(scene); update(); };
  dispose = () => {
    cancelAnimationFrame(frame); observer.disconnect();
    document.removeEventListener("visibilitychange", update); reduced.removeEventListener("change", update);
    coordinator = undefined; dispose = undefined;
  };
  return { register, unregister, update };
}
let coordinator: ReturnType<typeof startCoordinator> | undefined;

/** SSR is complete. Enhancement runs only the most visible chapter, once. */
export function ChapterMotion({ children, name, className = "", duration = 6200 }: {
  children: ReactNode; name: string; className?: string; duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef<Scene | null>(null);
  useEffect(() => {
    if (!ref.current || !("IntersectionObserver" in window)) return;
    const scene: Scene = { element: ref.current, visibility: 0, elapsed: 0, duration, complete: false, paused: false };
    state.current = scene;
    scenes.add(scene); coordinator ??= startCoordinator(); coordinator.register(scene);
    return () => { coordinator?.unregister(scene); if (!scenes.size) dispose?.(); };
  }, [duration]);
  return <div ref={ref} className={`${s.motion} ${className}`} data-chapter-motion={name} data-phase="6" data-playing="false">{children}<button type="button" className={s.motionPause} aria-label="Pauză animație capitol" onClick={event => { const scene = state.current; if (!scene) return; scene.paused = !scene.paused; event.currentTarget.textContent = scene.paused ? "Continuă animația" : "Pauză animație"; event.currentTarget.setAttribute("aria-pressed", String(scene.paused)); coordinator?.update(); }} aria-pressed="false">Pauză animație</button></div>;
}
