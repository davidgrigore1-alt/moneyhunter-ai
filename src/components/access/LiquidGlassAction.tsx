"use client";

import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";
import styles from "./LiquidGlassAction.module.css";

type LiquidGlassTone = "champagne" | "light" | "dark";
type LiquidGlassSize = "compact" | "default" | "large";

type LiquidGlassActionProps = {
  children: ReactNode;
  href?: string;
  tone?: LiquidGlassTone;
  size?: LiquidGlassSize;
  fullWidth?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  "aria-label"?: string;
};

function setPointerLight(event: PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--glass-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--glass-y", `${event.clientY - rect.top}px`);
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function LiquidGlassAction({
  children,
  href,
  tone = "champagne",
  size = "default",
  fullWidth = false,
  className,
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  title,
  "aria-label": ariaLabel
}: LiquidGlassActionProps) {
  const unavailable = disabled || loading;

  const classes = classNames(
    styles.root,
    styles[tone],
    styles[size],
    fullWidth && styles.fullWidth,
    unavailable && styles.disabled,
    className
  );

  const content = (
    <>
      <span className={styles.pointerGlow} aria-hidden="true" />
      <span className={styles.innerHighlight} aria-hidden="true" />
      <span className={styles.label}>{children}</span>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
    </>
  );

  const shared = {
    className: classes,
    onPointerMove: setPointerLight,
    title,
    "aria-label": ariaLabel
  };

  if (href && !unavailable) {
    return (
      <Link href={href} onClick={onClick} {...shared}>
        {content}
      </Link>
    );
  }

  if (href && unavailable) {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-busy={loading || undefined}
        {...shared}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={unavailable}
      aria-busy={loading || undefined}
      {...shared}
    >
      {content}
    </button>
  );
}
