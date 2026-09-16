import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Chip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listAdminTrainingModules, type AdminTrainingModuleResponse } from "../services/api/adminApi";

type PreviewContent = {
  description: string;
  audience: string;
  language: string;
};

function decodeContent(content?: string): PreviewContent {
  if (!content) return { description: "", audience: "Drivers", language: "en" };
  try {
    const parsed = JSON.parse(content) as Partial<PreviewContent>;
    return {
      description: typeof parsed.description === "string" ? parsed.description : content,
      audience: typeof parsed.audience === "string" ? parsed.audience : "Drivers",
      language: typeof parsed.language === "string" ? parsed.language : "en",
    };
  } catch {
    return { description: content, audience: "Drivers", language: "en" };
  }
}

function statusLabel(status?: string) {
  if (!status) return "Draft";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TrainingModulePreview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const fallbackTitle = searchParams.get("title") || "Module Preview";
  const fallbackDescription = searchParams.get("desc") || "No description provided.";
  const [module, setModule] = useState<AdminTrainingModuleResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(moduleId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!moduleId) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const modules = await listAdminTrainingModules();
        if (!active) return;
        setModule(modules.find((item) => item.id === moduleId) ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load training module preview");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [moduleId]);

  const content = useMemo(() => decodeContent(module?.content), [module?.content]);
  const title = module?.title || fallbackTitle;
  const description = content.description || fallbackDescription;

  return (
    <Box className="min-h-screen bg-slate-50 flex flex-col">
      <Box className="bg-[#03cd8c] text-white p-4 shadow-md sticky top-0 z-10">
        <Box className="max-w-md mx-auto flex items-center gap-2">
          <Button
            size="small"
            startIcon={<ArrowBackIcon sx={{ color: "white" }} />}
            onClick={() => navigate("/admin/training")}
            sx={{ color: "white", minWidth: "auto", p: 1 }}
          />
          <Typography variant="subtitle1" className="font-bold">
            EVzone Academy
          </Typography>
        </Box>
      </Box>

      <Container
        maxWidth={false}
        sx={{ maxWidth: { xs: "100%", sm: "600px", lg: "100%" }, px: { xs: 2, lg: 4 } }}
        className="flex-1 py-6"
      >
        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {moduleId && !loading && !module ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            This module was not returned by the backend. Showing the editor preview text instead.
          </Alert>
        ) : null}

        {!loading ? (
          <>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 2 }}>
              <CardContent className="p-6">
                <Typography variant="overline" className="text-slate-500 tracking-wider">
                  MODULE
                </Typography>
                <Typography variant="h5" className="font-bold mb-2 leading-tight">
                  {title}
                </Typography>
                <Box className="flex items-center gap-2 mb-3 flex-wrap">
                  <Chip size="small" label={content.audience} />
                  <Chip size="small" label={content.language.toUpperCase()} />
                  <Chip size="small" label={statusLabel(module?.status)} />
                </Box>
                <Typography variant="body2" className="text-slate-500 leading-relaxed">
                  {description}
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
              <CardContent className="p-6">
                <Typography variant="subtitle2" className="font-semibold mb-2">
                  Module content
                </Typography>
                <Typography variant="body2" className="text-slate-500 leading-relaxed">
                  {description}
                </Typography>
              </CardContent>
            </Card>
          </>
        ) : null}
      </Container>
    </Box>
  );
}
