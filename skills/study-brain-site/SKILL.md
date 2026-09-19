---
name: study-brain-site
description: Build and deploy a personal study website from a folder of markdown notes - subject pages, a practice-test runner, flashcard review, deadlines, and analytics, deployed to Vercel. Use when a student wants their notes as a website or web app, wants to study or practice on their phone, asks to deploy or host their notes, wants a study dashboard, or wants their Obsidian vault turned into a site. Also use to set up the sync daemon that mirrors a vault folder to the site and redeploys on change.
---

# study-brain-site

Turn a folder of markdown notes into a deployed study site.

The site is a **derived interface**. The notes are canonical. Nothing is ever
authored in the site that does not end up back in the folder.

## The architecture, in one paragraph

A student keeps notes in a folder - an Obsidian vault, an export, anything with
markdown in it. A local sync daemon watches that folder, mirrors **only the
folders on an allowlist** into the site's content directory, and triggers a
deploy. The site reads that mirrored markdown at build time and renders subject
pages, practice tests, and flashcard decks from it. Edits made in the site go
into a queue that the same daemon applies back to the original files.

```
notes folder  ->  sync daemon (allowlist + debounce)  ->  site content  ->  deploy
      ^                                                                      |
      +------------------ write-back queue ----------------------------------+
```

## Before touching anything: the publish gate

**A file in an allowlisted folder is a file on the internet.** The daemon has no
confirmation step; a save propagates in seconds.

So, every time:

1. Ask which folders should be public. Default everything to private.
2. Never add a folder to the allowlist without the student explicitly saying so
   in that conversation.
3. Say out loud, in the reply, which folders are on the list and which are not.
4. Anything containing grades, personal reflections, application material, or
   notes about other people who have not consented stays off the list.
5. If the site is public rather than password-gated, say so plainly before the
   first deploy, not after.

A student who does not realise their reflections are live will find out the
worst possible way.

## Steps

### 1. Establish the content contract

Read `references/content-schema.md`. The site reads frontmatter, so the notes
have to carry it. Do not invent keys that the site does not read, and do not
read keys the notes do not carry.

**Practice and flashcards are opt-in.** A note becomes a runnable quiz only when
it carries the explicit marker. Never infer that a note should become practice
because it happens to contain questions, answers, or a table - that fills the
review queue with noise and buries the material the student actually asked for.

### 2. Scaffold the site

Next.js App Router, reading markdown from `content/`. Build the spine first -
subject list, subject page, note page - and confirm it renders real notes before
adding anything interactive.

### 3. Add the practice runner

See `references/practice-runner.md`. Scoring, per-question timing, recorded
distractor choices, and an explanation view that covers every wrong option.

### 4. Set up sync

See `references/deploy.md`. Copy `vault-sync.config.example.json`, fill in the
source folder and the allowlist, and run the watcher. Verify by touching one
allowlisted file and one private file, and confirming only the first one moved.

### 5. Deploy

Vercel, from the site directory. Gate it behind a password unless the student
says otherwise.

## Rules carried over from study-brain

The site presents the material; it does not get to lower its standards.

- **Answer keys explain every distractor.** A results screen that shows only a
  score and a green tick has thrown away the entire lesson.
- **Record which wrong option was chosen**, not just that the item was missed.
  That field is what makes the next drill targeted instead of guessed.
- **The site is concise; the notes keep the evidence.** Provenance, confidence
  labels, contradictions, and reasoning live in the markdown. The site shows
  title, scope, status, and what to do next. Do not render audit paragraphs into
  a dashboard.
- **Never invent a value to fill a field.** Points not stated is "not provided",
  not a guess. A missing date is `TBD`, not today.
- **Time is the student's local time**, never the hosting server's. Pick the
  timezone explicitly and use it for every greeting, countdown, and "is this
  due today" decision.

## What the site must not do

- Auto-generate practice or flashcards from notes that did not opt in.
- Show a deadline that has passed as if it were upcoming.
- Treat its own local edits as canonical when the same fact exists in the notes.
- Publish anything outside the allowlist, ever, including through a redirect,
  a search index, or an API route that reads the source folder directly.
