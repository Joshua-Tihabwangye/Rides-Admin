import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  Polygon,
} from "@react-google-maps/api";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  getAdminPricingZone,
  patchAdminPricingZone,
} from "../services/api/adminApi";
import type { AdminPricingZoneResponse } from "../services/api/adminApi";

const EV_COLORS = {
  primary: "#03CD8C",
};

const googleMapsLibraries: ("places" | "drawing")[] = ["places"];

export default function ZoneMapView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [zone, setZone] = useState<AdminPricingZoneResponse | null>(null);
  const [paths, setPaths] = useState<google.maps.LatLngLiteral[]>([]);
  const [originalPaths, setOriginalPaths] = useState<google.maps.LatLngLiteral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  const rawApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  const googleMapsApiKey = rawApiKey && !/^https?:\/\//i.test(rawApiKey) ? rawApiKey : "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: googleMapsLibraries,
  });

  useEffect(() => {
    if (!id) return;
    const fetchZone = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminPricingZone(id);
        setZone(data);

        // Convert GeoJSON Polygon coordinates to Google Maps LatLngLiteral[]
        // GeoJSON: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
        const geoCoords = data.boundaries?.coordinates?.[0];
        if (Array.isArray(geoCoords)) {
          const converted = geoCoords.map((ringPoint) => ({
            lng: ringPoint[0],
            lat: ringPoint[1],
          }));
          setPaths(converted);
          setOriginalPaths(converted);
        } else {
          setError("Zone has no valid boundary data");
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to load zone");
      } finally {
        setLoading(false);
      }
    };
    fetchZone();
  }, [id]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach((listener) => listener.remove());
      listenersRef.current = [];
    };
  }, []);

  const handlePolygonLoad = (polygon: google.maps.Polygon) => {
    polygonRef.current = polygon;
    const events: ("set_at" | "insert_at" | "remove_at")[] = [
      "set_at",
      "insert_at",
      "remove_at",
    ];
    const added = events.map((ev) =>
      polygon.addListener(ev, onPathChanged),
    );
    listenersRef.current = added;
  };

  const onPathChanged = () => {
    if (!polygonRef.current) return;
    const path = polygonRef.current.getPath();
    const newPaths: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      newPaths.push({ lat: latLng.lat(), lng: latLng.lng() });
    }
    setPaths(newPaths);
  };

  const hasChanges = JSON.stringify(paths) !== JSON.stringify(originalPaths);

  const handleSave = async () => {
    if (!id || !paths.length) return;
    setSaving(true);
    try {
      const boundaries: { type: "Polygon"; coordinates: number[][][] } = {
        type: "Polygon",
        coordinates: [[...paths.map((p) => [p.lng, p.lat])]],
      };
      await patchAdminPricingZone(id, { boundaries });
      setSnackbar({
        open: true,
        message: "Zone boundaries saved successfully",
        severity: "success",
      });
      setOriginalPaths(paths);
      setTimeout(() => navigate(-1), 1500);
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e.message || "Save failed",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate(-1);

  const getCenter = (): google.maps.LatLngLiteral => {
    if (paths.length === 0) return { lat: 0, lng: 0 };
    const sum = paths.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / paths.length, lng: sum.lng / paths.length };
  };

  const polygonOptions: google.maps.PolygonOptions = {
    editable: true,
    draggable: false,
    fillColor: EV_COLORS.primary,
    fillOpacity: 0.35,
    strokeColor: EV_COLORS.primary,
    strokeOpacity: 0.8,
    strokeWeight: 2,
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading zone…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, py: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ color: "text.secondary", textTransform: "none" }}
            >
              Back
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Zone: {zone?.name || id}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              size="small"
              disabled={!hasChanges || saving}
              onClick={handleSave}
              sx={{
                backgroundColor: EV_COLORS.primary,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { backgroundColor: "#02b87c" },
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Map */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          mx: { xs: 2, md: 4 },
          mb: { xs: 2, md: 4 },
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        {!isLoaded && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "background.paper",
            }}
          >
            <CircularProgress />
          </Box>
        )}
        {loadError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "error.light",
            }}
          >
            <Typography color="error">
              Map load error: {loadError.message}
            </Typography>
          </Box>
        )}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={getCenter()}
            zoom={13}
            options={{
              fullscreenControl: false,
              mapTypeControl: false,
              streetViewControl: false,
            }}
          >
            {paths.length > 0 && (
              <Polygon
                paths={paths}
                options={polygonOptions}
                onLoad={handlePolygonLoad}
              />
            )}
          </GoogleMap>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
