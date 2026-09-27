#!/usr/bin/env node
// The description-budget check.
//
// Claude Code keeps every installed skill's `name` + `description` resident in
// every session, in a listing budgeted at roughly 1% of the context window;
// descriptions past the budget are dropped or cut. Caps: 400 per description,
// 8,000 for the set, leaving room for built-in and project skills.
//
// No YAML library: a silently mis-parsed description is worse than a failure
// (an unquoted `: ` makes YAML read a nested mapping, and the file is then not
// a skill at all). This script implements a strict subset of frontmatter
// scalars and refuses anything outside it as a parse error, naming the line.
//
// Skills with `disable-model-invocation: true` are left out of the set total:
// their description is not in context. They are still parsed and still held to
// the per-description cap. The key must be the plain scalar `true` or `false`:
// `yes`, `on` or a quoted "true" is a boolean in one YAML version and a string
// in another.
//
// Exit 1 on any failure. It fails the build; it is not advisory.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { skillDirs } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// See header.
const PER_DESCRIPTION_CAP = 400;
const SET_TOTAL_CAP = 8000;

// The canary fixtures live outside `skills/` on purpose: skillDirs() and the
// distribution CLI both walk `skills/`, so a fixture living there would be
// discovered as a real (broken) skill by every consumer, including
// `npm run check`. Keeping them under scripts/fixtures/ means only this
// script ever reads them.
const FIXTURES = join(ROOT, "scripts", "fixtures", "description-budget");

const KEY = /^([A-Za-z][A-Za-z0-9_-]*):(.*)$/;

const MANUAL_ONLY_KEY = "disable-model-invocation";

/**
 * Unquote a double-quoted scalar body (without its surrounding quotes).
 * Refuses any escape other than \" and \\, and an unterminated quote.
 */
function unquoteDouble(body, ctx) {
  let out = "";
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === "\\") {
      const next = body[i + 1];
      if (next === '"' || next === "\\") {
        out += next;
        i += 1;
        continue;
      }
      throw new Error(`${ctx}: unsupported escape \\${next ?? ""} in double-quoted value`);
    }
    if (ch === '"') throw new Error(`${ctx}: unterminated double-quoted value`);
    out += ch;
  }
  return out;
}

/** Unquote a single-quoted scalar body: `''` is a literal single quote. */
function unquoteSingle(body, ctx) {
  let out = "";
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === "'") {
      if (body[i + 1] === "'") {
        out += "'";
        i += 1;
        continue;
      }
      throw new Error(`${ctx}: unterminated single-quoted value`);
    }
    out += body[i];
  }
  return out;
}

/**
 * Parse one scalar value (the raw text after `key:`), already trimmed of its
 * single leading space if present. Returns the parsed string or throws.
 */
