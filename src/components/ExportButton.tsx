import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Download as DownloadIcon,
    BarChart as ChartIcon,
    TableChart as TableIcon
} from '@mui/icons-material';

interface ExportButtonProps {
    onDownload?: () => void;
    onViewChart?: () => void;
    onViewRawData?: () => void;
    variant?: 'text' | 'outlined' | 'contained';
    label?: string;
}

export default function ExportButton({
    onDownload,
    onViewChart,
    onViewRawData,
    variant = 'outlined',
    label = 'Export'
}: ExportButtonProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleAction = (action?: () => void) => {
        if (action) action();
        handleClose();
    };

    return (
        <>
            <Button
                variant={variant}
                size="small"
                onClick={handleClick}
                startIcon={<DownloadIcon />}
                sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: 600,
                    borderColor: 'rgba(148,163,184,0.4)',
                    color: 'text.secondary',
                    '&:hover': {
                        borderColor: 'rgba(148,163,184,0.8)',
                        backgroundColor: 'rgba(148,163,184,0.05)',
                        color: 'text.primary'
                    }
                }}
            >
                {label}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'export-button',
                    sx: { py: 0.5 }
                }}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            borderRadius: 2,
                            minWidth: 160,
                            mt: 1
                        }
                    }
                }}
            >
                <MenuItem onClick={() => handleAction(onViewChart)}>
                    <ListItemIcon>
                        <ChartIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="View Chart" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
                <MenuItem onClick={() => handleAction(onViewRawData)}>
                    <ListItemIcon>
                        <TableIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="View Raw Data" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
                <MenuItem onClick={() => handleAction(onDownload)}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Download CSV" primaryTypographyProps={{ variant: 'body2' }} />
                </MenuItem>
            </Menu>
        </>
    );
}
