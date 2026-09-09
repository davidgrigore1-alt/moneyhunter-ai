import { ShellNavigation } from "@/components/dashboard/ShellNavigation";
import { Logo } from "@/components/ui/Logo";
import { WorkspaceMenu } from "@/components/dashboard/WorkspaceMenu";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { primaryNavigation, utilityNavigation, type NavigationItem } from "@/lib/navigation";
import density from "./SidebarDensity.module.css";

export function Sidebar({
  primaryItems = primaryNavigation,
  utilityItems = utilityNavigation,
  businessName,
  userEmail,
  userName,
  isDemo = false
}: {
  primaryItems?: NavigationItem[];
  utilityItems?: NavigationItem[];
  businessName?: string;
  isDemo?: boolean;
  userEmail?: string;
  userName?: string;
}) {
  return (
    <aside
  className={`${density.sidebar} authenticated-sidebar fixed inset-y-0 left-0 z-40 hidden w-[224px] overflow-visible border-r border-[rgb(var(--border-strong)/0.82)] bg-[rgb(var(--sidebar))] lg:flex lg:flex-col`}
  aria-label="Navigare ReveNew"
>
  <header data-sidebar-brand className="border-b border-[rgb(var(--border))] px-4 pb-3 pt-4">
    <Logo href="/dashboard" />
    <p className="mt-3 truncate text-xs text-[rgb(var(--text-muted))]" title={businessName}>{businessName || "Spațiul echipei"}</p>
  </header>

  <div data-sidebar-search className="border-b border-[rgb(var(--border)/0.72)] px-2 py-1.5">
    <GlobalSearch />
  </div>

      <div data-sidebar-primary className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-1.5 pt-1.5">
        <ShellNavigation items={primaryItems} />
      </div>

      <div data-sidebar-utilities className="shrink-0 border-t border-[rgb(var(--border))] px-2 py-1.5">
        <ShellNavigation items={utilityItems} ariaLabel="Utilitare" />
        <div data-sidebar-account className="mt-1 border-t border-[rgb(var(--border))] pt-1">
          <WorkspaceMenu businessName={businessName} userEmail={userEmail} userName={userName} isDemo={isDemo} variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}