function parseScalar(raw, ctx) {
  if (raw.startsWith('"')) {
    if (!raw.endsWith('"') || raw.length < 2) throw new Error(`${ctx}: unterminated double-quoted value`);
    return unquoteDouble(raw.slice(1, -1), ctx);
  }
  if (raw.startsWith("'")) {
    // A trailing `'` is not sufficient on its own — `''` at the very end could
    // be an escaped quote closing on the following (absent) character, so
    // walk it properly rather than trust slice(1,-1).
    if (raw.length < 2 || !raw.endsWith("'")) throw new Error(`${ctx}: unterminated single-quoted value`);
    const body = raw.slice(1, -1);
    // Re-walk to confirm the closing quote we sliced off is really a
    // terminator, not the second half of a `''` pair straddling the end.
    let i = 0;
    let closed = false;
    while (i < body.length) {
      if (body[i] === "'") {
        if (body[i + 1] === "'") {
          i += 2;
          continue;
        }
        closed = true;
        break;
      }
      i += 1;
    }
    if (closed) throw new Error(`${ctx}: unterminated single-quoted value`);
    return unquoteSingle(body, ctx);
  }

  // Plain scalar.
  if (raw === "") throw new Error(`${ctx}: empty value`);
  if (raw.includes(": ")) throw new Error(`${ctx}: contains ": " — YAML reads this as a nested mapping`);
  if (raw.endsWith(":")) throw new Error(`${ctx}: ends with ":" — YAML reads this as a nested mapping`);
  if (raw.includes(" #")) throw new Error(`${ctx}: contains " #" — starts a YAML comment, silently truncating the value`);
  if (/^[\[{*&!|>'"%@`]/.test(raw)) {
    throw new Error(`${ctx}: starts with a YAML indicator character (${raw[0]})`);
  }
  if (raw.startsWith("- ") || raw.startsWith("? ")) {
    throw new Error(`${ctx}: starts with "${raw.slice(0, 2)}" — a YAML block-sequence or mapping-key indicator`);
  }
  return raw;
}

/**
 * Strict-subset frontmatter parse: a `---` fence at file start, then one
 * `key: value` per non-blank line, plain/double/single-quoted scalars only.
 * Anything else — block scalars, nested maps, lists, duplicate keys,
 * continuation or indented lines — is a parse error naming the line.
 */
function parseFrontmatter(text, label) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") throw new Error(`${label}: does not start with a "---" frontmatter fence`);

  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error(`${label}: no closing "---" fence`);

  const fields = new Map();
  for (let i = 1; i < end; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;
    const ctx = `${label}:${lineNo}`;
    if (line.trim() === "") continue;

    if (/^\s/.test(line)) {
      throw new Error(`${ctx}: indented or continuation line — not a supported frontmatter shape`);
    }

    const m = line.match(KEY);
    if (!m) throw new Error(`${ctx}: not a "key: value" line: ${line.slice(0, 60)}`);
    const [, key, rest] = m;

    if (fields.has(key)) throw new Error(`${ctx}: duplicate key "${key}"`);

    // Require exactly one leading space between "key:" and the value, or no
    // value at all — anything else (no space, or more than one) is outside
    // the supported plain/quoted-scalar-on-one-line shape.
    let raw = rest;
    if (raw === "") {
      throw new Error(`${ctx}: key "${key}" has no value on its line — block scalars are not supported`);
    }
    if (!raw.startsWith(" ")) {
      throw new Error(`${ctx}: key "${key}" is not followed by a space before its value`);
    }
    raw = raw.slice(1);
    if (raw.startsWith(" ")) {
      throw new Error(`${ctx}: key "${key}" has more than one space before its value`);
    }

    if (key === MANUAL_ONLY_KEY && raw !== "true" && raw !== "false") {
      throw new Error(
        `${ctx}: ${MANUAL_ONLY_KEY} must be the plain scalar true or false, not ${raw.slice(0, 20)}`,
      );
    }

    fields.set(key, parseScalar(raw, ctx));
  }

  return fields;
}

/** Parse one SKILL.md's frontmatter and validate `name` and `description`. */
function checkFile(path, label, { expectDirName } = {}) {
  const text = readFileSync(path, "utf8");
  const fields = parseFrontmatter(text, label);

  const name = fields.get("name");
  const description = fields.get("description");
  if (name === undefined) throw new Error(`${label}: missing "name"`);
  if (description === undefined) throw new Error(`${label}: missing "description"`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`${label}: name "${name}" does not match ^[a-z0-9]+(-[a-z0-9]+)*$`);
  }
  if (expectDirName !== undefined && name !== expectDirName) {
    throw new Error(`${label}: name "${name}" does not match its directory "${expectDirName}"`);
  }

  const chars = [...description].length;
  const manualOnly = fields.get(MANUAL_ONLY_KEY) === "true";
  return { name, description, chars, manualOnly };
}

// ---------------------------------------------------------------------------
// Canary: run on every invocation, before the real check. If any canary is
// NOT refused for the reason it exists to test — or, for `manual-only`, NOT
// read as left out of the set total — the gate is blind and every PASS below
// is meaningless.
// ---------------------------------------------------------------------------

function runCanaries() {
  let blind = false;

  const overCapPath = join(FIXTURES, "over-cap", "SKILL.md");
  const overCapText = readFileSync(overCapPath, "utf8");
  const overCapFields = parseFrontmatter(overCapText, "canary/over-cap/SKILL.md");
  const overCapDescription = overCapFields.get("description");
  if (overCapDescription === undefined) {
    console.log("BLIND canary/over-cap: fixture has no description at all — cannot test the length cap");
    blind = true;
  } else {
    const chars = [...overCapDescription].length;
    if (chars !== PER_DESCRIPTION_CAP + 1) {
      console.log(
        `BLIND canary/over-cap: fixture description is ${chars} chars, expected exactly ` +
          `${PER_DESCRIPTION_CAP + 1} — the fixture was edited and no longer tests the cap`,
      );
      blind = true;
    } else {
      let result;
      try {
        result = checkFile(overCapPath, "canary/over-cap/SKILL.md", { expectDirName: "over-cap" });
      } catch (err) {
        console.log(`BLIND canary/over-cap: fixture failed to parse at all — ${err.message}`);
        blind = true;
        result = null;
      }
      if (result && result.chars <= PER_DESCRIPTION_CAP) {
        console.log(
          `BLIND canary/over-cap: fixture measured at ${result.chars} chars, not over the ` +
            `${PER_DESCRIPTION_CAP}-char cap — an over-cap description was NOT refused`,
        );
        blind = true;
      } else if (result) {
        console.log(`canary/over-cap: measured over the ${PER_DESCRIPTION_CAP}-char cap, as expected (${chars} chars)`);
      }
    }
  }

  const colonSpacePath = join(FIXTURES, "colon-space", "SKILL.md");
  try {
    const fields = parseFrontmatter(readFileSync(colonSpacePath, "utf8"), "canary/colon-space/SKILL.md");
    console.log(
      `BLIND canary/colon-space: a description containing ": " was NOT refused ` +
        `(parsed as "${fields.get("description")}")`,
    );
    blind = true;
  } catch (err) {
    if (!/": "/.test(err.message)) {
      console.log(`BLIND canary/colon-space: refused, but not for the ": " reason — ${err.message}`);
      blind = true;
    } else {
      console.log(`canary/colon-space: refused as a parse error, as expected`);
    }
  }

  const badValuePath = join(FIXTURES, "manual-only-bad-value", "SKILL.md");
  try {
    parseFrontmatter(readFileSync(badValuePath, "utf8"), "canary/manual-only-bad-value/SKILL.md");
    console.log(`BLIND canary/manual-only-bad-value: ${MANUAL_ONLY_KEY}: yes was NOT refused`);
    blind = true;
  } catch (err) {
    if (!err.message.includes(MANUAL_ONLY_KEY)) {
      console.log(`BLIND canary/manual-only-bad-value: refused, but not for the ${MANUAL_ONLY_KEY} reason — ${err.message}`);
      blind = true;
    } else {
      console.log(`canary/manual-only-bad-value: refused as a parse error, as expected`);
    }
  }

  const manualOnlyPath = join(FIXTURES, "manual-only", "SKILL.md");
  try {
    const r = checkFile(manualOnlyPath, "canary/manual-only/SKILL.md", { expectDirName: "manual-only" });
    if (!r.manualOnly) {
      console.log(`BLIND canary/manual-only: ${MANUAL_ONLY_KEY}: true was NOT read — it would be counted in the set total`);
      blind = true;
    } else {
      console.log(`canary/manual-only: read as left out of the set total, as expected`);
    }
  } catch (err) {
    console.log(`BLIND canary/manual-only: fixture failed to parse at all — ${err.message}`);
    blind = true;
  }

  if (blind) {
    console.log("\nThe gate is blind: at least one canary was not refused for the reason it tests.");
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// The real check.
// ---------------------------------------------------------------------------

runCanaries();

const results = [];
const failures = [];

for (const { name, dir } of skillDirs(ROOT)) {
  const path = join(dir, "SKILL.md");
  const label = `skills/${name}/SKILL.md`;
  try {
    const r = checkFile(path, label, { expectDirName: name });
    results.push(r);
    if (r.chars > PER_DESCRIPTION_CAP) {
      failures.push(`${label}: description is ${r.chars} chars, over the ${PER_DESCRIPTION_CAP}-char cap`);
    }
  } catch (err) {
    failures.push(err.message);
  }
}

const listed = results.filter((r) => !r.manualOnly);
const manualOnly = results.filter((r) => r.manualOnly);
const total = listed.reduce((n, r) => n + r.chars, 0);
if (total > SET_TOTAL_CAP) {
  failures.push(`set total: ${total} chars across ${listed.length} skill(s), over the ${SET_TOTAL_CAP}-char cap`);
}

console.log("");
for (const f of failures) console.log(`FAIL ${f}`);

console.log(
  `\n${failures.length ? "FAIL" : "PASS"} description-budget: ${results.length} skill(s) parsed, ` +
    `${failures.length} failure(s). Set total ${total} / ${SET_TOTAL_CAP} chars over ${listed.length} skill(s).`,
);
if (manualOnly.length) {
  console.log(
    `Left out of the set total, ${MANUAL_ONLY_KEY}: true: ` +
      `${manualOnly.map((r) => `${r.name} (${r.chars})`).join(", ")}.`,
  );
}

if (process.argv.includes("--report")) {
  const sorted = [...results].sort((a, b) => b.chars - a.chars);
  const pad = Math.max(...sorted.map((r) => r.name.length), 5);
  const col = (s) => String(s).padStart(12);
  console.log(`\n${"skill".padEnd(pad)}  ${col("description")}  ${col("name+desc")}  ${col("headroom")}`);
  for (const r of sorted) {
    const nameDesc = r.chars + [...r.name].length;
    const headroom = PER_DESCRIPTION_CAP - r.chars;
    const mark = r.manualOnly ? "  not in total" : "";
    console.log(`${r.name.padEnd(pad)}  ${col(r.chars)}  ${col(nameDesc)}  ${col(headroom)}${mark}`);
  }
  console.log(`${"".padEnd(pad, "-")}  ${col("---")}  ${col("---")}  ${col("---")}`);
  console.log(
    `${"total".padEnd(pad)}  ${col(total)}  ${col(total + listed.reduce((n, r) => n + [...r.name].length, 0))}  ${col("")}`,
  );
}

console.log(`
What this check does not decide:
  - whether a description still makes its skill fire — the firing harness in
    dulguun0225/skills (\`npm run firing\`) is the only thing that reads that,
    and it costs money
  - whether a trigger was lost in a rewrite that stayed under the cap — that is
    a diff, read by a person
  - the harness's real budget, which scales with the context window and is not
    published as a constant; 400 and 8,000 here are this repo's own choice
  - skills installed from other repos sharing the same listing
  - whether a client honours ${MANUAL_ONLY_KEY}; the set total leaves those
    skills out on the Claude Code docs' word, and a client
    that lists their descriptions anyway pays more than this total says
  - full YAML — it accepts a strict subset and refuses the rest, so a valid-YAML
    description using a block scalar, an anchor or a flow collection fails
    here by design
`);

process.exit(failures.length ? 1 : 0);
