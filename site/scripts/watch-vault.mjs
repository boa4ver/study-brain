#!/usr/bin/env node
// Watch the notes folder and sync on change, debounced.

import { watch } from "node:fs";
import { loadSyncConfig, syncFromConfig } from "./vault-sync.mjs";

const configArg = process.argv.find((a) => a.startsWith("--config="));
const config = await loadSyncConfig(configArg?.slice("--config=".length));
const deploy = config.deploy && !process.argv.includes("--no-deploy");

let timer;
let running = false;
let rerun = false;

async function run(reason) {
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  console.log(`[${new Date().toISOString()}] syncing after ${reason}`);
  try {
    const r = await syncFromConfig(config, { deploy });
    console.log(`  ${r.copied} copied, ${r.removed} removed${r.deployed ? ", deployed" : ""}`);
  } catch (error) {
    console.error(error instanceof Error ? error.stack : error);
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      await run("changes during the previous sync");
    }
  }
}

await run("startup");

const watcher = watch(config.source, { recursive: true }, (_event, filename) => {
  if (filename && !String(filename).toLowerCase().endsWith(".md")) return;
  clearTimeout(timer);
  timer = setTimeout(() => void run("a change"), config.debounceSeconds * 1000);
});

watcher.on("error", (e) => console.error(e));
console.log(
  `Watching ${config.source} (${config.debounceSeconds}s debounce, deploy ${deploy ? "on" : "off"}). Ctrl-C to stop.`
);

function shutdown() {
  clearTimeout(timer);
  watcher.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
