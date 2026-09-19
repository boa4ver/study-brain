"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/lib/parse";
import { summarize, recommendNext, type ItemAttempt } from "@/lib/progress";

function mmss(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PracticeRunner({
  questions,
  durationMinutes,
}: {
  questions: Question[];
  durationMinutes?: number;
}) {
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<ItemAttempt[]>([]);
  const [askedAt, setAskedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const question = questions[index];
  const limit = durationMinutes ? durationMinutes * 60 : null;
  // The clock never locks the test. Running over and finishing is more useful
  // than a truncated attempt, as long as the overtime is visible.
  const overtime = limit !== null && elapsed > limit;

  const stats = useMemo(() => summarize(attempts), [attempts]);

  function choose(text: string) {
    if (chosen) return;
    const choice = question.choices.find((c) => c.text === text)!;
    setChosen(text);
    setAttempts((prev) => [
      ...prev,
      {
        questionId: question.id,
        correct: choice.correct,
        chosen: text,
        seconds: Math.round((Date.now() - askedAt) / 1000),
        subtopic: question.subtopic,
      },
    ]);
  }

  function next() {
    setChosen(null);
    setAskedAt(Date.now());
    if (index + 1 >= questions.length) setDone(true);
    else setIndex(index + 1);
  }

  if (done) {
    const correct = attempts.filter((a) => a.correct).length;
    return (
      <>
        <h2>
          {correct} / {attempts.length}
        </h2>
        <p className="muted">Total time {mmss(elapsed)}.</p>

        <h2>What to do next</h2>
        <p>{recommendNext(stats)}</p>

        {stats.length > 0 && (
          <ul className="list">
            {stats.map((s) => (
              <li key={s.subtopic} className="row">
                <span>
                  {s.subtopic}
                  {s.commonMiss && (
                    <span className="badge">keeps picking {s.commonMiss}</span>
                  )}
                </span>
                <span className="muted">
                  {s.correct}/{s.answered} · {mmss(s.medianSeconds)} median
                </span>
              </li>
            ))}
          </ul>
        )}

        <h2>Every item</h2>
        {questions.map((q, i) => {
          const a = attempts[i];
          return (
            <div key={q.id} className="explain">
              <p>
                <strong>{q.id}</strong>{" "}
                <span className={a?.correct ? "r" : "w"}>
                  {a?.correct ? "correct" : `you chose ${a?.chosen ?? "nothing"}`}
                </span>
              </p>
              {q.rationale && <p>{q.rationale}</p>}
              {q.choices
                .filter((c) => !c.correct && c.explanation)
                .map((c) => (
                  <p key={c.text} className="muted">
                    <strong>{c.text}</strong> - {c.explanation}
                  </p>
                ))}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <>
      <p className="muted">
        Question {index + 1} of {questions.length} · {mmss(elapsed)}
        {limit !== null && ` of ${mmss(limit)}`}
        {overtime && " · overtime"}
      </p>

      <p>{question.prompt}</p>

      {question.choices.map((c) => {
        const reveal = chosen !== null;
        const cls = reveal && c.correct ? "choice correct"
          : reveal && c.text === chosen ? "choice chosen-wrong"
          : "choice";
        return (
          <button key={c.text} className={cls} onClick={() => choose(c.text)} disabled={reveal}>
            {c.text}
          </button>
        );
      })}

      {chosen !== null && (
        <>
          <div className="explain">
            {question.rationale && <p className="r">{question.rationale}</p>}
            {question.choices
              .filter((c) => !c.correct && c.explanation)
              .map((c) => (
                <p key={c.text} className="muted">
                  <strong>{c.text}</strong> - {c.explanation}
                </p>
              ))}
          </div>
          <button onClick={next}>
            {index + 1 >= questions.length ? "See results" : "Next"}
          </button>
        </>
      )}
    </>
  );
}
