"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import s from "./hero.module.css";

/** Local material light: direct CSS updates, one RAF, no pointer-driven renders. */
export function LiquidLink({ href, children, variant = "primary", onClick }: {
  href: string; children: ReactNode; variant?: "primary" | "quiet" | "nav"; onClick?: () => void;
}) {
  const control = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const element = control.current;
    if (!element) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, visible = false;
    let x = 25, y = 20, targetX = 25, targetY = 20;
    const write = () => {
      element.style.setProperty("--liquid-x", `${x}%`);
      element.style.setProperty("--liquid-y", `${y}%`);
    };
    const animate = () => {
      x += (targetX - x) * .15; y += (targetY - y) * .15;
      write();
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > .1) frame = requestAnimationFrame(animate);
      else frame = 0;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(animate); };
    const move = (event: PointerEvent) => {
      if (!fine.matches || reduced.matches || event.pointerType === "touch") return;
      const rect = element.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width * 100;
      targetY = (event.clientY - rect.top) / rect.height * 100;
      schedule();
    };
    const leave = () => { targetX = 25; targetY = 20; schedule(); };
    const availability = () => {
      element.dataset.liquidRunning = String(visible && !document.hidden && !reduced.matches);
      if (document.hidden || reduced.matches || !fine.matches || !visible) {
        cancelAnimationFrame(frame); frame = 0;
        x = targetX = 25; y = targetY = 20; write();
      }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; availability(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", availability);
    fine.addEventListener("change", availability);
    reduced.addEventListener("change", availability);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", leave);
    availability();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", availability);
      fine.removeEventListener("change", availability); reduced.removeEventListener("change", availability);
    };
  }, []);
  return <Link ref={control} prefetch={false} href={href} onClick={onClick} className={`${s.liquid} ${s[variant]}`}>
    <span className={s.liquidMaterial} aria-hidden="true"><span className={s.liquidCaustic} /></span>
    <span className={s.liquidLabel}>{children}</span>
  </Link>;
}
