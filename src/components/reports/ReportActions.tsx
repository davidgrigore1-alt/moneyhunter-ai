"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowDownTrayIcon, DocumentDuplicateIcon, PrinterIcon } from "@heroicons/react/24/outline";
import controls from "@/components/ui/PremiumControls.module.css";
import styles from "./Reports.module.css";

export function ReportActions({ reportText, fileName = "revenew-report.txt" }: { reportText: string; fileName?: string }) {
  const [message, setMessage] = useState("");

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      setMessage("Raport copiat.");
    } catch (error) {
      console.error("Report copy error", error);
      setMessage("Nu am putut copia automat raportul.");
    }
  }

  function downloadReport() {
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Descărcarea raportului a fost pornită.");
  }

  return (
    <div className={styles.export}>
      <header><h3>Un raport pregătit pentru discuție.</h3><p>Revizuiește instantaneul curent, apoi alege formatul. Estimările, rezultatele și termenele rămân explicit etichetate.</p></header>
      <div className={styles.exportActions}>
        <div><h4>01 · În documentul echipei</h4><Button onClick={copyReport} className={controls.primary}><DocumentDuplicateIcon width={16} aria-hidden="true" />Copiază raportul</Button><p>Copiază textul pentru a-l include în materialul de lucru.</p></div>
        <div><h4>02 · Fișier local</h4><Button onClick={downloadReport} variant="secondary" className={controls.secondary}><ArrowDownTrayIcon width={16} aria-hidden="true" />Descarcă .txt</Button><p>Păstrează raportul ca fișier text, cu data generării.</p></div>
        <div><h4>03 · Pentru revizuire</h4><Button onClick={() => window.print()} variant="secondary" className={controls.secondary}><PrinterIcon width={16} aria-hidden="true" />Tipărește / PDF</Button><p>Deschide dialogul browserului pentru tipărire sau salvare PDF.</p></div>
      </div>
      {message ? <span className="text-sm font-medium text-[rgb(var(--text-secondary))] print:hidden" role="status">{message}</span> : null}
      <details className={styles.preview}><summary className={`focus-ring text-sm font-medium ${controls.disclosure}`}>Verifică textul raportului</summary><pre>{reportText}</pre></details>
      <pre className={styles.printCopy}>{reportText}</pre>
    </div>
  );
}
