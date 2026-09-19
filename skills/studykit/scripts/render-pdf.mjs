#!/usr/bin/env node
// Render an HTML study document to PDF using the Chrome already on the machine.
// No dependencies.
//
//   node scripts/render-pdf.mjs reviewer.html reviewer.pdf

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

function findChrome() {
  const hit = CHROME_PATHS.find((p) => existsSync(p));
  if (hit) return hit;
  console.error(
    "No Chrome, Chromium, or Edge found. Install one, or set CHROME_PATH to its binary."
  );
  process.exit(1);
}

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  console.error("Usage: node scripts/render-pdf.mjs <input.html> <output.pdf>");
  process.exit(1);
}

const inputPath = resolve(input);
const outputPath = resolve(output);

if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const result = spawnSync(
  findChrome(),
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${outputPath}`,
    pathToFileURL(inputPath).href,
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);

if (result.error) {
  console.error(`Failed to launch the browser: ${result.error.message}`);
  process.exit(1);
}

if (!existsSync(outputPath)) {
  console.error(result.stderr?.toString().trim() || "Chrome produced no output file.");
  process.exit(1);
}

console.log(`Wrote ${outputPath}`);
console.log("Open it and look at it before sending it anywhere.");
