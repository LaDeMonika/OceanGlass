"use client";

import Link from "next/link";
import { useState } from "react";

type Item = { term: string; local: string; one: string; href: string };

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");

export default function GlossaryList({ items, searchLabel, empty }: { items: Item[]; searchLabel: string; empty: string }) {
  const [q, setQ] = useState("");
  const f = fold(q.trim());
  const shown = f ? items.filter((i) => fold(`${i.term} ${i.local} ${i.one}`).includes(f)) : items;
  return (
    <>
      <label className="sr-only" htmlFor="gsearch">
        {searchLabel}
      </label>
      <input id="gsearch" className="search" type="search" placeholder={searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
      {shown.length === 0 && <p className="muted">{empty}</p>}
      <div className="gloss">
        {shown.map((i) => (
          <Link key={i.term} href={i.href} className="gloss-item">
            <b>{i.term}</b>
            <span className="loc">{i.local}</span>
            <p>{i.one}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
