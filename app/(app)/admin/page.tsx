import { requireAdmin } from "@/lib/auth";
import { allConcepts, tr } from "@/lib/content";
import { db } from "@/lib/db";
import { dict, getLang } from "@/lib/i18n";
import { PageHead } from "@/components/ui";
import VideoForm from "@/components/VideoForm";

export default async function AdminPage() {
  await requireAdmin();
  const lang = await getLang();
  const t = dict(lang);
  const rows = db().prepare("SELECT concept_id, youtube_id FROM videos").all() as { concept_id: string; youtube_id: string }[];
  const videos = new Map(rows.map((r) => [r.concept_id, r.youtube_id]));
  const items = allConcepts();
  let lastTopic = "";
  return (
    <>
      <PageHead title={t.adminTitle} sub={t.adminSub} />
      <div style={{ maxWidth: 1000 }}>
        {items.map((c) => {
          const topicKey = `${c.degree.slug}/${c.topic.slug}`;
          const header =
            topicKey !== lastTopic ? (
              <h2 style={{ fontSize: 18, marginTop: 28 }}>
                {tr(c.degree.title, lang)} · {tr(c.topic.title, lang)}
              </h2>
            ) : null;
          lastTopic = topicKey;
          const current = videos.get(c.id) || c.concept.youtube || "";
          return (
            <div key={c.id}>
              {header}
              <div className="admin-row">
                <div>
                  <b>{c.concept.term}</b>
                  <div className="small">
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(c.concept.youtubeQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      YouTube: “{c.concept.youtubeQuery}”
                    </a>
                  </div>
                </div>
                <VideoForm conceptId={c.id} current={current} saveLabel={t.save} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
