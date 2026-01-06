// @ts-nocheck
import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const EV_COLORS = {
    primary: "#03cd8c",
    secondary: "#f77f00",
};

const SERVICES = [
    "Ride",
    "Delivery",
    "Rental",
    "School Shuttle",
    "EMS / Ambulance",
    "Tours",
];

export default function ZoneCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        country: "Uganda",
        city: "",
        services: [],
    });

    const handleChange = (field) => (event) => {
        const {
            target: { value },
        } = event;
        setFormData((prev) => ({
            ...prev,
            [field]: typeof value === "string" ? value.split(",") : value,
        }));
    };

    const handleTextChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = () => {
        // Logic to save zone would go here
        console.log("Creating zone:", formData);
        // Navigate back to pricing
        navigate("/admin/pricing");
    };

    return (
        <Box className="p-4 max-w-2xl mx-auto">
            <Card
                elevation={1}
                sx={{
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.5)",
                }}
            >
                <CardContent className="p-6 flex flex-col gap-4">
                    <Typography variant="h6" className="font-semibold text-slate-900">
                        Create New Zone
                    </Typography>
                    <Typography variant="caption" className="text-slate-500 mb-2">
                        Define basic details for a new service zone.
                    </Typography>

                    <TextField
                        label="Zone Name"
                        size="small"
                        fullWidth
                        value={formData.name}
                        onChange={handleTextChange("name")}
                    />

                    <Box className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Country"
                            size="small"
                            select
                            fullWidth
                            value={formData.country}
                            onChange={handleTextChange("country")}
                        >
                            <MenuItem value="Uganda">Uganda</MenuItem>
                            <MenuItem value="Kenya">Kenya</MenuItem>
                        </TextField>
                        <TextField
                            label="City/Region"
                            size="small"
                            fullWidth
                            value={formData.city}
                            onChange={handleTextChange("city")}
                        />
                    </Box>

                    <FormControl size="small" fullWidth>
                        <InputLabel>Services</InputLabel>
                        <Select
                            multiple
                            value={formData.services}
                            onChange={handleChange("services")}
                            input={<OutlinedInput label="Services" />}
                            renderValue={(selected) => selected.join(", ")}
                        >
                            {SERVICES.map((name) => (
                                <MenuItem key={name} value={name}>
                                    <Checkbox checked={formData.services.indexOf(name) > -1} />
                                    <ListItemText primary={name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outlined"
                            onClick={() => navigate("/admin/pricing")}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            sx={{
                                textTransform: "none",
                                borderRadius: 2,
                                bgcolor: EV_COLORS.primary,
                                "&:hover": { bgcolor: "#0fb589" },
                            }}
                        >
                            Create Zone
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
