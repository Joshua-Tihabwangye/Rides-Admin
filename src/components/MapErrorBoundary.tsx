import React from "react";
import { Box, Typography } from "@mui/material";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

export default class MapErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[MapErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "warning.light",
            bgcolor: "warning.light",
            color: "warning.contrastText",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Map could not be rendered.
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, display: "block", mt: 0.5 }}>
            {this.state.error?.message || "An unexpected error occurred loading the map."}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              display: "block",
              mt: 0.5,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Click to retry
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}
