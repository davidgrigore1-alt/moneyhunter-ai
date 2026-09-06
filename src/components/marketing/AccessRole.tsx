"use client";
import { useState } from "react";
import { FingerPrintIcon } from "@heroicons/react/24/outline";
import s from "./chapters.module.css";
export function AccessRole() {
 const [role,setRole]=useState("commercial");
 return <div className={s.accessExample} data-enter="2"><div className={s.permissionGate}><FingerPrintIcon aria-hidden="true"/><div><strong>Ana Popescu · acces în companie</strong><span>Exemplu de autorizare, în funcție de rol.</span></div></div><div className={s.roleOptions} role="group" aria-label="Rol ilustrativ"><button type="button" aria-pressed={role==="commercial"} onClick={()=>setRole("commercial")}>Responsabil comercial</button><button type="button" aria-pressed={role==="reviewer"} onClick={()=>setRole("reviewer")}>Revizuire</button></div><p aria-live="polite">{role==="commercial"?"Consultă sursele permise ale cazului și pregătește o propunere.":"Verifică propunerea și dovezile permise. Decizia cere autorizare separată."}</p></div>;
}
