import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/brand";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="focus-ring flex items-center gap-3 rounded-button" aria-label={brand.name}>
      <Image src="/marketing/revenew-r-black.png" width={36} height={36} priority alt="" className="shrink-0 rounded-lg border border-white/15" />
      <span className="leading-tight">
        <span className="block text-[22px] font-semibold tracking-normal text-[rgb(var(--foreground))]">{brand.name}</span>
      </span>
    </Link>
  );
}
