#!/usr/bin/env node
// One-shot sync. Use --no-deploy to mirror locally and publish nothing.

import { loadSyncConfig, syncFromConfig } from "./vault-sync.mjs";

const configArg = process.argv.find((a) => a.startsWith("--config="));
const config = await loadSyncConfig(configArg?.slice("--config=".length));
const deploy = config.deploy && !process.argv.includes("--no-deploy");

console.log(`Source:    ${config.source}`);
console.log(`Target:    ${config.target}`);
console.log(`Publishing: ${config.include.join(", ")}`);
console.log(`Deploy:    ${deploy ? "yes" : "no"}\n`);

const result = await syncFromConfig(config, { deploy });
console.log(
  `${result.total} file(s) allowlisted - ${result.copied} copied, ${result.removed} removed${result.deployed ? ", deployed" : ""}.`
);
