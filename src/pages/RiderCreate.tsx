import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import { createRider } from '../lib/peopleStore'

export default function RiderCreate() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: 'Kigali',
        email: '',
    })

    const [saving, setSaving] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (e: any) => {
        setFormData({ ...formData, city: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Simulate standard defaults for new rider
        const newRider = createRider({
            name: formData.name || 'New User',
            phone: formData.phone || '+000',
            city: formData.city,
            trips: 0,
            spend: '$0',
            risk: 'Low',
            primaryStatus: 'under_review',
            activityStatus: 'inactive'
        })

        setTimeout(() => {
            setSaving(false)
            navigate(`/admin/riders/${newRider.id}`)
        }, 600)
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/riders')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Back to Riders
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Onboard New Rider
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Enter rider details to create a new profile. The rider will start in 'Under Review'.
                </Typography>
            </Box>

            <Card elevation={2} sx={{ maxWidth: 800 }}>
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Personal Information
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+250..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="marketing@example.com (optional)"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>City</InputLabel>
                                    <Select
                                        value={formData.city}
                                        label="City"
                                        onChange={handleSelectChange}
                                    >
                                        <MenuItem value="Kigali">Kigali</MenuItem>
                                        <MenuItem value="Kampala">Kampala</MenuItem>
                                        <MenuItem value="Nairobi">Nairobi</MenuItem>
                                        <MenuItem value="Lagos">Lagos</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                <Button variant="outlined" onClick={() => navigate('/admin/riders')}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={saving}
                                    startIcon={<SaveIcon />}
                                    sx={{ bgcolor: '#03cd8c' }}
                                >
                                    {saving ? 'Creating...' : 'Create Rider Profile'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}
