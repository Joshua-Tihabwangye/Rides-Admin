// @ts-nocheck
import React from "react";
import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EV_COLORS = {
    primary: "#03cd8c",
};

export default function ZoneMapView() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <Box className="flex flex-col h-[calc(100vh-100px)]">
            <Box className="flex items-center gap-2 mb-4 px-4">
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/pricing')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Back
                </Button>
                <Typography variant="h6" className="font-semibold">
                    Zone Map Editor: {id}
                </Typography>
            </Box>

            <Card
                elevation={1}
                sx={{
                    flex: 1,
                    mx: 4,
                    mb: 4,
                    borderRadius: 2,
                    border: "1px solid rgba(148,163,184,0.5)",
                    background: "#0f172a", // Dark map background
                    color: "#e2e8f0",
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <CardContent className="h-full flex flex-col items-center justify-center">
                    <Typography variant="h5" className="font-bold opacity-30">
                        Interactive Map Area
                    </Typography>
                    <Typography variant="body2" className="mt-2 text-slate-400">
                        Full screen map for editing polygon: {id}
                    </Typography>
                    <Box className="absolute top-4 right-4 bg-slate-800 p-2 rounded shadow border border-slate-700">
                        <Typography variant="caption" className="text-xs text-slate-400">
                            Controls: Zoom, Draw, Edit
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
