#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const backendRoot = path.resolve("../EVzone-Ride-Backend");
const openApiPath = path.join(backendRoot, "docs", "openapi.json");
const backendManifestPath = path.join(backendRoot, "contracts", "delivery-contract-manifest.json");
const outputPath = path.resolve("src", "contracts", "backend.v1.ts");
const manifestOutputDir = path.resolve("src", "contracts");
const manifestOutputPath = path.join(manifestOutputDir, "delivery-contract-manifest.json");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://evzone:evzone-group@localhost:5432/evzone",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "openapi:export"], { cwd: backendRoot });
run("npx", ["openapi-typescript", openApiPath, "-o", outputPath], { cwd: process.cwd() });

mkdirSync(manifestOutputDir, { recursive: true });
copyFileSync(backendManifestPath, manifestOutputPath);
