import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findCurriculum, tr } from "@/lib/content";
import { dict, getLang } from "@/lib/i18n";
import { degreeStat, progressMap } from "@/lib/progress";
import { PageHead, Ring, StatusChip } from "@/components/ui";
import Icon from "@/components/Icon";

export default async function CurriculumPage({ params }: { params: Promise<{ cur: string }> }) {
  const { cur } = await params;
  const user = await requireUser();
  const c = findCurriculum(cur);
  if (!c) notFound();
  const lang = await getLang();
  const t = dict(lang);
  const map = progressMap(user.id);

  return (
    <>
      <PageHead
        title={tr(c.title, lang)}
        sub={t.degreesSub}
        crumbs={
          <>
            <Link href="/curriculums">{t.curriculumsTitle}</Link>
            <span aria-hidden="true">/</span>
            <span>{tr(c.title, lang)}</span>
          </>
        }
      />
      <div className="grid">
        {c.degrees.map((d) => {
          const s = degreeStat(map, c.slug, d);
          const available = d.topics.length > 0;
          const inner = (
            <>
              <div className="card-top">
                <div className="card-icon">
                  <Icon name={d.icon} />
                </div>
                {available ? <Ring pct={s.pct} done={s.status === "done"} /> : <span className="chip new">{t.comingSoon}</span>}
              </div>
              <div>
                <h3>{tr(d.title, lang)}</h3>
                <p>{tr(d.description, lang)}</p>
              </div>
              {available && (
                <div className="card-foot">
                  <span>
                    <b>
                      {s.topicsDone}/{d.topics.length}
                    </b>{" "}
                    {t.topics}
                  </span>
                  <StatusChip status={s.status} t={t} />
                </div>
              )}
            </>
          );
          return available ? (
            <Link key={d.slug} href={`/curriculums/${c.slug}/${d.slug}`} className="card">
              {inner}
            </Link>
          ) : (
            <div key={d.slug} className="card disabled">
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
