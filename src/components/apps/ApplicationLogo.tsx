import Image from "next/image";
import { CodeBracketSquareIcon, DocumentTextIcon, TableCellsIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type LogoAsset = { src: string; wide?: boolean; width?: number; artwork?: { width: number; height: number; objectPosition: string } };
const assets: Record<string, LogoAsset> = {
  "google-workspace": { src: "/brands/applications/google-symbol.svg" },
  // The approved raster has wide transparent margins; size its artwork optically.
  xlsx: { src: "/marketing/excel-source.png", artwork: { width: 50, height: 100 / 3, objectPosition: "50% 50%" } },
  gmail: { src: "/brands/google/gmail.svg" },
  "google-calendar": { src: "/brands/google/calendar.svg" },
  "microsoft-365": { src: "/brands/applications/microsoft-365.svg" },
  hubspot: { src: "/brands/applications/hubspot.svg" },
  pipedrive: { src: "/brands/applications/pipedrive.svg", wide: true },
  slack: { src: "/brands/applications/slack.svg" },
  "google-drive": { src: "/brands/applications/google-drive.svg" },
  docusign: { src: "/brands/applications/docusign.svg", wide: true },
  // The cloud fills its 205.73 × 144 viewBox. Center that artwork box, not a
  // wordmark-sized padded image; retain the existing 68px provider tile.
  salesforce: { src: "/brands/applications/salesforce.svg", wide: true, artwork: { width: 44, height: 44 * 144 / 205.73, objectPosition: "50% 50%" } }
};
const workspaceWordmark: LogoAsset = { src: "/brands/applications/google-workspace.svg", wide: true, width: 128 };
// Neutral capability symbols, not approximations of unavailable brand artwork.
const plannedSymbols = { csv: TableCellsIcon, "google-docs": DocumentTextIcon, "google-sheets": TableCellsIcon, "google-meet": VideoCameraIcon };

/** Local source artwork; optical sizing never changes its aspect ratio or colors. */
export function ApplicationLogo({ item, size = "default", variant = "symbol", className }: {
  item: { id: string; name: string; logoUrl?: string | null; logoMode?: "mark" | "wordmark" };
  size?: "compact" | "default" | "large";
  variant?: "symbol" | "provider";
  className?: string;
}) {
  const asset = item.id === "google-workspace" && variant === "provider" ? workspaceWordmark : Object.hasOwn(assets, item.id) ? assets[item.id] : item.logoUrl ? { src: item.logoUrl, wide: item.logoMode === "wordmark" } as LogoAsset : undefined;
  const Placeholder = Object.hasOwn(plannedSymbols, item.id) ? plannedSymbols[item.id as keyof typeof plannedSymbols] : CodeBracketSquareIcon;
  const pixels = size === "compact" ? 32 : 40;
  const width = asset?.width ?? (asset?.wide ? 68 : pixels);
  return (
    <span className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))]", className)} style={{ width, height: pixels }}>
      {asset ? <Image src={asset.src} alt={item.name} width={asset.artwork?.width ?? width} height={asset.artwork?.height ?? pixels} unoptimized
        style={asset.artwork ? { width: asset.artwork.width, height: asset.artwork.height, objectPosition: asset.artwork.objectPosition } : undefined}
        className={cn("object-contain", !asset.artwork && "h-full w-full", !asset.artwork && (asset.wide ? "p-1.5" : "p-2"))} />
        : <Placeholder className="h-5 w-5 text-zinc-500" role="img" aria-label={item.name} />}
    </span>
  );
}
