// Parse practice questions and flashcard decks out of note markdown.
// The format is specified in site/references/content-schema.md.

export type Choice = {
  text: string;
  correct: boolean;
  /** Why this wrong option is tempting. Empty for the correct choice. */
  explanation: string;
};

export type Question = {
  id: string;
  prompt: string;
  choices: Choice[];
  /** Why the right answer is right. */
  rationale: string;
  subtopic?: string;
};

export type Card = { front: string; back: string };

const CHOICE = /^[-*]\s+\[( |x|X)\]\s+(.+)$/;
const HEADING = /^#{1,6}\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;

/**
 * Explanation blockquotes look like:
 *   > **Right:** why the answer is right
 *   > **520,000** - what error this option represents
 * Returns the rationale plus a lookup from choice text to its explanation.
 */
function parseExplanations(lines: string[]) {
  let rationale = "";
  const byChoice = new Map<string, string>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const labelled = line.match(/^\*\*(.+?):?\*\*\s*[-–—:]?\s*(.*)$/);
    if (!labelled) {
      // Continuation of whatever came before.
      if (byChoice.size === 0) rationale = rationale ? `${rationale} ${line}` : line;
      continue;
    }

    const [, label, body] = labelled;
    if (/^right$|^correct$|^answer$/i.test(label.trim())) {
      rationale = body;
    } else {
      byChoice.set(label.trim(), body);
    }
  }

  return { rationale, byChoice };
}

export function parseQuestions(markdown: string): Question[] {
  const lines = markdown.split("\n");
  const questions: Question[] = [];

  let id = "";
  let prompt: string[] = [];
  let choices: Choice[] = [];
  let quote: string[] = [];
  let inQuote = false;

  const flush = () => {
    if (!id || choices.length === 0) {
      id = "";
      prompt = [];
      choices = [];
      quote = [];
      return;
    }

    const { rationale, byChoice } = parseExplanations(quote);
    for (const choice of choices) {
      if (choice.correct) continue;
      // Match on the choice text, or on a distinctive leading token of it,
      // so "**520,000** - ..." lines up with the choice "520,000".
      choice.explanation =
        byChoice.get(choice.text) ??
        [...byChoice.entries()].find(([k]) => choice.text.startsWith(k))?.[1] ??
        "";
    }

    questions.push({
      id,
      prompt: prompt.join("\n").trim(),
      choices,
      rationale,
    });

    id = "";
    prompt = [];
    choices = [];
    quote = [];
  };

  for (const line of lines) {
    const heading = line.match(HEADING);
    if (heading) {
      flush();
      id = heading[1].trim();
      inQuote = false;
      continue;
    }
    if (!id) continue;

    const choice = line.match(CHOICE);
    if (choice) {
      choices.push({
        text: choice[2].trim(),
        correct: choice[1].toLowerCase() === "x",
        explanation: "",
      });
      inQuote = false;
      continue;
    }

    const quoted = line.match(QUOTE);
    if (quoted) {
      inQuote = true;
      quote.push(quoted[1]);
      continue;
    }

    if (inQuote && line.trim() === "") {
      inQuote = false;
      continue;
    }
    if (choices.length === 0) prompt.push(line);
  }

  flush();
  return questions;
}

/**
 * Flashcards come from markdown tables. Column one is the front and its header
 * is discarded, so a front that only parses under its header is a broken card.
 */
export function parseCards(markdown: string): Card[] {
  const cards: Card[] = [];
  const rows = markdown.split("\n").filter((l) => l.trim().startsWith("|"));

  let headerSeen = false;
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) {
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue;

    const [front, ...rest] = cells;
    const back = rest.filter(Boolean).join(" - ");
    if (!front || !back) continue;
    if (/\(fill in\)/i.test(back)) continue;
    cards.push({ front, back });
  }

  return cards;
}

/** Items whose answer key does not explain every wrong option. */
export function findUnexplainedDistractors(questions: Question[]): string[] {
  return questions
    .filter((q) => q.choices.some((c) => !c.correct && !c.explanation.trim()))
    .map((q) => q.id);
}
