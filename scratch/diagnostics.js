/**
 * DIAGNOSTIC SCRIPT — Read-only. Does not modify any source files.
 * Run from the project root: node scratch/diagnostics.js
 */

const path = require('path');
const fs   = require('fs');

// ── 1. Absolute path of the .env file dotenv will load ─────────────────────
const envPath = path.resolve(process.cwd(), '.env');
console.log('\n=== EngageHub Runtime Diagnostics ===\n');
console.log(`[1] .env absolute path : ${envPath}`);
console.log(`[1] .env file exists   : ${fs.existsSync(envPath)}`);

// ── Load dotenv exactly as server.js does ─────────────────────────────────
require('dotenv').config({ path: envPath });

// ── 2. Is YOUTUBE_API_KEY present? ─────────────────────────────────────────
const apiKey = process.env.YOUTUBE_API_KEY;
const keyPresent = !!apiKey && apiKey.trim() !== '';
console.log(`\n[2] YOUTUBE_API_KEY Present: ${keyPresent ? 'TRUE' : 'FALSE'}`);

// ── 3. First 5 / Last 5 characters (only if key exists) ───────────────────
if (keyPresent) {
  const trimmed = apiKey.trim();
  const len     = trimmed.length;
  if (len >= 10) {
    const first5  = trimmed.slice(0, 5);
    const last5   = trimmed.slice(-5);
    const masked  = first5 + '*'.repeat(Math.max(len - 10, 1)) + last5;
    console.log(`[3] Key preview        : ${masked}`);
    console.log(`[3] Key total length   : ${len} characters`);
  } else {
    console.log(`[3] Key is unusually short (${len} chars) — may be invalid.`);
  }
} else {
  console.log(`[3] Key preview        : N/A (key not set)`);
}

// ── 4. Current working directory ───────────────────────────────────────────
console.log(`\n[4] Current working directory: ${process.cwd()}`);

// ── 5. .env last-modified timestamp ────────────────────────────────────────
if (fs.existsSync(envPath)) {
  const stat = fs.statSync(envPath);
  console.log(`\n[5] .env last modified : ${stat.mtime.toISOString()}`);
  console.log(`    (Server restart is a manual step — compare this timestamp`);
  console.log(`     to when you last ran 'node server.js' to confirm reload)`);
}

// ── 6 & 7. Which path would be taken for verification? ─────────────────────
console.log('\n[6 & 7] Verification execution path:');
if (keyPresent) {
  console.log('  → fetchYouTubeComments() will be called  [REAL YouTube Data API v3]');
  console.log('  → Execution path: process.env.YOUTUBE_API_KEY is TRUTHY → real API branch');
} else {
  console.log('  → getMockYouTubeComments() will be called  [MOCK DATA]');
  console.log('  → Execution path: process.env.YOUTUBE_API_KEY is FALSY  → mock fallback branch');
}

console.log('\n=====================================\n');
