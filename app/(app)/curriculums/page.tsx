import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { curriculums, tr } from "@/lib/content";
import { dict, getLang } from "@/lib/i18n";
import { curriculumStat, progressMap } from "@/lib/progress";
import { PageHead, Ring, StatusChip } from "@/components/ui";
import Icon from "@/components/Icon";

export default async function CurriculumsPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = dict(lang);
  const map = progressMap(user.id);
  return (
    <>
      <PageHead title={t.curriculumsTitle} sub={t.curriculumsSub} />
      <div className="grid">
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
                  <b>{c.degrees.length}</b> {t.programs}
                </span>
                <StatusChip status={s.status} t={t} />
              </div>
            </Link>
          );
        })}
        <div className="card placeholder">
          <div className="card-icon">
            <Icon name="plus" />
          </div>
          <h3 style={{ color: "var(--text)" }}>{t.moreLater}</h3>
          <p>{t.moreLaterText}</p>
        </div>
      </div>
    </>
  );
}
