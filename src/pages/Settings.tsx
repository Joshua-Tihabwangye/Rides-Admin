// @ts-nocheck
import React, { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    Divider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
} from '@mui/material'

const EV_COLORS = {
    primary: '#03cd8c',
    secondary: '#f77f00',
}

export default function Settings() {
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false,
        weeklyDigest: true,
    })
    const [language, setLanguage] = useState('en')
    const [timezone, setTimezone] = useState('Africa/Kampala')

    const handleNotificationChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setNotifications((prev) => ({ ...prev, [key]: event.target.checked }))
    }

    const handleSave = () => {
        // Save settings to localStorage
        localStorage.setItem('admin_settings', JSON.stringify({
            notifications,
            language,
            timezone,
            savedAt: new Date().toISOString(),
        }));
        
        // Show success message and redirect
        alert('Settings saved successfully!');
        window.location.href = '/admin/home';
    }

    return (
        <Box sx={{ width: '100%' }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your account preferences, notifications, and system settings.
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
                {/* Notifications */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Notifications
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.email}
                                        onChange={handleNotificationChange('email')}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: EV_COLORS.primary } }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Email Notifications
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Receive alerts and updates via email
                                        </Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.push}
                                        onChange={handleNotificationChange('push')}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: EV_COLORS.primary } }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Push Notifications
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Browser push notifications for critical alerts
                                        </Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.sms}
                                        onChange={handleNotificationChange('sms')}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: EV_COLORS.primary } }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            SMS Alerts
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Receive SMS for high-priority incidents
                                        </Typography>
                                    </Box>
                                }
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={notifications.weeklyDigest}
                                        onChange={handleNotificationChange('weeklyDigest')}
                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: EV_COLORS.primary } }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            Weekly Digest
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Summary of key metrics every Monday
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Regional Preferences */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Regional Preferences
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Language</InputLabel>
                                <Select
                                    value={language}
                                    label="Language"
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="fr">Français</MenuItem>
                                    <MenuItem value="sw">Kiswahili</MenuItem>
                                    <MenuItem value="pt">Português</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Timezone</InputLabel>
                                <Select
                                    value={timezone}
                                    label="Timezone"
                                    onChange={(e) => setTimezone(e.target.value)}
                                >
                                    <MenuItem value="Africa/Kampala">East Africa Time (EAT)</MenuItem>
                                    <MenuItem value="Africa/Lagos">West Africa Time (WAT)</MenuItem>
                                    <MenuItem value="Africa/Johannesburg">South Africa Standard Time (SAST)</MenuItem>
                                    <MenuItem value="UTC">UTC</MenuItem>
                                </Select>
                            </FormControl>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Default Region Scope
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                    <Chip label="All Regions" size="small" color="primary" />
                                    <Chip label="East Africa" size="small" variant="outlined" />
                                    <Chip label="West Africa" size="small" variant="outlined" />
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Security
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Change Password
                                </Typography>
                                <TextField
                                    type="password"
                                    size="small"
                                    placeholder="Current password"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                />
                                <TextField
                                    type="password"
                                    size="small"
                                    placeholder="New password"
                                    fullWidth
                                    sx={{ mb: 1 }}
                                />
                                <TextField
                                    type="password"
                                    size="small"
                                    placeholder="Confirm new password"
                                    fullWidth
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Two-Factor Authentication
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    Add an extra layer of security to your account
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    sx={{ textTransform: 'none', borderRadius: 999 }}
                                >
                                    Enable 2FA
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                {/* Session & Activity */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                            Session & Activity
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Current Session
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Windows · Chrome · Kampala, Uganda
                                </Typography>
                                <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                                    Active now
                                </Typography>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Recent Activity
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        • Approved company GreenMove Fleet - 2 hours ago
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        • Updated pricing rules for Kampala - Yesterday
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        • Reviewed risk case RISK-101 - 2 days ago
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="text"
                                size="small"
                                sx={{ textTransform: 'none', color: 'error.main', alignSelf: 'flex-start' }}
                            >
                                Sign out all other sessions
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {/* Save Button */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 999,
                        px: 4,
                        bgcolor: EV_COLORS.primary,
                        '&:hover': { bgcolor: '#0fb589' },
                    }}
                >
                    Save Settings
                </Button>
            </Box>
        </Box>
    )
}
