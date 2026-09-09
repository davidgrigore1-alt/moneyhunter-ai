import { BuildingOffice2Icon, UserGroupIcon, BoltIcon, DocumentTextIcon, CalendarDaysIcon, QueueListIcon, ArrowsRightLeftIcon, ChartBarIcon, PuzzlePieceIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const entities = {
  companies: [BuildingOffice2Icon, "var(--entity-company)"], contacts: [UserGroupIcon, "var(--entity-contact)"],
  opportunities: [BoltIcon, "var(--entity-opportunity)"], documents: [DocumentTextIcon, "var(--entity-document)"],
  meetings: [CalendarDaysIcon, "var(--entity-meeting)"], sequences: [QueueListIcon, "var(--entity-sequence)"],
  workflows: [ArrowsRightLeftIcon, "var(--entity-opportunity)"], reports: [ChartBarIcon, "var(--entity-company)"],
  apps: [PuzzlePieceIcon, "var(--entity-document)"], approvals: [ShieldCheckIcon, "var(--entity-opportunity)"]
} as const;
export type ProductEntity = keyof typeof entities;
export function EntityMark({ entity }: { entity: ProductEntity }) {
  const [Icon, color] = entities[entity];
  return <Icon aria-hidden="true" style={{ color: `rgb(${color})` }} className="h-5 w-5 shrink-0" />;
}
