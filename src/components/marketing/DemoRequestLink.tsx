import { demoRequestHref } from "@/lib/marketing/conversion";
import { LiquidLink } from "./LiquidLink";
export function DemoRequestLink({ onClick, material = "primary" }: { onClick?: () => void; material?: "primary" | "nav" }) {
  return <LiquidLink href={demoRequestHref} onClick={onClick} variant={material}>Discută cu noi</LiquidLink>;
}
