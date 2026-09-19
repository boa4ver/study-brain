#!/usr/bin/env node
// Turn collected Classroom events into vault inbox notes.
//
//   node ingest.mjs [--config=classroom.config.json]
//
// Re-running is safe: a note is rewritten only when its event or page actually
// changed, and only the generated block is replaced.

import { createHash } from "node:crypto";
import { copyFile, mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";

import { buildNote, courseFolder, isExcluded, mergeNote, noteStem } from "./lib/inbox.mjs";

const expand = (p) => (String(p).startsWith("~") ? join(homedir(), String(p).slice(1)) : String(p));
const flagOf = (n, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    if (fallback !== null) return fallback;
    throw error;
  }
}

const configPath = resolve(flagOf("config", "classroom.config.json"));
const config = await readJson(configPath);
if (!config) throw new Error(`No config at ${configPath}`);
if (!config.vault) throw new Error("Config needs `vault`.");

const eventsDir = resolve(expand(config.eventsDir ?? "events"));
const vault = resolve(expand(config.vault));
const inboxRoot = join(vault, config.inboxPath ?? join("_System", "Classroom Inbox"));
const statePath = join(eventsDir, "ingestion-state.json");

const state = await readJson(statePath, { version: 1, ingested: {} });
const ingested = state.ingested ?? {};

const dirs = await readdir(eventsDir, { withFileTypes: true }).catch(() => []);
const pending = [];
let skipped = 0;

for (const dir of dirs) {
  if (!dir.isDirectory()) continue;
  const event = await readJson(join(eventsDir, dir.name, "event.json"));
  if (!event) continue;

  if (isExcluded(event.course, event.title, config.exclude ?? [])) {
    skipped += 1;
    continue;
  }

  const page = await readJson(join(eventsDir, dir.name, "page.json"));
  const signature = createHash("sha256").update(JSON.stringify({ event, page })).digest("hex");
  if (ingested[event.id] === signature) continue;
  pending.push({ dir: dir.name, event, page, signature });
}

pending.sort((a, b) => String(a.event.receivedAt).localeCompare(String(b.event.receivedAt)));

const written = [];

for (const { dir, event, page, signature } of pending) {
  const folder = courseFolder(event.course, config.courses ?? {}, page?.text ?? "");
  const noteDir = join(inboxRoot, folder);
  const stem = noteStem(event) || dir;
  await mkdir(noteDir, { recursive: true });

  // Copy attachments into the vault, refusing any path outside the events dir.
  const pageForNote = page ? { ...page, attachments: [] } : null;
  const keep = new Set();

  for (const attachment of page?.attachments ?? []) {
    if (!attachment.localPath) {
      pageForNote.attachments.push(attachment);
      continue;
    }
    const source = resolve(expand(attachment.localPath));
    if (!source.startsWith(eventsDir + sep)) {
      pageForNote.attachments.push(attachment);
      continue;
    }
    const relative = join("Attachments", stem, basename(source));
    const destination = join(noteDir, relative);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    keep.add(basename(destination));
    pageForNote.attachments.push({ ...attachment, archivedPath: relative });
  }

  // Drop attachments the post no longer has.
  const managed = join(noteDir, "Attachments", stem);
  for (const entry of await readdir(managed, { withFileTypes: true }).catch(() => [])) {
    if (entry.isFile() && !keep.has(entry.name)) await unlink(join(managed, entry.name));
  }

  const notePath = join(noteDir, `${stem}.md`);
  const generated = buildNote(event, pageForNote);
  const existing = await readFile(notePath, "utf8").catch(() => null);

  await writeFile(notePath, existing === null ? generated : mergeNote(existing, generated), "utf8");
  ingested[event.id] = signature;
  written.push(notePath);
}

await writeFile(
  statePath,
  JSON.stringify(
    { version: 1, lastIngestedAt: new Date().toISOString(), ingested },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  JSON.stringify(
    {
      ingestedAt: new Date().toISOString(),
      newNotes: written.length,
      skippedExcluded: skipped,
      written: written.map((p) => p.replace(vault + sep, "")),
    },
    null,
    2
  )
);

if (written.length) {
  console.error(
    `\n  ${written.length} note(s) written with processed: false.\n` +
      "  They are not applied until their content is reflected in the vault.\n" +
      "  A clean count here is not evidence that attachments arrived - run health-check.mjs."
  );
}
