import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuestions, parseCards, findUnexplainedDistractors } from "./parse.ts";

const SAMPLE = `
### Q1
A company paid 500,000 for a machine and 20,000 to the contractor who
installed it. Scrap from the crating was sold for 5,000.

- [ ] 500,000
- [x] 515,000
- [ ] 520,000
- [ ] 525,000

> **Right:** 515,000 - installation is part of getting the asset ready.
> **500,000** - ignores both adjustments.
> **520,000** - adds installation but forgets the recovery.
> **525,000** - adds the recovery instead of subtracting it. Sign error.

### Q2
Which is an operating cost?

- [x] Annual insurance
- [ ] Installation

> **Right:** insurance covers running the asset, not readying it.
> **Installation** - a cost of getting it ready, so it is capitalized.
`;

test("parses each question with its choices", () => {
  const qs = parseQuestions(SAMPLE);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].id, "Q1");
  assert.equal(qs[0].choices.length, 4);
});

test("marks exactly one choice correct", () => {
  const [q1] = parseQuestions(SAMPLE);
  assert.deepEqual(
    q1.choices.filter((c) => c.correct).map((c) => c.text),
    ["515,000"]
  );
});

test("keeps the prompt and drops the choice markup from it", () => {
  const [q1] = parseQuestions(SAMPLE);
  assert.match(q1.prompt, /500,000 for a machine/);
  assert.doesNotMatch(q1.prompt, /\[x\]/);
});

test("attaches an explanation to every wrong option", () => {
  const [q1] = parseQuestions(SAMPLE);
  for (const choice of q1.choices.filter((c) => !c.correct)) {
    assert.ok(choice.explanation.length > 0, `no explanation for ${choice.text}`);
  }
  assert.match(
    q1.choices.find((c) => c.text === "525,000")!.explanation,
    /sign error/i
  );
});

test("captures the rationale for the right answer", () => {
  const [q1] = parseQuestions(SAMPLE);
  assert.match(q1.rationale, /installation is part of getting the asset ready/);
});

test("flags questions whose distractors are unexplained", () => {
  const thin = `
### Q1
Pick one.

- [x] Right
- [ ] Wrong

> **Right:** because.
`;
  assert.deepEqual(findUnexplainedDistractors(parseQuestions(thin)), ["Q1"]);
  assert.deepEqual(findUnexplainedDistractors(parseQuestions(SAMPLE)), []);
});

test("ignores headings that carry no choices", () => {
  assert.deepEqual(parseQuestions("## Notes\nSome prose.\n\n## More\nText."), []);
});

test("parses flashcards from a table, discarding the header", () => {
  const cards = parseCards(`
| Term | |
|---|---|
| What is straight-line depreciation? | Cost less salvage, spread evenly |
| What is salvage value? | What it is worth at the end of its life |
`);
  assert.equal(cards.length, 2);
  assert.equal(cards[0].front, "What is straight-line depreciation?");
  assert.match(cards[0].back, /spread evenly/);
  assert.ok(!cards.some((c) => c.front === "Term"), "header row became a card");
});

test("drops placeholder cards instead of queueing them", () => {
  const cards = parseCards(`
| Term | |
|---|---|
| Real question? | A real answer |
| Unfinished? | (fill in) |
`);
  assert.deepEqual(cards.map((c) => c.front), ["Real question?"]);
});
