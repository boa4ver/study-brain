# The content contract

The site reads markdown with YAML frontmatter. These are the only keys it reads.
Do not invent others, and do not read keys the notes do not carry.

## Every note

```yaml
---
title: Chapter 8 - Fixed Assets
subject: Accounting
type: lesson          # lesson | reviewer | practice | flashcards | assignment
updated: 2026-03-12
---
```

`title` and `subject` are required. A note missing `subject` does not appear
under any subject and is effectively invisible - check for these.

## Subject index notes

One per subject, carrying the things the dashboard needs.

```yaml
---
title: Accounting
subject: Accounting
type: index
instructor: Name, or omit entirely
exams:
  - name: Chapter 8 Quiz
    date: 2026-03-24
    startsAt: 2026-03-24T08:00:00+08:00
    endsAt: 2026-03-24T10:00:00+08:00
    status: upcoming       # upcoming | completed | cancelled | superseded
    scope: Chapter 8 only. Appendix method excluded.
tasks:
  - name: Chapter 8 exercises
    due: 2026-03-18T23:00:00+08:00
    points: 18             # omit if the teacher never stated one
    status: open           # open | submitted | graded
---
```

**Offsets are not optional.** A time without one is interpreted in the server's
timezone, which is not where the student lives, and a deadline silently shifts.

**Never invent `points`.** If no source states it, leave the key out. The site
renders that as "not provided", which is true. A guessed number is not.

Keep `completed`, `cancelled`, and `superseded` entries in the notes - the
history is the evidence - and filter them out of the current view.

## Opting a note into practice

Practice and flashcards are **opt-in**, always, per note:

```yaml
---
title: Chapter 8 Practice Test
subject: Accounting
type: practice
studykit:
  practice: true
  assessmentId: accounting-ch8      # ties attempts to one scope
  durationMinutes: 90
---
```

```yaml
studykit:
  flashcards: true
```

Both default to false. **Do not add either marker because a note happens to
contain questions, answers, headings, or a table.** A note becomes runnable
practice when the student asks for it, and not before - otherwise the review
queue fills with material nobody chose and the real decks get buried.

## Question format

```markdown
### Q1
A company paid 500,000 for a machine and 20,000 to the contractor who
installed it. Scrap from the crating was sold for 5,000.

- [ ] 500,000
- [x] 515,000
- [ ] 520,000
- [ ] 525,000

> **Right:** 515,000 - installation is part of getting the asset ready, and the
> scrap recovery reduces the cost.
> **500,000** - ignores both adjustments; tempting if you stop at the invoice.
> **520,000** - adds installation but forgets the recovery. The most common miss.
> **525,000** - adds the recovery instead of subtracting it. Sign error.
```

The blockquote is not optional. **Every wrong option gets a line saying what
error it represents.** A key with only the right answer has thrown away the part
the student actually needed.

## Flashcard tables

| First column is the card front | Back |
|---|---|
| Must be a complete question or standalone term | Short and checkable |

The first column must stand alone. A fragment that only makes sense under its
header renders as gibberish on a card with the header stripped. Leave the
answer column's header empty for a clean back.

## Archiving

When an assessment's `endsAt` has passed, move its practice and flashcard notes
into an `Archive/` folder beside them. The site hoists `Archive/` into one
collapsed group rendered last. A `cancelled` or `superseded` assessment never
triggers archival.
