/**
 * DEEP DIAGNOSTIC — Read-only. No source files modified.
 * Analyzes YOUTUBE_API_KEY at runtime vs raw .env file.
 */

const path = require('path');
const fs   = require('fs');
const envPath = path.resolve(process.cwd(), '.env');

require('dotenv').config({ path: envPath });

const runtimeKey = process.env.YOUTUBE_API_KEY || '';

console.log('\n======= YOUTUBE_API_KEY Deep Diagnostic =======\n');

// ── 1. Runtime length ─────────────────────────────────────────────────────
console.log(`[1] Runtime length : ${runtimeKey.length} characters`);

// ── 2. Character codes for each position ─────────────────────────────────
console.log('\n[2] Character codes per position:');
console.log('    Pos | Char (masked) | Code | Hex');
console.log('    ----|---------------|------|-----');
for (let i = 0; i < runtimeKey.length; i++) {
  const ch   = runtimeKey[i];
  const code = runtimeKey.charCodeAt(i);
  // Mask middle characters, show first 6 and last 4
  const show = (i < 6 || i >= runtimeKey.length - 4) ? ch : '*';
  console.log(`    ${String(i).padStart(3)} | ${show.padEnd(13)} | ${String(code).padStart(4)} | 0x${code.toString(16).padStart(2,'0').toUpperCase()}`);
}

// ── 3. Special character checks ────────────────────────────────────────────
console.log('\n[3] Special character presence:');
console.log(`    Contains newline (\\n)        : ${runtimeKey.includes('\n')}`);
console.log(`    Contains carriage return (\\r): ${runtimeKey.includes('\r')}`);
console.log(`    Contains tab (\\t)            : ${runtimeKey.includes('\t')}`);
console.log(`    Contains double quote (")    : ${runtimeKey.includes('"')}`);
console.log(`    Contains single quote (')    : ${runtimeKey.includes("'")}`);
console.log(`    Contains space               : ${runtimeKey.includes(' ')}`);
console.log(`    Contains hash (#)            : ${runtimeKey.includes('#')}`);
console.log(`    Contains null byte (\\0)      : ${runtimeKey.includes('\0')}`);

// ── 4. Raw .env comparison ─────────────────────────────────────────────────
console.log('\n[4] Raw .env file analysis:');
if (!fs.existsSync(envPath)) {
  console.log('    .env file NOT FOUND at: ' + envPath);
} else {
  const rawEnv = fs.readFileSync(envPath, 'utf8');
  const lines  = rawEnv.split('\n');

  let rawLineValue = null;
  let rawLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('YOUTUBE_API_KEY')) {
      rawLineValue = line;
      rawLineIndex = i + 1;
      break;
    }
  }

  if (rawLineValue === null) {
    console.log('    YOUTUBE_API_KEY line NOT FOUND in .env');
  } else {
    // Extract the raw value after the = sign
    const eqIdx   = rawLineValue.indexOf('=');
    const rawVal  = eqIdx !== -1 ? rawLineValue.slice(eqIdx + 1) : '';

    // Strip any surrounding quotes that dotenv handles
    const stripped = rawVal.replace(/^["']|["']$/g, '').replace(/\r$/, '');

    console.log(`    .env line number            : ${rawLineIndex}`);
    console.log(`    Raw line length (full line) : ${rawLineValue.length} chars`);
    console.log(`    Raw value after '='         : ${rawVal.length} chars`);
    console.log(`    After stripping quotes/\\r   : ${stripped.length} chars`);
    console.log(`    Runtime value length        : ${runtimeKey.length} chars`);
    console.log(`    Match (stripped vs runtime) : ${stripped === runtimeKey}`);

    // Check if raw value contains a # (dotenv strips from # onward as a comment)
    const hashIdx = rawVal.indexOf('#');
    if (hashIdx !== -1) {
      console.log(`\n    ⚠️  HASH (#) found in raw .env value at position ${hashIdx}`);
      console.log(`    dotenv treats everything after # as a comment.`);
      console.log(`    Raw length before #: ${hashIdx}`);
      console.log(`    This is WHY runtime key is shorter than the raw value!`);
    }

    // Check for inline comment
    const spaceHashIdx = rawVal.search(/ #|#/);
    if (spaceHashIdx !== -1 && hashIdx !== -1) {
      console.log(`    Full raw value (masked)     : ${rawVal.slice(0,6)}...[MASKED]...${rawVal.slice(-4)}`);
    }

    // Show raw char codes for non-printable characters
    const nonPrintable = [];
    for (let i = 0; i < rawVal.length; i++) {
      const c = rawVal.charCodeAt(i);
      if (c < 32 || c === 127) {
        nonPrintable.push({ pos: i, code: c, hex: '0x' + c.toString(16).toUpperCase() });
      }
    }
    if (nonPrintable.length > 0) {
      console.log(`\n    ⚠️  Non-printable characters found in raw .env value:`);
      nonPrintable.forEach(n => console.log(`       Position ${n.pos}: code=${n.code} (${n.hex})`));
    } else {
      console.log(`    Non-printable chars in raw  : None`);
    }
  }
}

// ── 5. Explanation of truncation ───────────────────────────────────────────
console.log('\n[5] Why a 39-char .env key becomes shorter at runtime:');
console.log('    dotenv parses values and strips inline comments starting with #.');
console.log('    If your .env line looks like:');
console.log('        YOUTUBE_API_KEY=AIzaSy...key...  # added June 2025');
console.log('    dotenv will stop reading at the first unquoted # character.');
console.log('    To include a # in a value, wrap the value in quotes:');
console.log('        YOUTUBE_API_KEY="AIzaSy...full_key..."');
console.log('    Or ensure no # appears after the key value.');

console.log('\n================================================\n');
