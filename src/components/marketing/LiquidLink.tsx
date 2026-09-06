"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import s from "./hero.module.css";
/** One uniform, local marketing material. No perpetual animation or pointer clock. */
export function LiquidLink({ href, children, variant = "primary", onClick, disabled = false }: {
  href: string; children: ReactNode; variant?: "primary" | "quiet" | "nav"; onClick?: () => void; disabled?: boolean;
}) {
  const className = `${s.liquid} ${s[variant]}`;
  if (disabled) return <span className={className} aria-disabled="true">{children}</span>;
  return <Link prefetch={false} href={href} onClick={onClick} className={className}>{children}</Link>;
}
