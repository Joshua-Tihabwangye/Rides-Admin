// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography, Button, Container } from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function TrainingModulePreview() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const title = searchParams.get("title") || "Module Preview";
    const desc = searchParams.get("desc") || "No description provided.";

    return (
        <Box className="min-h-screen bg-slate-50 flex flex-col">
            {/* Simulate Mobile App Header */}
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

            <Container maxWidth="sm" className="flex-1 py-6">
                <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", mb: 2 }}>
                    <CardContent className="p-6">
                        <Typography variant="overline" className="text-slate-500 tracking-wider">
                            MODULE
                        </Typography>
                        <Typography variant="h5" className="font-bold text-slate-900 mb-2 leading-tight">
                            {title}
                        </Typography>
                        <Typography variant="body2" className="text-slate-600 leading-relaxed">
                            {desc}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Mock Content Blocks */}
                <Box className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} elevation={0} sx={{ borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: '#fff' }}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <Box className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                    {i}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" className="font-semibold">
                                        Lesson Part {i}
                                    </Typography>
                                    <Typography variant="caption" className="text-slate-400">
                                        5 mins · Video
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 6, borderRadius: 4, bgcolor: '#0f172a', textTransform: 'none', py: 1.5 }}
                >
                    Start Learning
                </Button>
            </Container>
        </Box>
    );
}
