import Image from "next/image";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export type IntegrationBrand = "gmail" | "google_calendar" | "google_drive" | "revenew";

const sources: Record<Exclude<IntegrationBrand, "revenew">, { src: string; label: string }> = {
  google_drive: { src: "/brands/applications/google-drive.svg", label: "Google Drive" },
  gmail: { src: "/brands/google/gmail.svg", label: "Gmail" },
  google_calendar: { src: "/brands/google/calendar.svg", label: "Google Calendar" }
};

export function IntegrationBrandIcon({ provider, size = "medium", className, withContainer = true }: { provider: IntegrationBrand; size?: "small" | "medium" | "large"; className?: string; withContainer?: boolean }) {
  const pixels = size === "small" ? 16 : size === "large" ? 28 : 20;
  const dimensions = size === "small" ? "h-6 w-6 rounded-md" : size === "large" ? "h-11 w-11 rounded-[10px]" : "h-9 w-9 rounded-[9px]";
  if (provider === "revenew") return <span className={cn("grid shrink-0 place-items-center overflow-hidden border border-white/15 bg-black", dimensions, className)}><Image src="/marketing/revenew-r-black.png" width={size === "small" ? 24 : size === "large" ? 44 : 36} height={size === "small" ? 24 : size === "large" ? 44 : 36} alt="ReveNew" /></span>;
  const source = sources[provider];
  const image = <Image src={source.src} alt={source.label} width={pixels} height={pixels} className="object-contain" />;
  if (!withContainer) return <span className={cn("inline-grid shrink-0 place-items-center", className)}>{image}</span>;
  return <span className={cn("grid shrink-0 place-items-center border border-black/5 bg-white shadow-sm", dimensions, className)}>{image}</span>;
}
