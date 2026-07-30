#!/usr/bin/env node
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const backendRoot = path.resolve("../EVzone-Ride-Backend");
const backendManifestPath = path.join(backendRoot, "contracts", "delivery-contract-manifest.json");
const manifestOutputDir = path.resolve("src", "contracts");
const manifestOutputPath = path.join(manifestOutputDir, "delivery-contract-manifest.json");

mkdirSync(manifestOutputDir, { recursive: true });
copyFileSync(backendManifestPath, manifestOutputPath);

console.log(`Copied delivery contract manifest to ${manifestOutputPath}`);
