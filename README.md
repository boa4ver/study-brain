# studykit

A [Claude Code](https://claude.com/claude-code) skill that turns your own course
material into study materials shaped to the test you are actually sitting.

Point it at your slides, past papers, and homework. Get back a reviewer, a
practice test whose answer key explains every wrong option, worked examples that
do not give away their own answers, and a plan for what to drill next.

## Why this exists

Ask any assistant for a study guide and you get one. It will be well formatted,
confident, and built from whichever single file was easiest to open. It will
quietly skip the chapter your teacher spent two classes on, include the method
they told you was excluded, and give you worked examples that announce their own
answers.

That last one is the real problem. A worked example that says *"less the 5,000
recovered from scrap"* has already made the only decision the question exists to
test. You read it, you understand it, and you still cannot do the real problem,
because the real problem never tells you which line is a deduction.

studykit is a set of rules against that. Every rule below is here because it
went wrong first.

## What it does

- **Builds a source packet before generating anything**, and tells you what it
  opened and what it could not. A polished partial reviewer is more dangerous
  than an openly incomplete one, because it hides its own gaps.
- **Treats your teacher as outranking the textbook.** Their notation, rounding,
  and scope are what gets marked.
- **Writes worked examples in exam shape** - neutral facts, arbitrary order, the
  judgment left to you, the trap named afterwards.
- **Explains every distractor.** An answer key that gives only the letter has
  taught you nothing. The wrong option you were tempted by is the lesson.
- **Matches the real format.** An MCQ paper gets MCQ practice with real traps,
  not open-ended prompts.
- **Never builds one subject's test from another subject's template.** Different
  teachers test differently, so borrowed shape is borrowed error.
- **Flags contradictions instead of silently picking one.** If one lesson lists
  six elements and another lists seven, that discrepancy is an entire quiz
  question.
- **Separates what your teacher said from what the assistant inferred.** A guess
  presented as fact sends you into a test prepared for the wrong paper.

## Install

```bash
git clone https://github.com/<you>/studykit ~/.claude/skills/studykit
```

Then in Claude Code:

```
/studykit
```

Or just ask - "help me study for Friday's chapter 8 quiz, here are the slides" -
and the skill loads itself.

## Use

Hand it material and tell it what you are preparing for.

```
I have a business math quarterly exam on the 15th. Scope is the nine
topics in this announcement. Here are the slides and my two returned
quizzes. Build me a reviewer.
```

```
Make me a 20-item practice test from this. It's multiple choice plus
one long problem.
```

```
I got 12 of 20. Here's which ones I missed and what I picked.
What should I drill?
```

Files are the default input and always work. Google Classroom is an optional
upgrade if you have an integration set up - see
[`references/classroom-input.md`](references/classroom-input.md).

## Printable output

Study PDFs use one house format: Georgia, black on white, no monospace, no page
furniture, a ruled scope box and a sources line at the top. Rendering uses the
Chrome already on your machine, with nothing to install.

```bash
node scripts/render-pdf.mjs reviewer.html reviewer.pdf
```

## What it will not do

- Write work for you to submit as-is. It builds material to study *from*, and
  leaves enough visible reasoning that you can defend it if you are asked about
  it in class.
- Invent your opinions, reflections, or personal examples. Where a draft needs
  one, it leaves a flagged placeholder.
- Build a profile of a named teacher from covert recordings. It uses what your
  teacher actually handed out - posted past papers, stated scope, rubrics,
  graded returns. That is the useful evidence anyway.
- Guess a test date or format to fill in a template. Unknown stays `TBD`.

## Layout

```
SKILL.md                          the method and the workflow
references/study-notes.md         reviewers, study guides, cheat sheets
references/practice-design.md     practice tests, distractors, flashcards
references/pdf-format.md          the house format for printables
references/adaptive-loop.md       what to drill next, from real results
references/classroom-input.md     optional Google Classroom input
assets/reviewer.css               the house stylesheet
assets/reviewer-template.html     reference implementation
scripts/render-pdf.mjs            HTML to PDF, no dependencies
```

## License

MIT.
