import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";

export default function AccessDenied(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Card sx={{ maxWidth: 440, width: "100%" }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Access denied
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your account is authenticated, but it does not have permission to access this page.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/admin/home", { replace: true })}>
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
