import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  calm?: boolean;
};

export function EmptyState({ title, description, actions, action, secondaryAction, icon, calm = false }: EmptyStateProps) {
  return (
    <Card variant="subtle" padding="spacious" className={`rounded-xl bg-[rgb(var(--surface-subtle))] text-center shadow-none ${calm ? "border-solid py-10 sm:py-12" : "border-dashed"}`}>
      {icon ? <div className={calm ? "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-panel border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-secondary))] [&>svg]:h-6 [&>svg]:w-6" : "mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-control bg-[rgb(var(--surface-muted))] text-[rgb(var(--text-secondary))]"}>{icon}</div> : null}
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[rgb(var(--text-muted))]">{description}</p>
      {actions || action || secondaryAction ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}{secondaryAction}{actions}</div> : null}
    </Card>
  );
}
