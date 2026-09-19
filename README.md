# studykit

Claude Code skills that turn your own course material into study materials
shaped to the test you are actually sitting.

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

studykit is a set of rules against that. Every rule is here because it went
wrong first.

## What's in here

| | |
|---|---|
| **`studykit`** | The study-material skill. Reviewers, practice tests, worked examples, flashcards, and what to drill next. |
| **`studykit-site`** | Turns a folder of notes into a deployed study site. Sync layer shipped; app in progress - see [Status](#status). |
| **`templates/`** | `CLAUDE.md` and `AGENTS.md` to drop into your own notes folder, so the standards apply to every session there. |

---

## studykit

- **Builds a source packet before generating anything**, and tells you what it
  opened and what it could not. A polished partial reviewer is more dangerous
  than an openly incomplete one, because it hides its own gaps.
- **Treats your teacher as outranking the textbook.** Their notation, rounding,
  and scope are what gets marked.
- **Fixes the scope first** - what's in, what's explicitly out, and what format.
  An announced format usually names one section, not the whole paper.
- **Writes worked examples in exam shape** - neutral facts, arbitrary order, the
  judgment left to you, the trap named afterwards.
- **Explains every distractor.** An answer key that gives only the letter has
  taught you nothing. The wrong option you were tempted by is the lesson.
- **Matches the real format.** An MCQ paper gets MCQ practice with real traps,
  not open-ended prompts.
- **Never builds one subject's test from another subject's template.** Different
  teachers test differently, so borrowed shape is borrowed error.
- **Flags contradictions instead of silently picking one.** If one lesson lists
  six elements and another lists seven, that discrepancy is a whole quiz
  question.
- **Separates what your teacher said from what the assistant inferred.** A guess
  presented as fact sends you into a test prepared for the wrong paper.
- **Respects stated exclusions.** Out-of-scope material is not harmless filler -
  it burns study hours that have a deadline attached.
- **Closes the loop.** Records which wrong option you picked, not just that you
  missed it, and uses that to pick the next drill.
- **Renders printable PDFs** in one house format - Georgia, black on white, no
  monospace, a ruled scope box and a sources line. Uses the Chrome already on
  your machine, nothing to install.

## Templates

Two files to copy into your notes folder. `CLAUDE.md` covers operations - folder
map, note format, what publishes, what to verify before asserting. `AGENTS.md`
covers principles - the standards above, as rules that live in your folder.

They're separate on purpose: operations change when you reorganize, principles
change when something goes wrong. `AGENTS.md` ends with an empty section for
your own rules, added with the evidence attached. That section is what makes it
yours - a rule without its reason gets deleted by the next person who finds it
inconvenient.

## studykit-site

A local daemon watches your notes folder, mirrors **only the folders you
allowlist** into the site, and redeploys.

```
notes folder  ->  sync daemon (allowlist + debounce)  ->  site  ->  deploy
```

The allowlist is opt-in only - there is no `exclude` list. A new folder is
private by default and a typo fails closed. Removing a folder from the list and
re-running **unpublishes** it. The sync refuses a target outside the project,
because it prunes that directory.

### Status

**Shipped and tested:** the sync layer and the content contract. Verified
against a fixture vault - private folders are not copied, non-markdown is not
copied, removal unpublishes, and an out-of-project target is refused.

**Not built yet:** the Next.js app itself - subject pages, practice runner,
flashcard review, dashboard, calendar, analytics. The contract they'll read is
specified in [`site/references/content-schema.md`](site/references/content-schema.md);
the app that reads it is in progress. Don't install this half expecting a site.

## Pairs with obsidian-second-brain

If you keep your notes in Obsidian, [**obsidian-second-brain**](https://github.com/eugeniughelbur/obsidian-second-brain)
is the natural companion. It handles the vault as persistent memory - semantic
search, notes that rewrite themselves as things change, scheduled maintenance.
studykit handles what happens when there's a test on Friday.

They work on the same plain-markdown vault and neither requires the other.
Install both if you want the vault to stay current *and* turn into practice
material. Separate project, separately maintained, MIT like this one.

## Install

```bash
git clone https://github.com/boa4ver/studykit ~/.claude/skills/studykit
```

Then in Claude Code:

```
/studykit
```

Or just ask - "help me study for Friday's chapter 8 quiz, here are the slides" -
and the skill loads itself.

## Use

Hand it material and tell it what you're preparing for.

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

```bash
node scripts/render-pdf.mjs reviewer.html reviewer.pdf
```

## What it will not do

- Write work for you to submit as-is. It builds material to study *from*, and
  leaves enough visible reasoning that you can defend it if you're asked about
  it in class.
- Invent your opinions, reflections, or personal examples. Where a draft needs
  one, it leaves a flagged placeholder.
- Build a profile of a named teacher from covert recordings. It uses what your
  teacher actually handed out - posted past papers, stated scope, rubrics,
  graded returns. That's the useful evidence anyway.
- Guess a test date or format to fill in a template. Unknown stays `TBD`.
- Publish anything outside the allowlist.

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

templates/CLAUDE.md               operations, for your own notes folder
templates/AGENTS.md               principles, for your own notes folder

site/SKILL.md                     the study-site skill
site/references/content-schema.md the frontmatter the site reads
site/references/deploy.md         sync config, verification, deploy
site/scripts/                     sync library, one-shot sync, watcher
```

## License

MIT.
