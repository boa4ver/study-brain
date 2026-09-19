<p align="center">
  <a href="#install"><img src="https://img.shields.io/badge/Claude_Code-D97757?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude Code" /></a>
  <a href="#other-agents"><img src="https://img.shields.io/badge/Codex_CLI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="Codex CLI" /></a>
  <a href="#other-agents"><img src="https://img.shields.io/badge/Gemini_CLI-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini CLI" /></a>
  <a href="#other-agents"><img src="https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white" alt="Cursor" /></a>
  <a href="#other-agents"><img src="https://img.shields.io/badge/OpenCode-181818?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="OpenCode" /></a>
</p>

<p align="center">
  <strong>Your notes. Your teacher's format. One plugin, any agent.</strong>
  <br />
  <em>Study material that makes you do the judgment the exam will ask for.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/github/stars/boa4ver/study-brain?style=for-the-badge&color=yellow" alt="Stars" />
  <img src="https://img.shields.io/badge/skills-3-7C3AED?style=for-the-badge" alt="3 skills" />
  <img src="https://img.shields.io/badge/tests-23_passing-green?style=for-the-badge" alt="23 tests passing" />
</p>

# study-brain

**An agent plugin that turns your own course material into study materials
shaped to the test you're actually sitting.** Works with Claude Code, Codex CLI,
Gemini CLI, Cursor, and anything that reads `AGENTS.md`.

Point it at your slides, past papers, and homework. Get back a reviewer, a
practice test whose answer key explains every wrong option, worked examples that
don't give away their own answers, and a plan for what to drill next.

## Requirements

