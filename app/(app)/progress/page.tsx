import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { curriculums, tr } from "@/lib/content";
import { dict, getLang } from "@/lib/i18n";
import { degreeStat, progressMap } from "@/lib/progress";
import { PageHead, Ring, StatusChip } from "@/components/ui";

export default async function ProgressPage() {
  const user = await requireMember();
  const lang = await getLang();
  const t = dict(lang);
  const map = progressMap(user.id);
  return (
    <>
      <PageHead title={t.progressTitle} sub={t.progressSub} />
      {curriculums().map((c) => (
        <section key={c.slug} style={{ marginBottom: 28, maxWidth: 860 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{tr(c.title, lang)}</h2>
          {c.degrees
            .filter((d) => d.topics.length > 0)
            .map((d) => {
              const s = degreeStat(map, c.slug, d);
              return (
                <Link key={d.slug} href={`/curriculums/${c.slug}/${d.slug}`} className="prog-row">
                  <Ring pct={s.pct} done={s.status === "done"} />
                  <div className="grow">
                    <b>{tr(d.title, lang)}</b>
                    <div className="muted" style={{ fontSize: 14 }}>
                      {s.done}/{s.total} {t.conceptsDone} · {s.topicsDone}/{d.topics.length} {t.topics}
                    </div>
                    <div className="bar">
                      <i style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                  <StatusChip status={s.status} t={t} />
                </Link>
              );
            })}
        </section>
      ))}
    </>
  );
}
