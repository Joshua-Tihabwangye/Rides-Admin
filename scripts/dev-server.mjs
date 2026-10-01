import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const root = process.cwd();
const viteBinary = resolve(root, "node_modules", ".bin", "vite");
const restartFiles = [
  "package.json",
  "package-lock.json",
  "tailwind.config.cjs",
  "postcss.config.cjs",
  ".env",
  ".env.local",
  ".env.development",
].map((file) => resolve(root, file));

let child;
let stopping = false;
let restartTimer;
let restarting = false;

function portIsAvailable(port, host = "127.0.0.1") {
  return new Promise((resolvePort) => {
    const probe = createServer();
    probe.once("error", () => resolvePort(false));
    probe.once("listening", () => probe.close(() => resolvePort(true)));
    probe.listen({ port, host, exclusive: true });
  });
}

async function start(force = false) {
  if (!force && !(await portIsAvailable(5176))) {
    process.stdout.write(
      "[dev] Port 5176 is already in use. The admin dev server is already running at http://localhost:5176.\n",
    );
    process.exitCode = 0;
    return false;
  }

  child = spawn(process.execPath, [viteBinary, ...(force ? ["--force"] : [])], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  child.once("exit", (code, signal) => {
    if (stopping) return;
    if (restarting) {
      restarting = false;
      void start(true);
      return;
    }
    process.exitCode = code ?? (signal ? 1 : 0);
  });
  return true;
}

function restart(file) {
  if (stopping || restarting || restartTimer) return;
  restartTimer = setTimeout(() => {
    restartTimer = undefined;
    process.stdout.write(`\n[dev] ${file} changed; rebuilding Vite dependencies...\n`);
    if (!child || child.exitCode !== null) {
      void start(true);
      return;
    }
    restarting = true;
    child.kill("SIGTERM");
  }, 150);
}

for (const file of restartFiles) {
  if (!existsSync(file)) continue;
  watch(file, { persistent: false }, () => restart(file.replace(`${root}/`, "")));
}

function stop(signal) {
  stopping = true;
  if (child && child.exitCode === null) child.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

void start();
