"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { authPath } from "@/lib/auth/redirects";
import { marketingSections } from "@/lib/marketing/navigation";
import { MarketingPublicBrand as MarketingBrand } from "./MarketingBrandTile";
import { DemoRequestLink } from "./DemoRequestLink";
import { marketingFont } from "./font";
import s from "./hero.module.css";

export function MarketingNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  function closeMenu() { dialog.current?.close(); }
  function openMenu() {
    previousOverflow.current = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = "hidden";
    opener.current?.setAttribute("aria-expanded", "true");
  }
  useEffect(() => {
    const menu = dialog.current;
    if (!menu) return;
    const restore = () => { document.body.style.overflow = previousOverflow.current; opener.current?.focus(); opener.current?.setAttribute("aria-expanded", "false"); };
    menu.addEventListener("close", restore);
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (media.matches && menu.open) menu.close(); };
    media.addEventListener("change", resize);
    return () => { if (menu.open) document.body.style.overflow = previousOverflow.current; menu.removeEventListener("close", restore); media.removeEventListener("change", resize); };
  }, []);
  return <header className={`${s.navShell} ${marketingFont.className}`}>
    <div className={`${s.container} ${s.navInner}`}>
      <Link prefetch={false} href="/" className={s.brandLink} aria-label="ReveNew — pagina principală"><MarketingBrand /></Link>
      <nav aria-label="Navigare principală" className={s.desktopNav}>{marketingSections.map(item => <Link prefetch={false} key={item.id} href={`/${item.href}`}>{item.label}</Link>)}</nav>
      <div className={s.navActions}><Link prefetch={false} href={authPath("/login", "login")} className={s.login}>Autentificare</Link><DemoRequestLink material="nav" /></div>
      <button ref={opener} className={`${s.liquid} ${s.menuButton}`} type="button" aria-label="Deschide meniul" aria-haspopup="dialog" aria-controls="marketing-mobile-menu" aria-expanded="false" onClick={openMenu}><Bars3Icon aria-hidden="true" /></button>
    </div>
    <dialog ref={dialog} id="marketing-mobile-menu" className={s.mobileMenu} aria-label="Navigare ReveNew" onClick={event => { if (event.target === event.currentTarget) closeMenu(); }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')).filter(item => item.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={s.mobileMenuInner}>
        <div className={s.menuHeading}><MarketingBrand /><button autoFocus type="button" className={s.liquid} aria-label="Închide meniul" onClick={closeMenu}><XMarkIcon aria-hidden="true" /></button></div>
        <nav aria-label="Navigare mobilă">{marketingSections.map(item => <Link prefetch={false} key={item.id} href={`/${item.href}`} onClick={closeMenu}>{item.label}<span aria-hidden="true">↗</span></Link>)}</nav>
        <DemoRequestLink material="nav" onClick={closeMenu} /><Link prefetch={false} href={authPath("/login", "login")} className={s.login}>Autentificare</Link>
      </div>
    </dialog>
    <noscript><nav className={s.noScriptNav} aria-label="Navigare fără JavaScript">{marketingSections.map(item => <Link prefetch={false} key={item.id} href={`/${item.href}`}>{item.label}</Link>)}<Link prefetch={false} href={authPath("/login", "login")}>Autentificare</Link></nav></noscript>
  </header>;
}
