import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const frontendRoots = [path.join(sourceRoot, "components")];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const violations = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (allowedExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function checkFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const forbiddenPatterns = [
    /from\s+["']@\/server(?:\/|["'])/g,
    /import\s*\(\s*["']@\/server(?:\/|["'])/g,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      violations.push(`frontend imports server internals: ${path.relative(root, file)}`);
      break;
    }
  }
}

function dynamicSegmentKind(name) {
  if (/^\[\[\.\.\.[^\]]+\]\]$/.test(name)) return "optional-catch-all";
  if (/^\[\.\.\.[^\]]+\]$/.test(name)) return "catch-all";
  if (/^\[[^\]]+\]$/.test(name)) return "dynamic";
  return null;
}

function checkDynamicRouteSiblings(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const dynamicEntries = entries
    .map((entry) => ({ name: entry.name, kind: dynamicSegmentKind(entry.name) }))
    .filter((entry) => entry.kind);

  const byKind = new Map();
  for (const entry of dynamicEntries) {
    const names = byKind.get(entry.kind) ?? [];
    names.push(entry.name);
    byKind.set(entry.kind, names);
  }

  for (const [kind, names] of byKind) {
    const unique = [...new Set(names)];
    if (unique.length > 1) {
      violations.push(
        `conflicting ${kind} slug names under ${path.relative(root, dir)}: ${unique.join(", ")}`,
      );
    }
  }

  for (const entry of entries) checkDynamicRouteSiblings(path.join(dir, entry.name));
}

for (const dir of frontendRoots) {
  for (const file of walk(dir)) checkFile(file);
}

// App UI files are frontend too; API route handlers are the only app files allowed to import server code.
for (const file of walk(path.join(sourceRoot, "app"))) {
  if (file.includes(`${path.sep}app${path.sep}api${path.sep}`)) continue;
  checkFile(file);
}

// Next.js requires one canonical slug name for the same dynamic path segment.
// Example rejected by Next.js: /subscriptions/[ref] and /subscriptions/[refCode].
checkDynamicRouteSiblings(path.join(sourceRoot, "app"));

if (violations.length) {
  console.error("Architecture check failed:");
  for (const violation of violations) console.error(` - ${violation}`);
  process.exit(1);
}

console.log("Architecture checks OK: frontend/server boundaries and dynamic route slugs are valid.");
