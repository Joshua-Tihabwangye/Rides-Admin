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
import { upsertDriver, getDrivers, DriverRecord } from '../lib/peopleStore'

export default function DriverCreate() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: 'Kampala',
        email: '',
        vehiclePlate: '',
        vehicleModel: '',
    })

    const [saving, setSaving] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (field: string) => (e: any) => {
        setFormData({ ...formData, [field]: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Get next ID
        const drivers = getDrivers()
        const nextId = drivers.length ? Math.max(...drivers.map((d) => d.id)) + 1 : 300

        // Create new driver record
        const newDriver: DriverRecord = {
            id: nextId,
            name: formData.name || 'New Driver',
            phone: formData.phone || '+000',
            city: formData.city,
            vehicle: `EV Car · ${formData.vehiclePlate || 'TBD'}`,
            vehicleType: 'Car',
            trips: 0,
            spend: '$0',
            risk: 'Low',
            primaryStatus: 'under_review',
            activityStatus: 'inactive'
        }

        upsertDriver(newDriver)

        setTimeout(() => {
            setSaving(false)
            navigate(`/admin/drivers/${newDriver.id}`)
        }, 600)
    }

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/admin/drivers')}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                    Back to Drivers
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    Onboard New Driver
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Enter driver details to create a new profile. The driver will start in 'Under Review'.
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
                                    placeholder="+256..."
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email Address"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="driver@example.com (optional)"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>City</InputLabel>
                                    <Select
                                        value={formData.city}
                                        label="City"
                                        onChange={handleSelectChange('city')}
                                    >
                                        <MenuItem value="Kampala">Kampala</MenuItem>
                                        <MenuItem value="Kigali">Kigali</MenuItem>
                                        <MenuItem value="Nairobi">Nairobi</MenuItem>
                                        <MenuItem value="Lagos">Lagos</MenuItem>
                                        <MenuItem value="Accra">Accra</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
                                    Vehicle Information
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Vehicle Plate Number"
                                    name="vehiclePlate"
                                    value={formData.vehiclePlate}
                                    onChange={handleChange}
                                    placeholder="UAX 123X"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Vehicle Model"
                                    name="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                    placeholder="Toyota Corolla EV"
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                                <Button variant="outlined" onClick={() => navigate('/admin/drivers')}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={saving}
                                    startIcon={<SaveIcon />}
                                    sx={{ bgcolor: '#03cd8c' }}
                                >
                                    {saving ? 'Creating...' : 'Create Driver Profile'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}
