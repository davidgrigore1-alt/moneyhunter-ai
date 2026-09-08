import Image from "next/image";
import s from "./landing.module.css";
export function MarketingBrand() {
  return <span className={s.brand}><Image src="/marketing/revenew-r-black.png" width={40} height={40} alt="" className={s.brandMark} /><span>ReveNew</span></span>;
}
