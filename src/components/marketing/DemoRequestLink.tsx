import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { demoRequestHref } from "@/lib/marketing/conversion";
import s from "./landing.module.css";
import { LiquidLink } from "./LiquidLink";
export function DemoRequestLink({ onClick, material }: { onClick?: () => void; material?: "primary" | "nav" }) {
  if (material) return <LiquidLink href={demoRequestHref} onClick={onClick} variant={material}>Solicită un demo<ArrowUpRightIcon aria-hidden="true" /></LiquidLink>;
  return <Link prefetch={false} href={demoRequestHref} onClick={onClick} className={`${s.liquid} ${s.primary}`}>Solicită un demo<ArrowUpRightIcon aria-hidden="true" /></Link>;
}
