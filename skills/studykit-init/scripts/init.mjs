#!/usr/bin/env node
// One-command setup for a studykit site.
//
//   node init.mjs
//   node init.mjs --notes=~/Documents/Notes --project=~/studykit-site --include="Maths,History"
//
// Publishing is opt-in at every step. The allowlist starts empty and deploy
// starts off, so nothing reaches the internet because of a default.

import { createInterface } from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { cp, mkdir, readdir, writeFile, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SITE_SKILL = join(PLUGIN_ROOT, "skills", "studykit-site");

const expand = (p) => (p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const flag = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const interactive = process.stdin.isTTY && !has("yes");

async function ask(question, fallback = "") {
  if (!interactive) return fallback;
  const answer = (await rl.question(question)).trim();
  return answer || fallback;
}

function say(line = "") {
  console.log(line);
}

async function main() {
  say("\nstudykit setup\n");

  // 1. Where the notes live -------------------------------------------------
  let notes = flag("notes");
  while (!notes || !existsSync(expand(notes))) {
    if (notes) say(`  Not found: ${expand(notes)}`);
    if (!interactive) throw new Error("Pass --notes=<path> to a folder that exists.");
    notes = await ask("Where are your notes? (e.g. ~/Documents/Notes) ");
  }
  notes = resolve(expand(notes));
  say(`  Notes: ${notes}`);

  // 2. The allowlist --------------------------------------------------------
  const folders = (await readdir(notes, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

  if (folders.length === 0) throw new Error(`No folders inside ${notes}.`);

  let include = flag("include")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  if (include.length === 0 && interactive) {
    say("\n  Which folders should the site publish?");
    say("  Everything you leave out stays private. Anything with grades,");
    say("  reflections, applications, or other people in it should stay out.\n");
    folders.forEach((f, i) => say(`    ${String(i + 1).padStart(2)}. ${f}`));
    const picked = await ask("\n  Numbers, comma separated (blank = none for now): ");
    include = picked
      .split(",")
      .map((s) => folders[Number(s.trim()) - 1])
      .filter(Boolean);
  }

  const unknown = include.filter((f) => !folders.includes(f));
  if (unknown.length) throw new Error(`Not a folder in your notes: ${unknown.join(", ")}`);

  say(
    include.length
      ? `\n  Publishing: ${include.join(", ")}`
      : "\n  Publishing: nothing yet - add folders to `include` in vault-sync.config.json when you are ready."
  );
  say(`  Private:    ${folders.filter((f) => !include.includes(f)).join(", ") || "(none)"}`);

  // 3. Where the site goes --------------------------------------------------
  let project = flag("project") ?? (await ask("\nWhere should the site go? [~/studykit-site] ", "~/studykit-site"));
  project = resolve(expand(project));
  if (existsSync(join(project, "package.json"))) {
    throw new Error(`A project already exists at ${project}. Delete it or choose another path.`);
  }

  // 4. Scaffold -------------------------------------------------------------
  say(`\n  Creating ${project}`);
  await mkdir(project, { recursive: true });
  await cp(join(SITE_SKILL, "template"), project, {
    recursive: true,
    filter: (src) => !/node_modules|\.next/.test(src),
  });
  await cp(join(SITE_SKILL, "scripts"), join(project, "scripts"), { recursive: true });

  await writeFile(
    join(project, "vault-sync.config.json"),
    JSON.stringify(
      {
        source: notes,
        target: "content/vault",
        include,
        debounceSeconds: 20,
        deploy: false,
        deployCommand: "npx vercel --prod --yes",
      },
      null,
      2
    ) + "\n"
  );
  say("  Wrote vault-sync.config.json (deploy is off)");

  // 5. The governing files --------------------------------------------------
  const wantsTemplates =
    has("templates") ||
    (interactive &&
      /^y/i.test(await ask("\nAdd CLAUDE.md and AGENTS.md to your notes folder? [y/N] ", "n")));

  if (wantsTemplates) {
    for (const name of ["CLAUDE.md", "AGENTS.md"]) {
      const dest = join(notes, name);
      try {
        await access(dest);
        say(`  ${name} already exists, left alone`);
      } catch {
        await cp(join(PLUGIN_ROOT, "templates", name), dest);
        say(`  Added ${name}`);
      }
    }
    say("  Both have [bracketed] parts to fill in - an unedited template is worse than none.");
  }

  // 6. Install and first sync ----------------------------------------------
  const install = !has("no-install");
  if (install) {
    say("\n  Installing dependencies...");
    const r = spawnSync("npm", ["install", "--no-audit", "--no-fund"], { cwd: project, stdio: "inherit" });
    if (r.status !== 0) say("  npm install failed - run it yourself in the project folder.");
  }

  if (include.length > 0) {
    say("\n  First sync (nothing is deployed)...");
    spawnSync("node", ["./scripts/sync-once.mjs", "--no-deploy"], { cwd: project, stdio: "inherit" });
  }

  // 7. What now -------------------------------------------------------------
  say("\nDone.\n");
  say(`  cd ${project}`);
  say("  npm run dev            start the site");
  say("  npm run sync           mirror your notes, publish nothing");
  say("  npm run watch          keep it in sync while you work");
  say("");
  say("  Before you ever set deploy to true: run `npm run sync`, look at what");
  say("  landed in content/vault, and check it against what you want public.");
  say("");
}

try {
  await main();
} catch (error) {
  console.error(`\n  ${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
} finally {
  rl.close();
}
