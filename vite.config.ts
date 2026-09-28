import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json" with { type: "json" };
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appVersion = packageJson.version;
const muiSystemEsm = fileURLToPath(
  new URL("./node_modules/@mui/system/esm", import.meta.url),
);
const muiUtilsEsm = fileURLToPath(
  new URL("./node_modules/@mui/utils/esm", import.meta.url),
);
const muiIconsEsm = fileURLToPath(
  new URL("./node_modules/@mui/icons-material/esm", import.meta.url),
);

function gitSha() {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GIT_SHA__: JSON.stringify(gitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  resolve: {
    alias: [
      // Material's source build is ESM but its deep imports target CommonJS
      // System and Utils files. Resolve those subpaths to absolute ESM files
      // so Vite never serves incompatible named/default exports on cold load.
      {
        find: /^@mui\/system\/(.+)$/,
        replacement: `${muiSystemEsm}/$1`,
      },
      {
        find: /^@mui\/utils\/(.+)$/,
        replacement: `${muiUtilsEsm}/$1`,
      },
      {
        find: /^@mui\/icons-material\/(.+)$/,
        replacement: `${muiIconsEsm}/$1`,
      },
      {
        find: /^@mui\/icons-material$/,
        replacement: `${muiIconsEsm}/index.js`,
      },
    ],
  },
  optimizeDeps: {
    // Keep development startup deterministic. With route modules imported
    // eagerly, discovering another shared MUI/Emotion chunk after the browser
    // starts can leave the mounted page using outdated optimized modules until
    // a manual refresh. This restores the known-good forced pre-bundle and
    // disables the follow-up discovery pass.
    force: true,
    noDiscovery: true,
    include: [
      "react",
      "react-dom/client",
      "react-router-dom",
      "@emotion/react",
      "@emotion/styled",
      "prop-types",
      "react-is",
      "@mui/material",
      "@mui/system",
      "@mui/utils",
      "@mui/icons-material",
      "@mui/x-date-pickers/AdapterDayjs",
      "@mui/x-date-pickers/DatePicker",
      "@mui/x-date-pickers/LocalizationProvider",
      "@react-google-maps/api",
      "dayjs",
      "recharts",
      "socket.io-client",
    ],
  },
  server: {
    port: 5176,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5176,
      clientPort: 5176,
    },
  },
});
