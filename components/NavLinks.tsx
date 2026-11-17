"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export default function NavLinks({ items }: { items: { href: string; icon: string; label: string }[] }) {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className="nav-item" aria-current={active ? "page" : undefined}>
            <Icon name={it.icon} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </>
  );
}
