import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DrawingManager,
  GoogleMap,
  Polygon,
  useJsApiLoader,
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

const googleMapsLibraries: "drawing"[] = ["drawing"];
const defaultCenter = { lat: 0.3476, lng: 32.5825 };

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeBoundaryPoint(point: number[]): google.maps.LatLngLiteral | null {
  const [lng, lat] = point;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function pointsEqual(
  a: google.maps.LatLngLiteral | undefined,
  b: google.maps.LatLngLiteral | undefined,
) {
  return !!a && !!b && a.lat === b.lat && a.lng === b.lng;
}

function closeRing(points: google.maps.LatLngLiteral[]) {
  if (points.length === 0) return points;
  const first = points[0];
  const last = points[points.length - 1];
  return pointsEqual(first, last) ? points : [...points, first];
}

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
          const converted = geoCoords
            .map(normalizeBoundaryPoint)
            .filter((point): point is google.maps.LatLngLiteral => Boolean(point));
          if (pointsEqual(converted[0], converted[converted.length - 1])) {
            converted.pop();
          }
          setPaths(converted);
          setOriginalPaths(converted);
        } else {
          setPaths([]);
          setOriginalPaths([]);
        }
      } catch (error) {
        setError(getErrorMessage(error, "Failed to load zone"));
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

  const clearPathListeners = () => {
    listenersRef.current.forEach((listener) => listener.remove());
    listenersRef.current = [];
  };

  const readPolygonPath = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const newPaths: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < path.getLength(); i += 1) {
      const latLng = path.getAt(i);
      newPaths.push({ lat: latLng.lat(), lng: latLng.lng() });
    }
    setPaths(newPaths);
  };

  const handlePolygonLoad = (polygon: google.maps.Polygon) => {
    clearPathListeners();
    polygonRef.current = polygon;
    const path = polygon.getPath();
    const events: ("set_at" | "insert_at" | "remove_at")[] = [
      "set_at",
      "insert_at",
      "remove_at",
    ];
    const added = events.map((ev) =>
      path.addListener(ev, () => readPolygonPath(polygon)),
    );
    listenersRef.current = added;
  };

  const handlePolygonUnmount = () => {
    clearPathListeners();
    polygonRef.current = null;
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    readPolygonPath(polygon);
    polygon.setMap(null);
  };

  const handleOverlayComplete = (event: google.maps.drawing.OverlayCompleteEvent) => {
    if (event.type !== google.maps.drawing.OverlayType.POLYGON) {
      event.overlay?.setMap(null);
      return;
    }
    handlePolygonComplete(event.overlay as google.maps.Polygon);
  };

  const hasChanges = JSON.stringify(paths) !== JSON.stringify(originalPaths);

  const handleSave = async () => {
    if (!id || paths.length < 3) return;
    setSaving(true);
    try {
      const closedPaths = closeRing(paths);
      const boundaries: { type: "Polygon"; coordinates: number[][][] } = {
        type: "Polygon",
        coordinates: [closedPaths.map((p) => [p.lng, p.lat])],
      };
      await patchAdminPricingZone(id, { boundaries });
      setSnackbar({
        open: true,
        message: "Zone boundaries saved successfully",
        severity: "success",
      });
      setOriginalPaths(paths);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, "Save failed"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate(-1);

  const getCenter = (): google.maps.LatLngLiteral => {
    if (paths.length === 0) return defaultCenter;
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
            {paths.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                disabled={saving}
                onClick={() => setPaths([])}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Redraw
              </Button>
            )}
            <Button
              variant="contained"
              size="small"
              disabled={!hasChanges || saving || paths.length < 3}
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
                onUnmount={handlePolygonUnmount}
              />
            )}
            {paths.length === 0 && (
              <DrawingManager
                onOverlayComplete={handleOverlayComplete}
                options={{
                  drawingControl: true,
                  drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [google.maps.drawing.OverlayType.POLYGON],
                  },
                  drawingMode: google.maps.drawing.OverlayType.POLYGON,
                  polygonOptions,
                }}
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
