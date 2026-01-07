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

            <Container maxWidth={false} sx={{ maxWidth: { xs: '100%', sm: '600px', lg: '100%' }, px: { xs: 2, lg: 4 } }} className="flex-1 py-6">
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
                    {[1, 2, 3].map(i => {
                        const [isPlaying, setIsPlaying] = React.useState(false);
                        return (
                            <Card 
                                key={i} 
                                elevation={0} 
                                onClick={() => setIsPlaying(!isPlaying)}
                                sx={{ 
                                    borderRadius: 2, 
                                    border: "1px solid #e2e8f0", 
                                    bgcolor: '#fff',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: '#03cd8c',
                                        boxShadow: 2,
                                    }
                                }}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <Box 
                                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                                        sx={{ 
                                            bgcolor: isPlaying ? '#03cd8c' : '#e2e8f0',
                                            color: isPlaying ? '#ffffff' : '#64748b',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {isPlaying ? '▶' : i}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" className="font-semibold">
                                            Lesson Part {i}
                                        </Typography>
                                        <Typography variant="caption" className="text-slate-400">
                                            {isPlaying ? 'Playing... 2:34 / 5:00' : '5 mins · Video'}
                                        </Typography>
                                        {isPlaying && (
                                            <Box sx={{ mt: 1, width: '100%', height: 4, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                                <Box sx={{ width: '52%', height: '100%', bgcolor: '#03cd8c' }} />
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>

                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ 
                        mt: 6, 
                        borderRadius: 4, 
                        bgcolor: '#a7f3d0', 
                        color: '#065f46',
                        textTransform: 'none', 
                        py: 1.5,
                        fontWeight: 600,
                        '&:hover': {
                            bgcolor: '#10b981',
                            color: '#ffffff',
                        }
                    }}
                >
                    Start Learning
                </Button>
            </Container>
        </Box>
    );
}
