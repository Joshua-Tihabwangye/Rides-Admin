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
    MenuItem,
    FormControlLabel,
    Checkbox
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveIcon from '@mui/icons-material/Save'
import { getAuthRoles } from '../auth/auth'
import { hasPermissionByRoles } from '../auth/permissions'
import { createAdminDriver } from '../services/api/adminApi'
import { normalizeAdminCreateDriverInput } from '../services/api/validators'

export default function DriverCreate() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: 'Kampala',
        email: '',
        vehiclePlate: '',
        vehicleModel: '',
        password: '',
        invite: false,
    })

    const [saving, setSaving] = useState(false)
    const canManagePeople = hasPermissionByRoles(getAuthRoles(), 'manage_people')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (field: string) => (e: any) => {
        setFormData({ ...formData, [field]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManagePeople) {
            alert('Your account cannot create or update people records.')
            return
        }
        setSaving(true)

        try {
            const payload = normalizeAdminCreateDriverInput({
                fullName: formData.name,
                phone: formData.phone,
                city: formData.city,
                email: formData.email,
                password: formData.password || undefined,
                invite: formData.invite,
                licensePlate: formData.vehiclePlate,
                model: formData.vehicleModel,
                vehicleType: 'Car',
            })
            const created = await createAdminDriver(payload)
            setSaving(false)
            navigate(`/admin/drivers/${created.driverId}`)
        } catch (error) {
            console.error('Failed to create driver profile.', error)
            setSaving(false)
            alert(error instanceof Error ? error.message : 'Failed to create driver profile. Please try again.')
        }
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

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Temporary Password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Optional (min 8 chars)"
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.invite}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, invite: e.target.checked }))}
                                        />
                                    }
                                    label="Create as invited user"
                                />
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
                                    disabled={saving || !canManagePeople}
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
