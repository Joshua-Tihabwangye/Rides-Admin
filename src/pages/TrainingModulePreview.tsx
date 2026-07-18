// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography, Button, Container } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function TrainingModulePreview() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const title = searchParams.get("title") || "Module Preview";
    const desc = searchParams.get("desc") || "No description provided.";

    return (
        <Box className="min-h-screen bg-slate-50 flex flex-col">
            <Box className="bg-[#03cd8c] text-white p-4 shadow-md sticky top-0 z-10">
                <Box className="max-w-md mx-auto flex items-center gap-2">
                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon sx={{ color: 'white' }} />}
                        onClick={() => navigate('/admin/training')}
                        sx={{ color: 'white', minWidth: 'auto', p: 1 }}
                    />
                    <Typography variant="subtitle1" className="font-bold">
                        EVzone Academy
                    </Typography>
                </Box>
            </Box>

            <Container maxWidth={false} sx={{ maxWidth: { xs: '100%', sm: '600px', lg: '100%' }, px: { xs: 2, lg: 4 } }} className="flex-1 py-6">
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 2 }}>
                    <CardContent className="p-6">
                        <Typography variant="overline" className="text-slate-500 tracking-wider">
                            MODULE
                        </Typography>
                        <Typography variant="h5" className="font-bold mb-2 leading-tight">
                            {title}
                        </Typography>
                        <Typography variant="body2" className="text-slate-500 leading-relaxed">
                            {desc}
                        </Typography>
                    </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0" }}>
                    <CardContent className="p-6">
                        <Typography variant="subtitle2" className="font-semibold mb-2">
                            Module content
                        </Typography>
                        <Typography variant="body2" className="text-slate-500 leading-relaxed">
                            Training module content is managed by the backend. Once content is configured, it will be
                            loaded here instead of placeholder lessons.
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}
