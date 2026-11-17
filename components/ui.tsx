import Icon from "./Icon";
import type { Dict } from "@/lib/i18n";
import type { Status } from "@/lib/progress";

export function StatusChip({ status, t }: { status: Status; t: Dict }) {
  if (status === "done")
    return (
      <span className="chip done">
        <Icon name="check" />
        {t.done}
      </span>
    );
  if (status === "started")
    return (
      <span className="chip prog">
        <Icon name="clock" />
        {t.inProgress}
      </span>
    );
  return (
    <span className="chip new">
      <Icon name="circle" />
      {t.notStarted}
    </span>
  );
}

export function Ring({ pct, done }: { pct: number; done?: boolean }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg className={`ring${done ? " is-done" : ""}`} viewBox="0 0 58 58" role="img" aria-label={`${pct}%`}>
      <circle className="bgc" cx="29" cy="29" r={r} />
      <circle className="fgc" cx="29" cy="29" r={r} strokeDasharray={c.toFixed(1)} strokeDashoffset={(c * (1 - pct / 100)).toFixed(1)} />
      <text x="29" y="34" textAnchor="middle">
        {pct}%
      </text>
    </svg>
  );
}

export function PageHead({ title, sub, crumbs }: { title: string; sub?: string; crumbs?: React.ReactNode }) {
  return (
    <div className="topbar">
      <div>
        {crumbs && <nav className="crumbs" aria-label="Breadcrumb">{crumbs}</nav>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}
