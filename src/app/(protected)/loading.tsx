import { Skeleton } from "@/components/ui/Skeleton";

export default function ProtectedLoading() {
  return (
    <div className="mx-auto w-full max-w-[var(--workspace-axis)] px-[var(--page-gutter)] py-5 pb-24 lg:pb-8" aria-label="Se încarcă pagina" aria-busy="true">
      <div className="border-b border-[rgb(var(--border))] pb-5">
        <Skeleton shape="line" className="h-3 w-24" />
        <Skeleton shape="line" className="mt-3 h-7 w-64 max-w-full" />
        <Skeleton shape="line" className="mt-3 h-4 w-[32rem] max-w-full" />
      </div>
      <div className="mt-6 grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-subtle))] p-4">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-14" />)}
      </div>
    </div>
  );
}
