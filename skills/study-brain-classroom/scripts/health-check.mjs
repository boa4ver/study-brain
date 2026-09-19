#!/usr/bin/env node
// Check whether a Classroom import is actually working.
//
//   node health-check.mjs <inbox-dir> [--hours=6] [--status=<file>]
//
// Exits 1 when something is wrong, so it can gate a sync.
//
// This exists because an import can report success on every single run while
// downloading nothing at all. A sign-in silently expires, posts get marked
// processed, counts look normal, and entire chapters of material are missing
// from every study artifact built during that period. The exit code of the
// importer does not tell you this. Only checking the artifacts does.

import { readdir, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const inbox = resolve(args.find((a) => !a.startsWith("--")) ?? "inbox");
const flag = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const STALE_HOURS = Number(flag("hours", 6));
const statusFile = flag("status", join(inbox, "import-status.json"));

const warnings = [];
const hoursSince = (iso) => (Date.now() - Date.parse(iso)) / 3_600_000;

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/** Frontmatter scalar, without pulling in a YAML parser. */
function field(text, key) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

// 1. Is the importer even running? -----------------------------------------
const status = await readJson(statusFile);
if (!status) {
  warnings.push(
    `No import status at ${statusFile}. The importer has never reported, so "no new posts" is not evidence of anything.`
  );
} else {
  if (status.needsLogin || status.authExpired) {
    warnings.push(
      "Sign-in EXPIRED. Attachments are not downloading. Re-authenticate, then re-run the import."
    );
  }
  if (status.lastRunAt) {
    const hours = hoursSince(status.lastRunAt);
    if (hours > 2) {
      warnings.push(
        `Importer has not completed a run in ${Math.round(hours)} hours - it is crashing or being skipped. Check its log.`
      );
    }
  } else {
    warnings.push("Import status has no lastRunAt, so staleness cannot be checked.");
  }
}

// 2. Did the files actually land? ------------------------------------------
if (!existsSync(inbox)) {
  warnings.push(`Inbox folder not found: ${inbox}`);
} else {
  const notes = [];
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      if (e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.name.endsWith(".md")) notes.push(full);
    }
  };
  await walk(inbox);

  let bodyless = 0;
  let unprocessed = 0;
  let oldestBodyless = null;

  for (const file of notes) {
    const text = await readFile(file, "utf8");
    if (field(text, "processed") === "false") unprocessed += 1;

    const received = field(text, "receivedAt") ?? field(text, "date");
    const body = text.replace(/^---[\s\S]*?---/, "").trim();

    // A material post with no body and no attachment is the signature of the
    // silent failure: the post synced, its files did not.
    const claimsAttachments = /attachments?:/i.test(text);
    const looksEmpty = body.length < 40 || /no message body/i.test(body);

    if (looksEmpty && !claimsAttachments) {
      if (received && hoursSince(received) < STALE_HOURS) continue;
      bodyless += 1;
      if (!oldestBodyless || (received && received < oldestBodyless)) {
        oldestBodyless = received;
      }
    }
  }

  if (bodyless > 0) {
    warnings.push(
      `${bodyless} imported post(s) older than ${STALE_HOURS}h have no body and no attachments` +
        (oldestBodyless ? ` (oldest ${oldestBodyless.slice(0, 10)})` : "") +
        ". Their files are probably missing - do not tell the student the material was never posted."
    );
  }

  console.log(`  ${notes.length} imported note(s), ${unprocessed} not yet applied to the vault.`);
}

// 3. Report ----------------------------------------------------------------
const ok = warnings.length === 0;
for (const w of warnings) console.error(`ATTENTION: ${w}`);
console.log(JSON.stringify({ ok, warnings }, null, 2));

if (!ok) {
  console.error(
    "\n  Report every warning above to the student BEFORE doing any other work.\n" +
      "  A clean import count is not evidence that files arrived."
  );
  process.exitCode = 1;
}
