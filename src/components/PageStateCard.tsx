import React from "react"
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from "@mui/material"

type PageStateKind = "loading" | "error" | "empty"

export default function PageStateCard({
  kind,
  title,
  message,
  actionLabel,
  onAction,
}: {
  kind: PageStateKind
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.35)" }}>
      <CardContent sx={{ minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Box sx={{ textAlign: "center", maxWidth: 420 }}>
          {kind === "loading" ? <CircularProgress size={28} sx={{ mb: 2 }} /> : null}
          {kind === "error" ? <Alert severity="error" sx={{ mb: 2 }}>{title}</Alert> : <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>}
          {message ? <Typography variant="body2" color="text.secondary">{message}</Typography> : null}
          {actionLabel && onAction ? (
            <Button variant="contained" sx={{ mt: 2 }} onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  )
}
