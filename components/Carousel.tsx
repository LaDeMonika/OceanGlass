"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";

export default function Carousel({
  title,
  prevLabel,
  nextLabel,
  activeIndex,
  children,
}: {
  title: string;
  prevLabel: string;
  nextLabel: string;
  activeIndex: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Bring the active topic into view on first load.
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    if (el && ref.current) {
      const left = el.offsetLeft - ref.current.offsetLeft - 8;
      if (left > ref.current.clientWidth - el.clientWidth || ref.current.scrollLeft > left) ref.current.scrollLeft = left;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  return (
    <>
      <div className="section-head">
        <h2>{title}</h2>
        <div className="car-nav">
          <button type="button" className="icon-btn" onClick={() => scroll(-1)} aria-label={prevLabel}>
            <Icon name="left" />
          </button>
          <button type="button" className="icon-btn" onClick={() => scroll(1)} aria-label={nextLabel}>
            <Icon name="right" />
          </button>
        </div>
      </div>
      <div className="carousel" ref={ref}>
        {children}
      </div>
    </>
  );
}
