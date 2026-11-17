import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { allConcepts, curriculums, tr } from "@/lib/content";
import { dict, getLang } from "@/lib/i18n";
import { curriculumStat, lastActivity, progressMap } from "@/lib/progress";
import { PageHead, Ring } from "@/components/ui";
import Icon from "@/components/Icon";

export default async function Home() {
  const user = await requireUser();
  const lang = await getLang();
  const t = dict(lang);
  const map = progressMap(user.id);
  const lastId = lastActivity(user.id);
  const all = allConcepts();
  const last = all.find((c) => c.id === lastId);
  // Next thing to learn: first not-done concept after the last one touched, in the same degree.
  let next = last;
  if (last && map.get(last.id) === "done") {
    const sameDeg = all.filter((c) => c.curriculum.slug === last.curriculum.slug && c.degree.slug === last.degree.slug);
    next = sameDeg.find((c) => map.get(c.id) !== "done") ?? last;
  }
  const first = all[0];
  const target = next ?? first;
  const href = target
    ? `/curriculums/${target.curriculum.slug}/${target.degree.slug}?topic=${target.topic.slug}&concept=${target.concept.slug}`
    : "/curriculums";

  return (
    <>
      <PageHead title={t.homeTitle.replace("{name}", user.username)} sub={t.homeSub} />
      <div className="grid">
        {target && (
          <Link href={href} className="card">
            <div className="card-top">
              <div className="card-icon">
                <Icon name="play" />
              </div>
              <span className="chip prog">{next ? t.continueLearning : t.startHere}</span>
            </div>
            <div>
              <h3>{target.concept.term}</h3>
              <p>
                {tr(target.degree.title, lang)} · {tr(target.topic.title, lang)}
              </p>
            </div>
            {!next && <p>{t.nothingStarted}</p>}
          </Link>
        )}
        {curriculums().map((c) => {
          const s = curriculumStat(map, c);
          return (
            <Link key={c.slug} href={`/curriculums/${c.slug}`} className="card">
              <div className="card-top">
                <div className="card-icon">
                  <Icon name={c.icon} />
                </div>
                <Ring pct={s.pct} done={s.status === "done"} />
              </div>
              <div>
                <h3>{tr(c.title, lang)}</h3>
                <p>{tr(c.description, lang)}</p>
              </div>
              <div className="card-foot">
                <span>
                  <b>
                    {s.done}/{s.total}
                  </b>{" "}
                  {t.conceptsDone}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
