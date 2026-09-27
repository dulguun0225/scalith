// Shared markdown reading for the two wired checks. Deliberately small: both
// checks parse headings and link targets and nothing else, and a dependency
// here would be a dependency in the only gates this repo hosts.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every `skills/<name>/` directory holding a SKILL.md, flat layout only. */
export function skillDirs(root) {
  const base = join(root, "skills");
  return readdirSync(base)
    .filter((name) => !name.startsWith("."))
    .map((name) => ({ name, dir: join(base, name) }))
    .filter(({ dir }) => statSync(dir).isDirectory())
    .filter(({ dir }) => fileExists(join(dir, "SKILL.md")));
}

export function fileExists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

/** Markdown files inside a skill dir, one level deep. */
export function markdownFiles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({ name, path: join(dir, name) }));
}

/**
 * Lines of a file with fenced code blocks blanked out. Both checks match
 * patterns that occur legitimately inside code samples, so the fence strip is
 * not an optimisation — it is the difference between a gate and a nuisance.
 */
export function linesOutsideFences(text) {
  const out = [];
  let fence = null;
  for (const raw of text.split("\n")) {
    const marker = raw.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (fence === null) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      out.push("");
      continue;
    }
    out.push(fence === null ? raw : "");
  }
  return out;
}

/** ATX headings outside code fences, with their level, text and 1-based line. */
export function headings(text) {
  const found = [];
  linesOutsideFences(text).forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    if (m) found.push({ level: m[1].length, text: m[2], line: i + 1 });
  });
  return found;
}

/** Compare heading text the way a reader does: case, emphasis and code ticks are noise. */
export function normalize(heading) {
  return heading
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
