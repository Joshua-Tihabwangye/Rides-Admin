import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const indexPath = path.join(distDir, "index.html");

function fail(message) {
  throw new Error(`[admin-build] ${message}`);
}

function pass(message) {
  console.log(`[admin-build] ${message}`);
}

if (!fs.existsSync(indexPath)) {
  fail("dist/index.html is missing. Run npm run build before verification.");
}

const index = fs.readFileSync(indexPath, "utf8");
const assetRefs = Array.from(index.matchAll(/(?:src|href)="([^"]+)"/g)).map((match) => match[1]);
const localAssetRefs = assetRefs.filter((ref) => ref.startsWith("/assets/"));
const jsRefs = localAssetRefs.filter((ref) => ref.endsWith(".js"));
const cssRefs = localAssetRefs.filter((ref) => ref.endsWith(".css"));

if (index.includes("/src/main") || index.includes("/src/styles")) {
  fail("production index still references raw /src files.");
}

if (jsRefs.length === 0) {
  fail("production index does not reference a bundled JavaScript asset.");
}

if (cssRefs.length === 0) {
  fail("production index does not reference a bundled CSS asset.");
}

for (const ref of localAssetRefs) {
  const assetPath = path.join(distDir, ref.replace(/^\/+/, ""));
  if (!fs.existsSync(assetPath)) {
    fail(`referenced asset is missing: ${ref}`);
  }
}

const cssBytes = cssRefs.reduce((sum, ref) => {
  const assetPath = path.join(distDir, ref.replace(/^\/+/, ""));
  return sum + fs.statSync(assetPath).size;
}, 0);

if (cssBytes < 1024) {
  fail("bundled CSS is unexpectedly small; Tailwind/admin styles may be missing.");
}

pass(`verified ${jsRefs.length} JS asset(s), ${cssRefs.length} CSS asset(s), ${localAssetRefs.length} total local asset references.`);
