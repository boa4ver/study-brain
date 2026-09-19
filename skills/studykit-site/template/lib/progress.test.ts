import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newCard, grade, isDue, dueCards, BOX_INTERVALS,
  summarize, assessReadiness, recommendNext,
  type ItemAttempt,
} from "./progress.ts";

const AT = new Date("2026-03-01T10:00:00Z");
const daysLater = (n: number) => new Date(AT.getTime() + n * 86_400_000);

test("a new card is due immediately", () => {
  assert.ok(isDue(newCard("front", AT), AT));
});

test("a correct recall promotes one box and pushes the due date out", () => {
  const card = grade(newCard("front", AT), true, AT);
  assert.equal(card.box, 1);
  assert.ok(!isDue(card, AT));
  assert.ok(isDue(card, daysLater(BOX_INTERVALS[1])));
});

test("boxes promote through the full ladder and stop at the top", () => {
  let card = newCard("front", AT);
  for (let i = 0; i < 10; i += 1) card = grade(card, true, AT);
  assert.equal(card.box, BOX_INTERVALS.length - 1);
});

test("a miss resets to the start regardless of how high it was", () => {
  let card = newCard("front", AT);
  for (let i = 0; i < 4; i += 1) card = grade(card, true, AT);
  assert.ok(card.box > 0);
  assert.equal(grade(card, false, AT).box, 0);
  assert.ok(isDue(grade(card, false, AT), AT));
});

test("only due cards come back", () => {
  const cards = [grade(newCard("a", AT), true, AT), newCard("b", AT)];
  assert.deepEqual(dueCards(cards, AT).map((c) => c.front), ["b"]);
});

// --- analytics -------------------------------------------------------------

const attempt = (o: Partial<ItemAttempt>): ItemAttempt => ({
  questionId: "Q", correct: true, chosen: "", seconds: 20, ...o,
});

test("summarize groups by subtopic, weakest first", () => {
  const stats = summarize([
    attempt({ subtopic: "strong", correct: true }),
    attempt({ subtopic: "strong", correct: true }),
    attempt({ subtopic: "weak", correct: false, chosen: "X" }),
    attempt({ subtopic: "weak", correct: true }),
  ]);
  assert.equal(stats[0].subtopic, "weak");
  assert.equal(stats[0].accuracy, 0.5);
  assert.equal(stats[1].accuracy, 1);
});

test("a repeated wrong choice is surfaced; a one-off is not", () => {
  const repeated = summarize([
    attempt({ subtopic: "t", correct: false, chosen: "520,000" }),
    attempt({ subtopic: "t", correct: false, chosen: "520,000" }),
  ]);
  assert.equal(repeated[0].commonMiss, "520,000");

  const oneOff = summarize([
    attempt({ subtopic: "t", correct: false, chosen: "520,000" }),
    attempt({ subtopic: "t", correct: false, chosen: "525,000" }),
  ]);
  assert.equal(oneOff[0].commonMiss, undefined);
});

test("a thin subtopic blocks readiness even at 100% accuracy", () => {
  const stats = summarize([attempt({ subtopic: "thin", correct: true })]);
  const readiness = assessReadiness(stats);
  assert.equal(readiness.ready, false);
  assert.deepEqual(readiness.blocking, ["thin"]);
  assert.match(readiness.reason, /fewer than 3/);
});

test("a strong average does not hide a weak subtopic", () => {
  const stats = summarize([
    ...Array.from({ length: 9 }, () => attempt({ subtopic: "strong", correct: true })),
    ...Array.from({ length: 3 }, () => attempt({ subtopic: "weak", correct: false, chosen: "X" })),
  ]);
  const readiness = assessReadiness(stats);
  assert.equal(readiness.ready, false);
  assert.ok(readiness.blocking.includes("weak"));
});

test("readiness passes only when every subtopic has evidence", () => {
  const stats = summarize(
    Array.from({ length: 4 }, () => attempt({ subtopic: "solid", correct: true }))
  );
  assert.equal(assessReadiness(stats).ready, true);
});

test("wrong and fast reads as a knowledge gap, not carelessness", () => {
  const stats = summarize([
    attempt({ subtopic: "gap", correct: false, chosen: "X", seconds: 8 }),
    attempt({ subtopic: "gap", correct: false, chosen: "Y", seconds: 9 }),
  ]);
  assert.match(recommendNext(stats), /Re-teach/);
});

test("wrong and slow reads as a half-known method", () => {
  const stats = summarize([
    attempt({ subtopic: "slow", correct: false, chosen: "X", seconds: 120 }),
    attempt({ subtopic: "slow", correct: false, chosen: "Y", seconds: 140 }),
  ]);
  assert.match(recommendNext(stats), /worked examples/);
});

test("accurate but slow recommends drilling for speed", () => {
  const stats = summarize(
    Array.from({ length: 4 }, () => attempt({ subtopic: "slow", correct: true, seconds: 150 }))
  );
  assert.match(recommendNext(stats), /speed/);
});

test("no attempts recommends a baseline rather than a guess", () => {
  assert.match(recommendNext([]), /baseline/);
});
