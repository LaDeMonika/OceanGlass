import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { cardLang, conceptId, findDegree, topicId, tr } from "@/lib/content";
import { db } from "@/lib/db";
import { dict, getLang } from "@/lib/i18n";
import { progressMap, quizScores, topicStat } from "@/lib/progress";
import { PageHead, Ring, StatusChip } from "@/components/ui";
import Icon from "@/components/Icon";
import Carousel from "@/components/Carousel";
import ConceptPanel from "@/components/ConceptPanel";
import QuizPanel from "@/components/QuizPanel";
import LangToggle from "@/components/LangToggle";

export default async function DegreePage({
  params,
  searchParams,
}: {
  params: Promise<{ cur: string; deg: string }>;
  searchParams: Promise<{ topic?: string; concept?: string; quiz?: string }>;
}) {
  const { cur, deg } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const found = findDegree(cur, deg);
  if (!found || found.degree.topics.length === 0) notFound();
  const { curriculum, degree } = found;
  const lang = await getLang();
  const t = dict(lang);
  // Language programs explain their cards and quizzes in one fixed language.
  const cLang = cardLang(degree, lang);
  const ct = dict(cLang);
  const fixedLang = !!degree.explainIn;
  const map = progressMap(user.id);
  const scores = quizScores(user.id);

  const stats = degree.topics.map((tp) => topicStat(map, cur, deg, tp));
  // Default topic: the first one that is not finished yet.
  const defaultIdx = Math.max(0, stats.findIndex((s) => s.status !== "done"));
  const topicIdx = Math.max(0, degree.topics.findIndex((tp) => tp.slug === sp.topic));
  const activeIdx = sp.topic && degree.topics[topicIdx]?.slug === sp.topic ? topicIdx : defaultIdx;
  const topic = degree.topics[activeIdx];
  const base = `/curriculums/${cur}/${deg}`;
  const topicHref = `${base}?topic=${topic.slug}`;

  const tId = topicId(cur, deg, topic.slug);
  const quiz = topic.quiz;
  const quizHref = quiz ? `${topicHref}&quiz=1` : undefined;
  const quizOpen = !!quiz && sp.quiz === "1" && !sp.concept;
  const myScore = scores.get(tId);

  const cIdx = sp.concept ? topic.concepts.findIndex((k) => k.slug === sp.concept) : -1;
  const open = cIdx >= 0 ? topic.concepts[cIdx] : null;
  let videoId: string | undefined;
  if (open) {
    const row = db().prepare("SELECT youtube_id FROM videos WHERE concept_id = ?").get(conceptId(cur, deg, topic.slug, open.slug)) as
      | { youtube_id: string }
      | undefined;
    videoId = row?.youtube_id || open.youtube || undefined;
  }

  return (
    <>
      <PageHead
        title={tr(degree.title, lang)}
        sub={tr(degree.description, lang)}
        crumbs={
          <>
            <Link href="/curriculums">{t.curriculumsTitle}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/curriculums/${cur}`}>{tr(curriculum.title, lang)}</Link>
            <span aria-hidden="true">/</span>
            <span>{tr(degree.title, lang)}</span>
          </>
        }
      />

      <Carousel title={t.topicsTitle} prevLabel={t.prevTopics} nextLabel={t.nextTopics} activeIndex={activeIdx}>
        {degree.topics.map((tp, i) => {
          const s = stats[i];
          return (
            <Link
              key={tp.slug}
              href={`${base}?topic=${tp.slug}`}
              scroll={false}
              className="card"
              aria-current={i === activeIdx ? "true" : undefined}
              data-idx={i}
            >
              <div className="card-top">
                <span className="topic-num">{String(i + 1).padStart(2, "0")}</span>
                <StatusChip status={s.status} t={t} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <h3>{tr(tp.title, lang)}</h3>
                <Ring pct={s.pct} done={s.status === "done"} />
              </div>
              <div className="card-foot">
                <span>
                  <b>
                    {s.done}/{s.total}
                  </b>{" "}
                  {t.concepts}
                </span>
                {tp.quiz && (
                  <span className="quiz-mini">
                    {t.quiz}{" "}
                    <b>
                      {scores.get(topicId(cur, deg, tp.slug))
                        ? `${scores.get(topicId(cur, deg, tp.slug))!.best}/${scores.get(topicId(cur, deg, tp.slug))!.total}`
                        : "–"}
                    </b>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </Carousel>

      <div className="section-head" style={{ marginTop: 26 }}>
        <h2>
          {t.conceptsIn} “{tr(topic.title, lang)}”
        </h2>
        <span className="muted">
          {topic.concepts.length} {t.concepts}
        </span>
      </div>
      <p className="muted" style={{ marginTop: -6, maxWidth: "70ch" }}>
        {tr(topic.summary, lang)}
      </p>
      <div className="concepts">
        {topic.concepts.map((k, i) => {
          const st = map.get(conceptId(cur, deg, topic.slug, k.slug)) ?? "new";
          return (
            <Link key={k.slug} href={`${topicHref}&concept=${k.slug}`} scroll={false} className={`concept ${st}`}>
              <span className="ck">{st === "done" ? <Icon name="check" /> : i + 1}</span>
              <span>
                <b>{k.term}</b>
                <span className="s">{st === "done" ? t.done : st === "started" ? t.inProgress : t.notStarted}</span>
              </span>
            </Link>
          );
        })}
        {quiz && quizHref && (
          <Link href={quizHref} scroll={false} className="concept quiz-entry">
            <span className="ck">
              <Icon name="check" />
            </span>
            <span>
              <b>{t.topicQuiz}</b>
              <span className="s">
                {quiz.length} {t.questions}
                {myScore ? ` · ${t.bestScore} ${myScore.best}/${myScore.total}` : ""}
              </span>
            </span>
          </Link>
        )}
      </div>

      {quizOpen && quiz && (
        <QuizPanel
          key={tId}
          topicId={tId}
          topicTitle={tr(topic.title, cLang)}
          closeHref={topicHref}
          items={quiz.map((q) => ({
            q: tr(q.q, cLang),
            options: q.options.map((o) => tr(o, cLang)),
            answer: q.answer,
            explain: q.explain ? tr(q.explain, cLang) : "",
          }))}
          labels={{
            quiz: ct.quiz,
            question: ct.question,
            of: ct.of,
            correct: ct.correct,
            wrong: ct.wrong,
            nextQuestion: ct.nextQuestion,
            seeResult: ct.seeResult,
            youGot: ct.youGot,
            quizPerfect: ct.quizPerfect,
            quizGood: ct.quizGood,
            quizLow: ct.quizLow,
            tryAgain: ct.tryAgain,
            backToTopic: ct.backToTopic,
            close: ct.close,
            bestScore: ct.bestScore,
            notSavedGuest: ct.notSavedGuest,
          }}
          langToggle={fixedLang ? null : <LangToggle lang={lang} />}
        />
      )}

      {open && (
        <ConceptPanel
          id={conceptId(cur, deg, topic.slug, open.slug)}
          concept={open}
          lang={cLang}
          t={ct}
          status={(map.get(conceptId(cur, deg, topic.slug, open.slug)) as "started" | "done" | undefined) ?? "new"}
          index={cIdx}
          total={topic.concepts.length}
          topicTitle={tr(topic.title, cLang)}
          closeHref={topicHref}
          prevHref={cIdx > 0 ? `${topicHref}&concept=${topic.concepts[cIdx - 1].slug}` : undefined}
          nextHref={cIdx < topic.concepts.length - 1 ? `${topicHref}&concept=${topic.concepts[cIdx + 1].slug}` : undefined}
          quizHref={quizHref}
          videoId={videoId}
          readOnly={user.role === "guest"}
          isAdmin={user.role === "admin"}
          fixedLang={fixedLang}
          localLang={degree.localLang ?? "bs"}
        />
      )}
    </>
  );
}
