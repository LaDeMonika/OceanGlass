import Link from "next/link";
import type { Concept } from "@/lib/content";
import type { Dict, Lang } from "@/lib/i18n";
import Icon from "./Icon";
import { StatusChip } from "./ui";
import PanelBehaviour from "./PanelBehaviour";
import VideoPlayer from "./VideoPlayer";
import DoneButton from "./DoneButton";
import LangToggle from "./LangToggle";

export default function ConceptPanel({
  id,
  concept,
  lang,
  t,
  status,
  index,
  total,
  topicTitle,
  closeHref,
  prevHref,
  nextHref,
  videoId,
  readOnly = false,
  isAdmin = false,
}: {
  id: string;
  concept: Concept;
  lang: Lang;
  t: Dict;
  status: "new" | "started" | "done";
  index: number;
  total: number;
  topicTitle: string;
  closeHref: string;
  prevHref?: string;
  nextHref?: string;
  videoId?: string;
  readOnly?: boolean;
  isAdmin?: boolean;
}) {
  const L = concept[lang] ?? concept.en;
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(concept.youtubeQuery)}`;
  const block = (title: string, text: string | undefined, warn = false) =>
    text ? (
      <div className={`blk${warn ? " warn" : ""}`}>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    ) : null;

  return (
    <div className="overlay">
      <Link href={closeHref} scroll={false} className="overlay-close" aria-label={t.close} tabIndex={-1} />
      <article className="lesson" role="dialog" aria-modal="true" aria-labelledby="lessonTitle">
        <PanelBehaviour id={id} closeHref={closeHref} markStarted={!readOnly && status === "new"} />
        <div className="lesson-head">
          <div>
            <div className="crumbs" style={{ marginBottom: 8 }}>
              <span>{topicTitle}</span>
              <span aria-hidden="true">·</span>
              <span>
                {index + 1} {t.of} {total}
              </span>
              {!readOnly && (
                <>
                  <span aria-hidden="true">·</span>
                  <StatusChip status={status === "new" ? "started" : status} t={t} />
                </>
              )}
            </div>
            <h2 id="lessonTitle">{concept.term}</h2>
            <div className="term-local">
              {lang === "bs" ? concept.local : `BS/HR: ${concept.local}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <LangToggle lang={lang} />
            <Link href={closeHref} scroll={false} className="icon-btn" aria-label={t.close}>
              <Icon name="x" />
            </Link>
          </div>
        </div>

        <div className="lesson-body">
          {videoId ? (
            <VideoPlayer videoId={videoId} title={concept.term} playLabel={t.playVideo} minutes={concept.minutes} minLabel={t.minVideo} />
          ) : (
            <div className="video">
              <div className="video-empty">
                {isAdmin ? (
                  <>
                    <a className="btn btn-primary" href={searchUrl} target="_blank" rel="noopener noreferrer">
                      <Icon name="external" />
                      {t.findVideo}
                    </a>
                    <p>{t.noVideoYet}</p>
                  </>
                ) : (
                  <>
                    <span className="play" aria-hidden="true">
                      <Icon name="play" />
                    </span>
                    <p>{t.videoSoon}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <p className="oneliner">{L.one}</p>
          {concept.formula && <div className="formula">{concept.formula[lang] ?? concept.formula.en}</div>}
          <div className="blocks">
            {block(t.inSimpleWords, L.explain)}
            {block(t.example, L.example)}
            {block(t.why, L.why)}
            {block(t.mixup, L.mixup, true)}
          </div>
          {concept.related.length > 0 && (
            <div>
              <h3 className="related-h">{t.related}</h3>
              <div className="related">
                {concept.related.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lesson-foot">
          <div className="right">
            <Link href={closeHref} scroll={false} className="btn btn-ghost">
              {t.close}
            </Link>
            {prevHref && (
              <Link href={prevHref} scroll={false} className="btn btn-ghost">
                <Icon name="left" />
                {t.prevConcept}
              </Link>
            )}
          </div>
          <div className="right">
            {!readOnly && (
              <DoneButton id={id} done={status === "done"} labels={{ mark: t.markDone, done: t.markedDone, undo: t.undo }} />
            )}
            {nextHref && (
              <Link href={nextHref} scroll={false} className="btn btn-primary">
                {t.nextConcept}
                <Icon name="right" />
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
