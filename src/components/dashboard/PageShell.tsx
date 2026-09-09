import surface from "@/components/ui/ProductSurface.module.css";
import type { ProductEntity } from "@/components/ui/EntityMark";
import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/dashboard/Breadcrumbs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContextualPageGuide } from "@/components/guidance/ContextualPageGuide";

type PageShellProps = {
  entity?: ProductEntity;
  title: string;
  eyebrow: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showGuide?: boolean;
  wide?: boolean;
};

export function PageShell({ entity, title, eyebrow, description, children, actions, breadcrumbs, showGuide = false, wide = false }: PageShellProps) {
  return (
    <div className={`${surface.page} app-page mx-auto min-w-0 w-full ${wide ? "max-w-[var(--workspace-axis)]" : "max-w-[var(--content-axis)]"} px-[var(--page-gutter)] py-4 pb-24 sm:py-5 lg:pb-8`}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
      <PageHeader entity={entity} eyebrow={eyebrow} title={title} description={description}>
        {actions}
      </PageHeader>
      {children ? <div className="app-section-stack mt-5">{children}</div> : null}
      {showGuide ? <ContextualPageGuide className="mt-8 border-t border-[rgb(var(--border))] pt-4" /> : null}
    </div>
  );
}
