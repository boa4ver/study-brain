// Mirror allowlisted markdown from a notes folder into the site's content
// directory. Nothing outside `include` is ever copied.

import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { readFile, mkdir, readdir, stat, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export function expandHome(p) {
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : p;
}

export async function loadSyncConfig(configPath = "vault-sync.config.json") {
  const raw = JSON.parse(await readFile(resolve(configPath), "utf8"));

  if (!raw.source) throw new Error("Config is missing `source`.");
  if (!Array.isArray(raw.include) || raw.include.length === 0) {
    throw new Error(
      "Config is missing `include`. Nothing syncs until you name the folders to publish."
    );
  }

  const source = resolve(expandHome(raw.source));
  const target = resolve(expandHome(raw.target ?? "content/vault"));

  if (!existsSync(source)) throw new Error(`Source folder not found: ${source}`);

  // The target is pruned on every run, so it must stay inside the project.
  const cwd = resolve(process.cwd());
  if (target !== cwd && !target.startsWith(cwd + sep)) {
    throw new Error(`Refusing to manage a target outside the project: ${target}`);
  }

  return {
    source,
    target,
    include: raw.include,
    debounceSeconds: raw.debounceSeconds ?? 20,
    deploy: raw.deploy === true,
    deployCommand: raw.deployCommand ?? "npx vercel --prod --yes",
  };
}

async function walkMarkdown(dir, base = dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await walkMarkdown(full, base, out);
    else if (entry.name.toLowerCase().endsWith(".md")) out.push(relative(base, full));
  }
  return out;
}

/** Only `.md`, only under an allowlisted top-level folder. */
async function collectAllowed(config) {
  const files = [];
  for (const folder of config.include) {
    const abs = join(config.source, folder);
    if (!existsSync(abs)) {
      console.warn(`  ! allowlisted folder not found, skipping: ${folder}`);
      continue;
    }
    for (const rel of await walkMarkdown(abs)) files.push(join(folder, rel));
  }
  return files;
}

async function isStale(from, to) {
  if (!existsSync(to)) return true;
  const [a, b] = await Promise.all([stat(from), stat(to)]);
  return a.mtimeMs > b.mtimeMs || a.size !== b.size;
}

export async function syncFromConfig(config, { deploy = config.deploy } = {}) {
  const allowed = await collectAllowed(config);
  const wanted = new Set(allowed);

  let copied = 0;
  for (const rel of allowed) {
    const from = join(config.source, rel);
    const to = join(config.target, rel);
    if (!(await isStale(from, to))) continue;
    await mkdir(join(to, ".."), { recursive: true });
    await copyFile(from, to);
    copied += 1;
  }

  // Prune anything in the target that is no longer allowlisted. This is what
  // makes removing a folder from `include` actually unpublish it.
  let removed = 0;
  for (const rel of await walkMarkdown(config.target)) {
    if (wanted.has(rel)) continue;
    await rm(join(config.target, rel));
    removed += 1;
  }

  const changed = copied > 0 || removed > 0;
  let deployed = false;

  if (changed && deploy) {
    const [cmd, ...args] = config.deployCommand.split(" ");
    const result = spawnSync(cmd, args, { stdio: "inherit" });
    deployed = result.status === 0;
    if (!deployed) console.error("Deploy command failed.");
  }

  return { copied, removed, total: allowed.length, deployed };
}