study-brain builds on an Obsidian vault kept current by
[**obsidian-second-brain**](https://github.com/eugeniughelbur/obsidian-second-brain).
Install that first:

```
/plugin marketplace add eugeniughelbur/obsidian-second-brain
/plugin install obsidian-second-brain
```

`/study-brain-init` checks for it and offers to install it if it's missing. It
asks rather than doing it silently - that's someone else's code going onto your
machine, so it's your call, not a side effect of running setup.

Separate project, separately maintained, MIT like this one.

## Features

- 📋 **Reviewers and study guides** built from your real sources, not a summary of them
- 📝 **Practice tests in your exam's actual format** - MCQ paper gets MCQ practice with real traps
- 🎯 **Answer keys that explain every distractor** - the wrong option you were tempted by is the lesson
- 🧮 **Exam-shaped worked examples** - neutral facts, the judgment left to you, the trap named afterwards
- 🃏 **Gradeable flashcards** with spaced repetition (Leitner, 0/1/3/7/21 days)
- 📊 **Tells you what to drill next** from which wrong answers you picked, not just your score
- 📄 **Printable PDFs** in one clean house format, using the Chrome you already have
- 🌐 **A deployable study site** from a folder of markdown, with an opt-in publish allowlist
- 📁 **`CLAUDE.md` + `AGENTS.md` templates** so the standards apply to every session in your notes folder
- ⚡ **One-command setup** - `study-brain-init` scaffolds the lot
- 🔒 **Publishing is opt-in at every step** - allowlist starts empty, deploy starts off, nothing leaks by default
- 📌 **Never invents a date, a format, or a points value** - unknown stays `TBD`

## Install

```bash
/plugin marketplace add boa4ver/study-brain
/plugin install study-brain
```

Then set everything up in one command:

```
/study-brain-init
```

Or just ask - *"help me study for Friday's chapter 8 quiz, here are the
slides"* - and the right skill loads itself.

## Other agents

The skills are plain `SKILL.md` files, so they are not Claude-specific. Clone
the repo and each agent picks them up from the file it already looks for:

| Agent | Reads |
|---|---|
| **Claude Code** | `.claude-plugin/` + `skills/` |
| **Codex CLI** | `AGENTS.md`, and `.agents/skills/` natively |
| **Gemini CLI** | `GEMINI.md` |
| **Cursor** | `.cursor/rules/study-brain.mdc` |
| **OpenCode / Zed / Amp** | `AGENTS.md` |

Every one of those is generated from `skills/` by
`node scripts/build-adapters.mjs`, so they cannot drift apart. `skills/` is the
only place to edit.

## Why this exists

Ask any assistant for a study guide and you get one. It will be well formatted,
confident, and built from whichever single file was easiest to open. It will
quietly skip the chapter your teacher spent two classes on, include the method
they told you was excluded, and give you worked examples that announce their own
answers.

That last one is the real problem. A worked example that says *"less the 5,000
recovered from scrap"* has already made the only decision the question exists to
test. You read it, you understand it, and you still can't do the real problem,
because the real problem never tells you which line is a deduction.

study-brain is a set of rules against that. Every rule is here because it went
wrong first.

## The skills

| Skill | What it does |
|---|---|
| **`study-brain`** | The study-material skill. Reviewers, practice tests, worked examples, flashcards, and what to drill next. |
| **`study-brain-site`** | Turns a folder of notes into a deployed study site. |
| **`study-brain-init`** | One-command setup for both. |

### study-brain

- **Builds a source packet before generating anything**, and tells you what it
  opened and what it couldn't. A polished partial reviewer is more dangerous
  than an openly incomplete one, because it hides its own gaps.
- **Treats your teacher as outranking the textbook.** Their notation, rounding,
  and scope are what gets marked.
- **Fixes the scope first** - what's in, what's explicitly out, what format. An
  announced format usually names one section, not the whole paper.
- **Never builds one subject's test from another subject's template.** Different
  teachers test differently, so borrowed shape is borrowed error.
- **Flags contradictions instead of silently picking one.** If one lesson lists
  six elements and another lists seven, that discrepancy is a whole quiz
  question.
- **Separates what your teacher said from what the assistant inferred.** A guess
  presented as fact sends you into a test prepared for the wrong paper.
- **Respects stated exclusions.** Out-of-scope material isn't harmless filler -
  it burns study hours that have a deadline attached.

### study-brain-site

A local daemon watches your notes folder, mirrors **only the folders you
allowlist** into the site, and redeploys.

```
notes folder  ->  sync daemon (allowlist + debounce)  ->  site  ->  deploy
```

There's no `exclude` list - the allowlist is opt-in only, so a new folder is
private by default and a typo fails closed. Removing a folder and re-running
**unpublishes** it. The sync refuses a target outside the project, because it
prunes that directory.

**Status:** the sync layer, content parser, and scheduling are done and tested
(23 tests). The Next.js app renders subject pages, notes, a scored practice
runner with distractor explanations, and flashcard review. Dashboard, calendar,
assignment manager, and persisted cross-device analytics are **not built yet**.

### Templates

`CLAUDE.md` covers operations - folder map, note format, what publishes, what to
verify before asserting. `AGENTS.md` covers principles - the standards above, as
rules that live in your folder.

They're separate on purpose: operations change when you reorganize, principles
change when something goes wrong. `AGENTS.md` ends with an empty section for
your own rules, added with the evidence attached. That section is what makes it
yours - a rule without its reason gets deleted by the next person who finds it
inconvenient.

## Use

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
upgrade if you have an integration set up.

## What it will not do

- Write work for you to submit as-is. It builds material to study *from*, and
  leaves enough visible reasoning that you can defend it if you're asked about
  it in class.
- Invent your opinions, reflections, or personal examples. Where a draft needs
  one, it leaves a flagged placeholder.
- Build a profile of a named teacher from covert recordings. It uses what your
  teacher actually handed out - posted past papers, stated scope, rubrics,
  graded returns. That's the useful evidence anyway.
- Guess a test date, format, or points value to fill a template.
- Publish anything outside the allowlist.

## Layout

```
.claude-plugin/plugin.json          the plugin manifest
skills/study-brain/                    the study-material skill
skills/study-brain-site/               the study-site skill
  template/                         the Next.js app
  scripts/                          sync library, one-shot sync, watcher
skills/study-brain-init/               one-command setup
templates/                          CLAUDE.md and AGENTS.md for your notes folder
```

## License

MIT.
