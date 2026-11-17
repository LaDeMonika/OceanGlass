"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitQuiz, type QuizResult } from "@/app/actions";
import Icon from "./Icon";
import PanelBehaviour from "./PanelBehaviour";

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

type Labels = {
  quiz: string;
  question: string;
  of: string;
  correct: string;
  wrong: string;
  nextQuestion: string;
  seeResult: string;
  youGot: string;
  quizPerfect: string;
  quizGood: string;
  quizLow: string;
  tryAgain: string;
  backToTopic: string;
  close: string;
  bestScore: string;
  notSavedGuest: string;
};

export default function QuizPanel({
  topicId,
  topicTitle,
  items,
  closeHref,
  labels,
  langToggle,
}: {
  topicId: string;
  topicTitle: string;
  items: QuizItem[];
  closeHref: string;
  labels: Labels;
  langToggle: React.ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();

  const item = items[idx];
  const picked = answers[idx];
  const answered = picked !== undefined;
  const isLast = idx === items.length - 1;
  const finished = result !== null;

  const choose = (i: number) => {
    if (answered) return;
    const next = [...answers];
    next[idx] = i;
    setAnswers(next);
  };

  const advance = () => {
    if (!isLast) {
      setIdx(idx + 1);
      document.querySelector(".lesson")?.scrollTo({ top: 0 });
      return;
    }
    start(async () => {
      const r = await submitQuiz(topicId, answers);
      // Fall back to a local count if the server could not score it.
      setResult(r ?? { score: answers.filter((a, i) => a === items[i].answer).length, total: items.length, saved: false });
    });
  };

  const restart = () => {
    setIdx(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <div className="overlay">
      <Link href={closeHref} scroll={false} className="overlay-close" aria-label={labels.close} tabIndex={-1} />
      <article className="lesson" role="dialog" aria-modal="true" aria-labelledby="quizTitle">
        <PanelBehaviour id="" closeHref={closeHref} markStarted={false} />
        <div className="lesson-head">
          <div>
            <div className="crumbs" style={{ marginBottom: 8 }}>
              <span>{topicTitle}</span>
              {!finished && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {labels.question} {idx + 1} {labels.of} {items.length}
                  </span>
                </>
              )}
            </div>
            <h2 id="quizTitle">{labels.quiz}</h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {langToggle}
            <Link href={closeHref} scroll={false} className="icon-btn" aria-label={labels.close}>
              <Icon name="x" />
            </Link>
          </div>
        </div>

        {!finished && (
          <div className="quiz-bar" aria-hidden="true">
            {items.map((q, i) => (
              <i
                key={i}
                className={
                  answers[i] === undefined ? (i === idx ? "now" : "") : answers[i] === q.answer ? "right" : "miss"
                }
              />
            ))}
          </div>
        )}

        <div className="lesson-body">
          {!finished ? (
            <>
              <p className="oneliner">{item.q}</p>
              <div className="quiz-options" role="group" aria-label={item.q}>
                {item.options.map((opt, i) => {
                  let cls = "quiz-opt";
                  if (answered) {
                    if (i === item.answer) cls += " right";
                    else if (i === picked) cls += " miss";
                    else cls += " dim";
                  }
                  return (
                    <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={answered} aria-pressed={picked === i}>
                      <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
                      <span className="quiz-text">{opt}</span>
                      {answered && i === item.answer && <Icon name="check" />}
                      {answered && i === picked && i !== item.answer && <Icon name="x" />}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div className={`blk ${picked === item.answer ? "" : "warn"}`} role="status">
                  <h3>{picked === item.answer ? labels.correct : labels.wrong}</h3>
                  <p>{item.explain}</p>
                </div>
              )}
            </>
          ) : (
            <div className="quiz-result">
              <div className="quiz-score">
                {result.score}
                <small>/{result.total}</small>
              </div>
              <p className="oneliner">
                {labels.youGot.replace("{score}", String(result.score)).replace("{total}", String(result.total))}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {result.score === result.total ? labels.quizPerfect : result.score / result.total >= 0.6 ? labels.quizGood : labels.quizLow}
              </p>
              {result.saved && result.best !== undefined && (
                <span className="chip done">
                  <Icon name="check" />
                  {labels.bestScore}: {result.best}/{result.total}
                </span>
              )}
              {!result.saved && <span className="chip new">{labels.notSavedGuest}</span>}
            </div>
          )}
        </div>

        <div className="lesson-foot">
          <div className="right">
            <Link href={closeHref} scroll={false} className="btn btn-ghost">
              {finished ? labels.backToTopic : labels.close}
            </Link>
          </div>
          <div className="right">
            {finished ? (
              <button type="button" className="btn btn-primary" onClick={restart}>
                {labels.tryAgain}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={advance} disabled={!answered || pending}>
                {isLast ? labels.seeResult : labels.nextQuestion}
                <Icon name="right" />
              </button>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
