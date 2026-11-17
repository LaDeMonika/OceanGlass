"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markConcept } from "@/app/actions";

/** Escape closes the panel, the page behind stops scrolling, and opening a concept marks it as started. */
export default function PanelBehaviour({ id, closeHref, markStarted }: { id: string; closeHref: string; markStarted: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [closeHref, router]);

  useEffect(() => {
    document.querySelector(".lesson")?.scrollTo({ top: 0 });
    if (markStarted) markConcept(id, "started");
  }, [id, markStarted]);

  return null;
}
