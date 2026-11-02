#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = ["src", "test", "scripts"];
const ROOT_CONFIG_FILES = ["babel.config.js", "metro.config.js", "tailwind.config.js", "tsconfig.json"];

function getAllFiles() {
  const files = [];
  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    walk(fullDir, files);
  }
  for (const file of ROOT_CONFIG_FILES) {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
}

function getScriptKind(fileName) {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  if (fileName.endsWith(".mjs")) return ts.ScriptKind.ES;
  return ts.ScriptKind.JS;
}

function mergeRanges(ranges) {
  if (ranges.length === 0) return [];
  const sorted = ranges.slice().sort((a, b) => a.pos - b.pos);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.pos <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function isTripleSlashDirective(source, start, end) {
  const commentText = source.slice(start, end).trimLeft();
  return commentText.startsWith("///") && (commentText.includes("<reference") || commentText.includes("<amd"));
}

function removeComments(source, fileName) {
  const scriptKind = getScriptKind(fileName);
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);

  const comments = [];

  function collectComments(node) {
    const leading = ts.getLeadingCommentRanges(source, node.pos);
    if (leading) {
      for (const c of leading) {
        if (!isTripleSlashDirective(source, c.pos, c.end)) comments.push(c);
      }
    }
    const trailing = ts.getTrailingCommentRanges(source, node.end);
    if (trailing) {
      for (const c of trailing) {
        if (!isTripleSlashDirective(source, c.pos, c.end)) comments.push(c);
      }
    }
    ts.forEachChild(node, collectComments);
  }

  collectComments(sourceFile);

  if (comments.length === 0) return { source, removed: 0 };

  const merged = mergeRanges(comments);
  let result = source;
  let removed = 0;

  for (const range of merged.reverse()) {
    const start = range.pos;
    const end = range.end;

    const before = result.slice(0, start);
    const after = result.slice(end);
    result = before + after;
    removed++;
  }

  const lines = result.split("\n");
  const filtered = [];
  let prevBlank = false;
  for (const line of lines) {
    const trimmed = line.trimEnd();
    const isBlank = trimmed.length === 0;
    if (isBlank && prevBlank) continue;
    filtered.push(trimmed);
    prevBlank = isBlank;
  }

  while (filtered.length > 0 && filtered[filtered.length - 1].trim() === "") {
    filtered.pop();
  }

  let finalSource = filtered.join("\n");

  if (filtered.length > 0 && filtered[0].startsWith("#!")) {
    const shebang = filtered[0];
    const rest = filtered.slice(1).join("\n");
    finalSource = shebang + "\n" + rest;
  }

  return { source: finalSource, removed };
}

function processFile(filePath, checkOnly) {
  const source = fs.readFileSync(filePath, "utf8");
  const { source: cleaned, removed } = removeComments(source, filePath);
  if (checkOnly) {
    return { file: path.relative(ROOT, filePath), removed };
  }
  if (removed > 0 || cleaned !== source) {
    fs.writeFileSync(filePath, cleaned, "utf8");
  }
  return { file: path.relative(ROOT, filePath), removed };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const files = getAllFiles();

  let totalRemoved = 0;
  const results = [];

  for (const file of files) {
    const result = processFile(file, checkOnly);
    if (result.removed > 0) {
      results.push(result);
      totalRemoved += result.removed;
    }
  }

  if (checkOnly) {
    if (totalRemoved > 0) {
      for (const r of results) {
        console.log(`${r.file}: ${r.removed} comment(s)`);
      }
      console.log(`Total comments found: ${totalRemoved}`);
      process.exit(1);
    } else {
      console.log("No comments found");
      process.exit(0);
    }
  } else {
    console.log(`Processed ${files.length} files, removed ${totalRemoved} comment(s)`);
    for (const r of results) {
      console.log(`  ${r.file}: ${r.removed}`);
    }
  }
}

main();