// Leitner scheduling for flashcards, and attempt records for practice.

/** Days until a card in each box comes back. */
export const BOX_INTERVALS = [0, 1, 3, 7, 21] as const;
export const MAX_BOX = BOX_INTERVALS.length - 1;

export type CardState = {
  front: string;
  box: number;
  /** ISO date. */
  due: string;
};

const DAY = 86_400_000;

export function startOfDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate());
}

function addDays(from: Date, days: number): string {
  return new Date(startOfDay(from).getTime() + days * DAY).toISOString();
}

export function newCard(front: string, now = new Date()): CardState {
  return { front, box: 0, due: addDays(now, 0) };
}

/** A correct recall promotes one box; a miss resets to the start. */
export function grade(card: CardState, recalled: boolean, now = new Date()): CardState {
  const box = recalled ? Math.min(card.box + 1, MAX_BOX) : 0;
  return { ...card, box, due: addDays(now, BOX_INTERVALS[box]) };
}

export function isDue(card: CardState, now = new Date()): boolean {
  return new Date(card.due).getTime() <= startOfDay(now).getTime();
}

export function dueCards(cards: CardState[], now = new Date()): CardState[] {
  return cards.filter((c) => isDue(c, now));
}

// --- Practice attempts -----------------------------------------------------

export type ItemAttempt = {
  questionId: string;
  correct: boolean;
  /** Which option was chosen. The most informative field - keep it. */
  chosen: string;
  seconds: number;
  subtopic?: string;
};

export type SubtopicStat = {
  subtopic: string;
  answered: number;
  correct: number;
  accuracy: number;
  medianSeconds: number;
  /** The wrong option picked most often, when one repeats. */
  commonMiss?: string;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function summarize(attempts: ItemAttempt[]): SubtopicStat[] {
  const groups = new Map<string, ItemAttempt[]>();
  for (const a of attempts) {
    const key = a.subtopic ?? "untagged";
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }

  return [...groups.entries()]
    .map(([subtopic, items]) => {
      const correct = items.filter((i) => i.correct).length;

      const misses = new Map<string, number>();
      for (const i of items) {
        if (i.correct || !i.chosen) continue;
        misses.set(i.chosen, (misses.get(i.chosen) ?? 0) + 1);
      }
      const top = [...misses.entries()].sort((a, b) => b[1] - a[1])[0];

      return {
        subtopic,
        answered: items.length,
        correct,
        accuracy: items.length ? correct / items.length : 0,
        medianSeconds: median(items.map((i) => i.seconds)),
        commonMiss: top && top[1] > 1 ? top[0] : undefined,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
}

export type Readiness = {
  ready: boolean;
  /** Subtopics holding readiness back, weakest first. */
  blocking: string[];
  reason: string;
};

/**
 * A final simulation is only worth sitting once every tracked subtopic has
 * real evidence behind it. A high overall average usually means the strong
 * topics are carrying the weak ones.
 */
export function assessReadiness(
  stats: SubtopicStat[],
  { minAnswered = 3, minAccuracy = 0.85 } = {}
): Readiness {
  if (stats.length === 0) {
    return { ready: false, blocking: [], reason: "No attempts recorded yet." };
  }

  const thin = stats.filter((s) => s.answered < minAnswered);
  const weak = stats.filter((s) => s.answered >= minAnswered && s.accuracy < minAccuracy);
  const blocking = [...weak, ...thin].map((s) => s.subtopic);

  if (blocking.length === 0) {
    return { ready: true, blocking: [], reason: "Every subtopic has enough evidence and is above threshold." };
  }

  const parts: string[] = [];
  if (weak.length) parts.push(`${weak.length} subtopic(s) below ${Math.round(minAccuracy * 100)}%`);
  if (thin.length) parts.push(`${thin.length} with fewer than ${minAnswered} answered items`);

  return { ready: false, blocking, reason: parts.join(", ") + "." };
}

/** What to do next, based on accuracy and speed rather than a feeling. */
export function recommendNext(stats: SubtopicStat[]): string {
  if (stats.length === 0) return "Sit a broad baseline test first - there is nothing to target yet.";

  const weakest = stats[0];
  const fast = weakest.medianSeconds < 30;

  if (weakest.accuracy < 0.5) {
    return fast
      ? `Re-teach ${weakest.subtopic} before drilling - answers are wrong and quick, which is a knowledge gap, not carelessness.`
      : `Drill worked examples on ${weakest.subtopic} - the method is half-known.`;
  }
  if (weakest.accuracy < 0.85) {
    return weakest.commonMiss
      ? `Build a contrast pair for ${weakest.subtopic} - "${weakest.commonMiss}" is being picked repeatedly, so this is one specific confusion.`
      : `Targeted drill on ${weakest.subtopic}.`;
  }
  if (weakest.medianSeconds > 90) {
    return `Accuracy is fine but slow. Drill ${weakest.subtopic} for speed before the real timing bites.`;
  }
  return "Every subtopic is above threshold - sit a full timed simulation.";
}
