// @ts-nocheck
import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Divider,
    Grid,
    Snackbar,
    Alert
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';

const EV_COLORS = {
    primary: "#03cd8c",
};

export default function ZonePricingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [pricing, setPricing] = useState({
        baseFare: "5000",
        perKm: "2000",
        perMin: "200",
        minFare: "7000",
        surgeMultiplier: "1.0",
    });

    const handleChange = (field) => (event) => {
        setPricing((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSave = () => {
        // Save pricing rule (simulated)
        localStorage.setItem(`pricing_rule_${id}`, JSON.stringify(pricing));
        setSnackbarOpen(true);
    };

    const handlePreview = () => {
        const exampleFare = calculateExampleTrip();
        setSnackbarOpen(true);
        // Show preview in a more visible way
    };

    const calculateExampleTrip = () => {
        const distance = 5; // km
        const duration = 15; // minutes
        const base = parseInt(pricing.baseFare) || 0;
        const perKm = parseInt(pricing.perKm) || 0;
        const perMin = parseInt(pricing.perMin) || 0;
        const minFare = parseInt(pricing.minFare) || 0;
        const surge = parseFloat(pricing.surgeMultiplier) || 1.0;
        
        const calculated = (base + (distance * perKm) + (duration * perMin)) * surge;
        return Math.max(calculated, minFare);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 2, md: 4 } }}>
            <Box className="flex items-center justify-between mb-4">
                <Box className="flex items-center gap-2">
                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/pricing')}
                        sx={{ color: 'text.secondary', textTransform: 'none' }}
                    >
                        Back
                    </Button>
                    <Typography variant="h6" className="font-semibold">
                        Pricing Details: {id}
                    </Typography>
                </Box>
                <Box className="flex gap-2">
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={handlePreview}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Preview Rule
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            bgcolor: EV_COLORS.primary,
                            '&:hover': { bgcolor: '#0fb589' }
                        }}
                    >
                        Save Rule
                    </Button>
                </Box>
            </Box>

            <Card elevation={1} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.5)" }}>
                <CardContent className="p-6">
                    <Typography variant="subtitle1" className="font-semibold mb-4">
                        Tariff Configuration
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Base Fare (UGX)"
                                fullWidth
                                size="small"
                                value={pricing.baseFare}
                                onChange={handleChange('baseFare')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Per KM (UGX)"
                                fullWidth
                                size="small"
                                value={pricing.perKm}
                                onChange={handleChange('perKm')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Per Minute (UGX)"
                                fullWidth
                                size="small"
                                value={pricing.perMin}
                                onChange={handleChange('perMin')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Minimum Fare (UGX)"
                                fullWidth
                                size="small"
                                value={pricing.minFare}
                                onChange={handleChange('minFare')}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Surge Multiplier (1.0 = None)"
                                fullWidth
                                size="small"
                                value={pricing.surgeMultiplier}
                                onChange={handleChange('surgeMultiplier')}
                            />
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                    
                    {/* Pricing Rule Display */}
                    <Card elevation={0} sx={{ bgcolor: 'background.default', p: 3, mb: 3 }}>
                        <Typography variant="subtitle2" className="font-semibold mb-2">
                            Pricing Rule Formula
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                            Fare = (Base Fare + (Distance × Per KM) + (Duration × Per Minute)) × Surge Multiplier
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
                            Final Fare = MAX(Calculated Fare, Minimum Fare)
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" className="font-semibold mb-2">
                            Example Calculation
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Trip: 5 km, 15 minutes
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                            = ({pricing.baseFare} + (5 × {pricing.perKm}) + (15 × {pricing.perMin})) × {pricing.surgeMultiplier}
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600, mt: 1 }}>
                            = {calculateExampleTrip().toLocaleString()} UGX
                        </Typography>
                    </Card>

                    <Typography variant="caption" color="text.secondary">
                        These changes will apply immediately to all new trips created in this zone.
                    </Typography>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    Rule saved successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
}
