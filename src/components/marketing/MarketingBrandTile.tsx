import Image from "next/image";
import s from "./landing.module.css";
import r from "./reference.module.css";

/** Full-black supplied artwork, isolated to public marketing surfaces. */
export function MarketingBrandTile({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Image src="/marketing/revenew-r-black.png" width={size} height={size} alt="" className={`${r.brandTile} ${className}`} />;
}

export function MarketingPublicBrand() {
  return <span className={s.brand}><MarketingBrandTile className={s.brandMark} /><span>ReveNew</span></span>;
}
