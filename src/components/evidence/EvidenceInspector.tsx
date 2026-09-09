"use client";

import { useId, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import controls from "@/components/ui/PremiumControls.module.css";
import styles from "./Evidence.module.css";

/** Presentation only. Callers supply an already-authorized projection and safe navigation. */
export function EvidenceInspector({ title, fact, metadata, onClose, children, sourceAction, boundary }: {
  title: string;
  fact?: string;
  metadata: { label: string; value: ReactNode }[];
  onClose: () => void;
  children?: ReactNode;
  sourceAction?: ReactNode;
  boundary: string;
}) {
  const titleId = useId();
  return <Drawer labelledBy={titleId} onClose={onClose}><div className="flex h-full min-h-0 flex-col">
    <header className={styles.header}><div className="min-w-0"><p>DOVADĂ · PROVENIENȚĂ</p><h2 id={titleId}>{title}</h2></div><Button size="small" variant="secondary" className={controls.secondary} onClick={onClose}>Închide</Button></header>
    <div className={styles.content}>
      {fact ? <blockquote className={styles.excerpt}>{fact}</blockquote> : null}
      <dl className={styles.facts}>{metadata.map(item => <div key={item.label} className="contents"><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
      {children}<p className={styles.boundary}>{boundary}</p>{sourceAction}
    </div>
  </div></Drawer>;
}
