# The house format for study PDFs

Every printable study artifact - reviewer, study notes, cheat sheet, drill -
uses the same presentation, so a stack of them reads as one system.

This format exists because the alternative was rejected on sight: a reviewer set
in Helvetica with monospace code-blocks for formulas and grey callout boxes
around ordinary text. It looked like documentation, not something to study from.

## Typography and colour

- **Georgia**, or an equivalent serif, for body, headings, and bold. Italic for
  titles of works.
- **Black ink on white.** No accent palette - no navy, teal, or gold.
- **No monospace anywhere.** Formulas, journal entries, and rules are prose,
  tables, or lists. Never a terminal-style code block. A formula set in Menlo
  reads as code, and the student is not running it.

## Page furniture

- Large bold serif title, left aligned, naming subject and scope.
- One grey subtitle line directly under it: full subject name, instructor, test
  date, time, venue.
- No running header, no footer, no page numbers.

## Structure

- Numbered top-level sections, each with a horizontal rule under the heading.
- Content in tables, tight bullets, numbered lists.
- Exactly two kinds of box: the opening **How this may be tested** block, ruled
  in black, and answer explanations. Nothing else gets a box.

## Rendering

`scripts/render-pdf.mjs` converts an HTML file to PDF using the headless Chrome
already installed on the machine. No dependencies to install.

```bash
node scripts/render-pdf.mjs reviewer.html reviewer.pdf
```

Write the HTML with `assets/reviewer.css` linked or inlined. Then **open the
rendered PDF and look at it.** A render that silently dropped a table or broke a
page mid-item is not visible from the exit code.
