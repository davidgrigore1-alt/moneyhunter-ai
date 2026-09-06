import type { CSSProperties } from "react";
import Image from "next/image";
import s from "./theatre.module.css";

const colors = ["#ecdaa9", "#76b9f5", "#e6ae84", "#8fc8d6", "#b59ced", "#7bbbc8", "#ccafa1", "#b3bdce"];
/** Original geometric identities for explicitly fictional companies. */
export function CompanyMark({ variant = 0 }: { variant?: number }) {
  const paths = [
    <><path d="m16 2 6 7-6 7-6-7Z" /><path d="m8 11 6 7-6 7-6-7Zm16 0 6 7-6 7-6-7Z" opacity=".65" /><path d="m16 20 6 7-6 4-6-4Z" /></>,
    <><path d="M5 8a14 14 0 0 1 22 0l-3 3a10 10 0 0 0-16 0Zm0 16a14 14 0 0 0 22 0l-3-3a10 10 0 0 1-16 0Z" /><path d="M13 5h6v22h-6Z" opacity=".8" /></>,
    <><path d="m4 11 13-8 3 5-13 8Zm8 9 13-8 3 5-13 8Z" /><path d="m4 23 5-3 3 5-5 3Z" opacity=".5" /></>,
    <><path d="M13 3h6v8l-3 3-3-3ZM21 13h8v6h-8l-3-3ZM13 21l3-3 3 3v8h-6ZM3 13h8l3 3-3 3H3Z" /></>,
    <><path d="m16 3 12 7-12 7L4 10Z" /><path d="M4 13l10 6v11L4 24Z" opacity=".55" /><path d="m18 19 10-6v11l-10 6Z" opacity=".8" /></>,
    <><path d="M9 4h5c-8 7 13 15 4 24h-5C24 18 2 12 9 4Z" /><path d="M19 4h5C14 13 31 20 24 28h-5c7-8-10-15 0-24Z" opacity=".5" /></>,
    <><path d="M3 7h18v5H8v17H3ZM11 15h18v14h-5v-9H11Z" /><path d="M11 23h9v6h-9ZM24 3h5v9h-5Z" opacity=".6" /></>,
    <><path d="M15 4 28 27H2Zm0 10L9 24h12Z" fillRule="evenodd" /><path d="M15 14v10h6Z" opacity=".5" /></>,
  ];
  return <span className={s.companyMark} style={{ "--entity": colors[variant % 8] } as CSSProperties} aria-hidden="true"><svg viewBox="0 0 32 32" fill="currentColor">{paths[variant % 8]}</svg></span>;
}

export function PersonAvatar({ variant = 0 }: { variant?: number }) {
  return <span className={s.personAvatar} data-variant={variant} aria-hidden="true">{["AP", "RM", "MI"][variant % 3]}</span>;
}

export function ExcelMark() {
  return <span className={s.excelMark}><Image src="/marketing/excel-source.png" width={90} height={60} alt="Microsoft Excel" /></span>;
}

export function ModuleMark({ kind }: { kind: "companies" | "contacts" | "opportunities" | "sequences" }) {
  return <span className={s.moduleMark} data-module={kind} aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    {kind === "companies" ? <><path d="M4 17V4l8-2v15M12 7h4v10M2 17h16" /><path d="M7 6h2M7 9h2M7 12h2" /></> : kind === "contacts" ? <><circle cx="10" cy="6" r="3" /><path d="M4 17v-2c0-6 12-6 12 0v2Z" /></> : kind === "opportunities" ? <><path d="m10 2 7 8-7 8-7-8Z" /><path d="M7 10h6m-3-3 3 3-3 3" /></> : <><path d="M3 5h8m-2-3 3 3-3 3M5 10h10M3 15h8m-2-3 3 3-3 3" /><circle cx="16" cy="5" r="1" /><circle cx="16" cy="15" r="1" /></>}
  </svg></span>;
}
