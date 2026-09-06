"use client";
import { useEffect, useState, type ReactNode } from "react";
import s from "./chapters.module.css";
export function SystemDisclosure({children}:{children:ReactNode}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const desktop=matchMedia("(min-width:601px)");
    const adapt=()=>setOpen(desktop.matches);
    adapt(); desktop.addEventListener("change",adapt);
    return ()=>desktop.removeEventListener("change",adapt);
  },[]);
  return <details className={s.systemDisclosure} open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary><span>Workspace · CRM · Conversații · Documente</span><strong>Vezi sistemele evaluate</strong></summary>{children}</details>;
}
