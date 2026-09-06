"use client";
import Link from "next/link";
import { useRef, type ReactNode, type PointerEvent } from "react";
import s from "./hero.module.css";
/** One uniform, local marketing material. No perpetual animation or pointer clock. */
export function LiquidLink({ href, children, variant = "primary", onClick, disabled = false }: {
  href: string; children: ReactNode; variant?: "primary" | "quiet" | "nav"; onClick?: () => void; disabled?: boolean;
}) {
  const bounds = useRef<DOMRect | null>(null);
  const light = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse" || !bounds.current) return;
    event.currentTarget.style.setProperty("--light-x", `${event.clientX - bounds.current.left}px`);
    event.currentTarget.style.setProperty("--light-y", `${event.clientY - bounds.current.top}px`);
  };
  const className = `${s.liquid} ${s[variant]}`;
  if (disabled) return <span className={className} aria-disabled="true">{children}</span>;
  return <Link prefetch={false} href={href} onClick={onClick} className={className}
    onPointerEnter={event => { bounds.current = event.currentTarget.getBoundingClientRect(); light(event); }}
    onPointerMove={light} onPointerLeave={() => { bounds.current = null; }}><span>{children}</span></Link>;
}
