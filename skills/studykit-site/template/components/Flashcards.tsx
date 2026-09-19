"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/lib/parse";
import { newCard, grade, dueCards, type CardState } from "@/lib/progress";

/** Per-viewer convenience only - the notes stay canonical. */
function load(deckId: string, cards: Card[]): CardState[] {
  const fresh = cards.map((c) => newCard(c.front));
  try {
    const raw = localStorage.getItem(`studykit:${deckId}`);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as CardState[];
    const byFront = new Map(saved.map((s) => [s.front, s]));
    return fresh.map((f) => byFront.get(f.front) ?? f);
  } catch {
    return fresh;
  }
}

function save(deckId: string, states: CardState[]) {
  try {
    localStorage.setItem(`studykit:${deckId}`, JSON.stringify(states));
  } catch {
    // Private windows and blocked storage are fine - progress just resets.
  }
}

export default function Flashcards({ deckId, cards }: { deckId: string; cards: Card[] }) {
  const [states, setStates] = useState<CardState[] | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => setStates(load(deckId, cards)), [deckId, cards]);

  if (!states) return <p className="muted">Loading…</p>;

  const queue = dueCards(states);
  const backs = new Map(cards.map((c) => [c.front, c.back]));

  if (queue.length === 0) {
    return (
      <>
        <p className="empty">Nothing due. Come back when the next card is scheduled.</p>
        <button
          onClick={() => {
            const reset = cards.map((c) => newCard(c.front));
            setStates(reset);
            save(deckId, reset);
          }}
        >
          Reset this deck
        </button>
      </>
    );
  }

  const current = queue[0];

  function mark(recalled: boolean) {
    const updated = states!.map((s) => (s.front === current.front ? grade(s, recalled) : s));
    setStates(updated);
    save(deckId, updated);
    setRevealed(false);
  }

  return (
    <>
      <p className="muted">{queue.length} due</p>
      <p><strong>{current.front}</strong></p>

      {revealed ? (
        <>
          <p>{backs.get(current.front)}</p>
          <button onClick={() => mark(true)}>Got it</button>{" "}
          <button onClick={() => mark(false)}>Missed it</button>
        </>
      ) : (
        <button onClick={() => setRevealed(true)}>Show answer</button>
      )}
    </>
  );
}
