import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import Stack from "@mui/material/Stack";
import "./styles/tailwind.css";
import ColorModeProvider from "./theme/ColorModeProvider";
import App from "./App";

/**
 * Detect a stale MUI/Emotion graph in development. It has no authentication or
 * application data, does not use browser storage, and reloads at most once for
 * the current browser history entry.
 */
function MuiRuntimeGuard() {
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const timer = window.setTimeout(() => {
      const probe = probeRef.current;
      if (!probe) return;

      const style = window.getComputedStyle(probe);
      const healthy = style.display === "flex" && style.flexDirection === "row";
      if (healthy) return;

      const state = window.history.state as
        | { evzoneMuiRuntimeReloaded?: boolean }
        | null;
      if (state?.evzoneMuiRuntimeReloaded) {
        console.error("MUI runtime styles did not initialize after a clean reload.");
        return;
      }

      window.history.replaceState(
        { ...(state ?? {}), evzoneMuiRuntimeReloaded: true },
        "",
        window.location.href,
      );
      window.location.reload();
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Stack
      ref={probeRef}
      aria-hidden
      direction="row"
      sx={{
        position: "fixed",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
        visibility: "hidden",
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ColorModeProvider>
      <MuiRuntimeGuard />
      <App />
    </ColorModeProvider>
  </React.StrictMode>,
);
