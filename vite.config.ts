import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json" with { type: "json" };
import { execSync } from "node:child_process";

function gitSha() {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

/**
 * MUI and Emotion keep runtime module state. Replacing only part of an active
 * graph can leave an open page with components from two runtimes: DOM renders,
 * but page-level sx rules are absent. Reload the document for source changes
 * in development instead of attempting partial HMR updates.
 */
function reloadDocumentForAdminSourceChanges(): Plugin {
  const sourceDirectory = `${process.cwd()}/src/`;

  return {
    name: "evzone-reload-document-for-admin-source-changes",
    apply: "serve",
    handleHotUpdate(context) {
      if (!context.file.startsWith(sourceDirectory)) return;

      const invalidated = new Set();
      for (const module of context.modules) {
        context.server.moduleGraph.invalidateModule(
          module,
          invalidated,
          context.timestamp,
          true,
        );
      }
      context.server.ws.send({ type: "full-reload" });
      return [];
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), reloadDocumentForAdminSourceChanges()],
  // Keep one React and Emotion runtime for the whole application. This is the
  // normal Vite and MUI resolution model used by the Driver app. The former
  // deep MUI aliases and forced prebundling split the styling runtime from
  // route modules, leaving sx, Grid, Stack, and component styles unapplied.
  resolve: {
    dedupe: ["react", "react-dom", "@emotion/react", "@emotion/styled"],
  },
  server: {
    port: 5176,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
});
