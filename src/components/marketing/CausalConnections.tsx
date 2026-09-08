"use client";
import { useEffect, useRef } from "react";
import r from "./reference.module.css";

/** Decorative paths measured from real element boundaries, including after reflow. */
export function CausalConnections({ links }: { links: readonly (readonly [string,string,number])[] }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current, root = svg?.parentElement;
    if (!svg || !root) return;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      const stableBounds = (node: HTMLElement) => {
        const rect = node.getBoundingClientRect();
        let dx = 0, dy = 0;
        // Reveal translations must not displace the final connection ports.
        for (let current: HTMLElement | null = node; current && current !== root; current = current.parentElement) {
          const transform = getComputedStyle(current).transform;
          if (transform !== "none") {
            const matrix = new DOMMatrixReadOnly(transform);
            dx += matrix.m41; dy += matrix.m42;
          }
        }
        return { left: rect.left - dx, right: rect.right - dx, top: rect.top - dy, bottom: rect.bottom - dy, width: rect.width, height: rect.height };
      };
      svg.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
      links.forEach(([from,to],i) => {
        const source = root.querySelector<HTMLElement>(`[data-anchor="${from}"]`);
        const target = root.querySelector<HTMLElement>(`[data-anchor="${to}"]`);
        if (!source || !target) return;
        const a=stableBounds(source), b=stableBounds(target);
        const vertical=b.top>=a.bottom-1;
        const entry=target.querySelector<HTMLElement>("[data-entry-port]");
        const targetPort=!vertical && entry ? stableBounds(entry) : b;
        const x=(vertical?a.left+a.width/2:a.right)-origin.left;
        const y=(vertical?a.bottom:a.top+a.height/2)-origin.top;
        const nx=(vertical?b.left+b.width/2:b.left)-origin.left;
        const ny=(vertical?b.top:targetPort.top+targetPort.height/2)-origin.top;
        const d=vertical?`M${x} ${y}C${x} ${(y+ny)/2} ${nx} ${(y+ny)/2} ${nx} ${ny}`:`M${x} ${y}C${(x+nx)/2} ${y} ${(x+nx)/2} ${ny} ${nx} ${ny}`;
        svg.querySelectorAll(`[data-causal-link="${i}"]`).forEach(path=>path.setAttribute("d",d));
      });
    };
    const observer=new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-anchor]").forEach(node=>observer.observe(node));
    measure();
    return ()=>observer.disconnect();
  },[links]);
  return <svg ref={ref} className={r.causalLines} aria-hidden="true">{links.map(([, ,phase],i)=><g key={i}><path data-causal-link={i}/><path data-causal-link={i} data-enter={phase} pathLength="1"/></g>)}</svg>;
}
