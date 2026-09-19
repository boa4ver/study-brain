# The inbox note format

One note per imported post. The inbox is a staging area, not the vault's
knowledge - notes here get *applied* to subject notes and then marked done.

```markdown
---
title: Chapter 9 lecture materials
course: Accounting
type: material          # announcement | assignment | material
receivedAt: 2026-09-11T08:00:00+08:00
dueAt: 2026-09-18T23:00:00+08:00     # assignments only, omit otherwise
points: 18                            # only if the teacher stated one
attachments:
  - lecture-outline.pdf
  - illustration-workbook.xlsx
sourceUrl: https://classroom.google.com/...
processed: false
---

The post's own text, verbatim.
```

## The fields that matter

| Field | Why |
|---|---|
| `processed` | `false` until the content is reflected in the vault. This is the only record of what still needs applying. |
| `receivedAt` | Lets the health check tell a genuinely new post from one whose files never arrived. |
| `attachments` | Their absence on a material post is the signal that a sync failed. |
| `points` | **Omit when unstated.** Never write a guess. |

Keep offsets on every timestamp. A time without one is read in the server's
timezone, and a deadline silently moves.

## Why a staging area at all

Importing and applying are different jobs and fail differently. A post can
import perfectly and still never reach the subject note where someone will look
for it. Keeping them separate means "what has arrived" and "what has been acted
on" are two answerable questions instead of one assumption.

The counts an importer prints answer neither. They report what was newly
fetched, not whether an existing note has been applied.

## Marking one processed

Set `processed: true` only once the content is reflected where it will be found
later - the subject's `exams:` or `tasks:`, the lesson note, the schedule.

Reading a note is not processing it. Deciding it needs no action *is* - say so
in the reply so the student can disagree.
