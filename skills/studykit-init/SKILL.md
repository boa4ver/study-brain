---
name: studykit-init
description: Set up studykit in one command - scaffold the study site, point it at a notes folder, choose what publishes, and install the governing CLAUDE.md and AGENTS.md. Use when a student is starting with studykit for the first time, asks to set it up, install it, get started, or scaffold the site, or wants their notes folder configured for studying.
---

# studykit-init

One command that sets up everything: the site, the sync config, and the
governing files in the student's notes folder.

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/studykit-init/scripts/init.mjs
```

It is interactive by default and asks four things: where the notes are, which
folders may be published, where the site should go, and whether to add the
template files.

## Non-interactive

```bash
node init.mjs \
  --notes=~/Documents/Notes \
  --project=~/studykit-site \
  --include="Maths,History" \
  --templates
```

| Flag | Effect |
|---|---|
| `--notes=` | The notes folder. Must exist. |
| `--project=` | Where the site is created. Refuses to overwrite an existing project. |
| `--include=` | The allowlist, comma separated. Every name must be a real folder. |
| `--templates` | Copy `CLAUDE.md` and `AGENTS.md` into the notes folder, skipping any that exist. |
| `--no-install` | Skip `npm install`. |
| `--yes` | Take defaults instead of prompting. |

## What it will not do

**It never guesses the allowlist.** An empty answer means nothing publishes, and
that is a valid way to finish - the student can add folders later, once they
have seen what the site does. Do not "helpfully" pass `--include` with every
folder you found.

**It never enables deploy.** The generated config has `deploy: false`. Turning
it on is a separate, deliberate act that happens after the student has run a
sync and looked at what landed in `content/vault`.

**It never overwrites.** An existing project directory or an existing
`CLAUDE.md` stops that step rather than replacing work.

## After it runs

Walk the student through the bracketed parts of `CLAUDE.md` and `AGENTS.md` if
they were added. A template nobody edited describes someone else's folders with
total confidence, which is worse than having no file at all.

Then: `npm run dev` to see the site, `npm run sync` to mirror notes without
publishing, `npm run watch` to keep it current.

Read `skills/studykit-site/references/deploy.md` before turning deploy on.
