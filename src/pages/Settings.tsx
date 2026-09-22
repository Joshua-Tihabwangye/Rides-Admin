import React, { useMemo, useState } from 'react'
import {
    Box,
    Alert,
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
	} from '@mui/material'
	import type { AlertColor, SelectChangeEvent } from '@mui/material'
	import {
	    getAdminPortalSettings,
	    patchAdminPortalSettings,
	    type AdminPortalSettingsResponse,
	} from '../services/api/adminApi'

const EV_COLORS = {
    primary: '#03cd8c',
    secondary: '#f77f00',
}

type NotificationSettings = AdminPortalSettingsResponse['notifications']
type SaveStatus = { type: AlertColor; message: string } | null

function getSupportedTimezones(selected: string): string[] {
    const intlWithZones = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }
    const zones = intlWithZones.supportedValuesOf?.('timeZone') ?? []
    return selected && !zones.includes(selected) ? [selected, ...zones] : zones
}

export default function Settings() {
    const [notifications, setNotifications] = useState<NotificationSettings>({
        email: true,
        push: true,
        sms: false,
        weeklyDigest: true,
    })
    const [language, setLanguage] = useState('')
    const [timezone, setTimezone] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(null)
    const timezoneOptions = useMemo(() => getSupportedTimezones(timezone), [timezone])

    React.useEffect(() => {
        const load = async () => {
            try {
                const settings = await getAdminPortalSettings()
                setNotifications(settings.notifications)
                setLanguage(settings.language)
                setTimezone(settings.timezone)
            } catch (error) {
                console.warn('Failed to load admin settings from backend.', error)
            }
        }
        void load()
    }, [])

    const handleNotificationChange = (key: keyof NotificationSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setNotifications((prev) => ({ ...prev, [key]: event.target.checked }))
    }

    const handleSave = async () => {
        setSaving(true)
        setSaveStatus(null)
        try {
            await patchAdminPortalSettings({
                notifications,
                language,
                timezone,
            })
            setSaveStatus({ type: 'success', message: 'Settings saved successfully.' })
        } catch (error) {
            console.error('Failed to save admin settings.', error)
            setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' })
        } finally {
            setSaving(false)
        }
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
                {saveStatus && (
                    <Alert severity={saveStatus.type} sx={{ mt: 2 }}>
                        {saveStatus.message}
                    </Alert>
                )}
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
                                    onChange={(e: SelectChangeEvent) => setLanguage(e.target.value)}
                                >
                                    <MenuItem value=""><em>Select language</em></MenuItem>
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
                                    onChange={(e: SelectChangeEvent) => setTimezone(e.target.value)}
                                >
                                    <MenuItem value=""><em>Select timezone</em></MenuItem>
                                    {timezoneOptions.map((zone) => (
                                        <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
	                                    disabled
	                                    sx={{ mb: 1 }}
                                />
                                <TextField
                                    type="password"
                                    size="small"
                                    placeholder="New password"
	                                    fullWidth
	                                    disabled
	                                    sx={{ mb: 1 }}
                                />
                                <TextField
                                    type="password"
                                    size="small"
                                    placeholder="Confirm new password"
	                                    fullWidth
	                                    disabled
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
	                                    disabled
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
                                    Current browser session
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
                                        • Activity feed is fetched from the backend audit log.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        • No recent activity available.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        • Sign in events and admin actions are recorded in the audit log.
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
                    disabled={saving}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 999,
                        px: 4,
                        bgcolor: EV_COLORS.primary,
                        '&:hover': { bgcolor: '#0fb589' },
                    }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </Box>
        </Box>
    )
}
