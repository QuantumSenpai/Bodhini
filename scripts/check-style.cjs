#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = ["src", "test", "scripts"];
const ROOT_CONFIG_FILES = ["babel.config.js", "metro.config.js", "tailwind.config.js", "tsconfig.json"];
const EXTRA_FILES = ["README.md"];

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
  for (const file of EXTRA_FILES) {
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
    } else if (/\.(ts|tsx|js|cjs|mjs|json|md)$/.test(entry.name)) {
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

function checkComments(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!/\.(ts|tsx|js|cjs|mjs)$/.test(filePath)) return [];

  const scriptKind = getScriptKind(filePath);
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);

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

  if (comments.length === 0) return [];

  const merged = mergeRanges(comments);
  const results = [];

  for (const range of merged) {
    const start = range.pos;
    const line = source.substring(0, start).split("\n").length;
    results.push({ file: path.relative(ROOT, filePath), line, type: "comment" });
  }

  return results;
}

function checkDashes(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const results = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line.charCodeAt(j);
      if (ch === 0x2013 || ch === 0x2014) {
        results.push({ file: path.relative(ROOT, filePath), line: i + 1, type: "dash", char: ch === 0x2013 ? "en-dash" : "em-dash" });
      }
    }
  }

  return results;
}

function main() {
  const files = getAllFiles();
  let hasIssues = false;

  for (const file of files) {
    const commentIssues = checkComments(file);
    for (const issue of commentIssues) {
      console.log(`${issue.file}:${issue.line}: comment`);
      hasIssues = true;
    }

    const dashIssues = checkDashes(file);
    for (const issue of dashIssues) {
      console.log(`${issue.file}:${issue.line}: ${issue.type} (${issue.char})`);
      hasIssues = true;
    }
  }

  if (hasIssues) {
    process.exit(1);
  } else {
    console.log("No style issues found");
    process.exit(0);
  }
}

main();