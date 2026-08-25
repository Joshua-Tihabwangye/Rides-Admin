#!/usr/bin/env node
/**
 * Scan the Rides-Admin source for delivery API route strings and verify that
 * every route used is declared in the delivery contract manifest. Fails CI if
 * an undeclared delivery route is detected.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const manifestPath = path.resolve(repoRoot, "src", "contracts", "delivery-contract-manifest.json");
const srcDir = path.resolve(repoRoot, "src");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const declaredRoutes = new Set(
  manifest.routes.map((route) => `${route.method} ${normalizePath(route.path)}`),
);

const deliveryPathPrefixes = [
  "/api/v1/drivers/me/delivery",
  "/api/v1/deliveries",
  "/api/v1/delivery-routes",
  "/api/v1/agent/delivery-labels",
  "/api/v1/universal-dispatch/drivers/deliveries",
  "/api/v1/admin/deliveries",
  "/api/v1/admin/delivery-packages",
  "/api/v1/admin/delivery-labels",
  "/api/v1/admin/pricing/deliveries",
];

const ignoredPatterns = [
  /operations\.control/,
  /infrastructure\.lifecycles/,
  /openapi/,
  /swagger/,
];

function normalizePath(value) {
  return value
    .replace(/\/api\/v1/g, "")
    .replace(/\/[0-9a-fA-F-]{36}/g, "/{id}")
    .replace(/\/[0-9]+/g, "/{id}")
    .replace(/\/[a-zA-Z0-9_-]{20,}/g, "/{id}");
}

function isDeliveryPath(value) {
  if (!value || typeof value !== "string") return false;
  if (!value.startsWith("/api/v1/")) return false;
  if (ignoredPatterns.some((pattern) => pattern.test(value))) return false;
  return deliveryPathPrefixes.some((prefix) => value.startsWith(prefix));
}

function extractPotentialPaths(content) {
  const paths = new Set();
  const patterns = [
    // string literals
    /['"`](\/api\/v1\/(?:deliver(?:y|ies)|delivery-routes|drivers\/me\/delivery|agent\/delivery-labels|universal-dispatch\/drivers\/deliveries|admin\/deliver(?:y|ies)|admin\/delivery-(?:packages|labels)|admin\/pricing\/deliveries)[^'"`]*?)['"`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const raw = match[1];
      if (isDeliveryPath(raw)) {
        paths.add(normalizePath(raw));
      }
    }
  }

  return [...paths];
}

function walk(dir, callback) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === "build") continue;
      walk(fullPath, callback);
    } else if (stats.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      callback(fullPath);
    }
  }
}

const undeclared = [];
const checked = new Set();

walk(srcDir, (filePath) => {
  const content = readFileSync(filePath, "utf8");
  const paths = extractPotentialPaths(content);
  for (const normalizedPath of paths) {
    if (checked.has(normalizedPath)) continue;
    checked.add(normalizedPath);

    const declared = [...declaredRoutes].some((route) => route.endsWith(normalizedPath));
    if (!declared) {
      undeclared.push({ file: path.relative(repoRoot, filePath), path: normalizedPath });
    }
  }
});

if (undeclared.length > 0) {
  console.error(`Undeclared delivery routes detected (${undeclared.length}):`);
  for (const item of undeclared) {
    console.error(`  ${item.path} in ${item.file}`);
  }
  process.exit(1);
}

console.log(`Delivery contract manifest OK: ${checked.size} delivery route references declared.`);
