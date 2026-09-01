import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  InfoWindowF,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import RefreshIcon from "@mui/icons-material/Refresh";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { createAdminSocket, getActiveDrivers } from "../services/api/adminApi";
import {
  driverVehicleKind,
  vehicleMarkerAnchor,
  vehicleMarkerIconUrl,
  vehicleMarkerSize,
} from "../utils/vehicleMarkerIcons";

export type LiveDriverMarker = {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  vehicleType?: string;
  availabilityStatus: string;
  lastLocationAt?: string;
  distanceKm: number;
  name?: string;
  plate?: string;
};

// Server-side proximity origin used ONLY to scope the backend active-drivers
// query. It is never used as a displayed map center and never overrides real
// driver coordinates rendered on the map.
const QUERY_ORIGIN = { lat: 0, lng: 0 };

// Returns the operator's real browser position to seed the initial viewport,
// or null when unavailable. No hardcoded fallback location is applied so that
// the map only centers on real driver data.
function requestBrowserCenter(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}

const FRESHNESS_MS = 15 * 60 * 1000;

function isValidFreshLocation(loc: { latitude?: number; longitude?: number; lastLocationAt?: string }): boolean {
  if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return false;
  if (typeof loc.lastLocationAt === "string") {
    const age = Date.now() - new Date(loc.lastLocationAt).getTime();
    if (!Number.isFinite(age) || age > FRESHNESS_MS) return false;
  }
  return true;
}

function vehicleIcon(vehicleType?: string) {
  const type = (vehicleType ?? "").toLowerCase();
  if (type.includes("bike")) return <TwoWheelerIcon fontSize="small" />;
  if (type.includes("truck") || type.includes("van")) return <LocalShippingIcon fontSize="small" />;
  return <DirectionsCarIcon fontSize="small" />;
}

function markerIcon(driver: LiveDriverMarker, google: any) {
  const kind = driverVehicleKind(driver.vehicleType);
  return {
    url: vehicleMarkerIconUrl(kind, driver.heading, driver.availabilityStatus === "BUSY"),
    anchor: vehicleMarkerAnchor(kind, google),
    scaledSize: vehicleMarkerSize(kind, google),
  };
}

function formatLastSeen(value?: string) {
  if (!value) return "—";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function LiveDriversMapPage() {
  const navigate = useNavigate();
  const rawApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  const googleMapsApiKey = rawApiKey && !/^https?:\/\//i.test(rawApiKey) ? rawApiKey : "";
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey });

  const [drivers, setDrivers] = useState<LiveDriverMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selected, setSelected] = useState<LiveDriverMarker | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(12);
  const [filter, setFilter] = useState<"ALL" | "ONLINE" | "BUSY">("ALL");
  const mapRef = useRef<any>(null);
  const driversRef = useRef<LiveDriverMarker[]>([]);
  driversRef.current = drivers;
  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    let cancelled = false;
    requestBrowserCenter().then((gpsCenter) => {
      if (!cancelled && gpsCenter) setCenter(gpsCenter);
    });
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const origin = centerRef.current ?? QUERY_ORIGIN;
      const { drivers: markers } = await getActiveDrivers(
        origin.lat,
        origin.lng,
        50,
        300,
      );
      setDrivers(markers);
      // Seed the viewport from the first real driver when no center is set yet.
      if (!centerRef.current && markers.length > 0) {
        const first = markers[0];
        setCenter({ lat: first.latitude, lng: first.longitude });
      }
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load active drivers");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!googleMapsApiKey) return;
    const socket = createAdminSocket();
    const onServiceUpdated = (payload: {
      serviceType?: string;
      serviceId?: string;
      data?: { event?: string; location?: LiveDriverMarker };
    }) => {
      const data = payload?.data;
      if (data?.event !== "driver.location" || !data.location) return;
      const location = data.location;
      if (!isValidFreshLocation(location)) return;
      setDrivers((prev) => {
        const index = prev.findIndex((d) => d.driverId === location.driverId);
        if (index === -1) {
          if (!centerRef.current) {
            setCenter({ lat: location.latitude, lng: location.longitude });
          }
          return [...prev, { ...location, distanceKm: 0 }];
        }
        const next = [...prev];
        next[index] = { ...next[index], ...location };
        return next;
      });
    };
    socket.on("service.updated", onServiceUpdated);
    socket.on("operations.service.updated", onServiceUpdated);
    socket.connect();
    return () => {
      socket.off("service.updated", onServiceUpdated);
      socket.off("operations.service.updated", onServiceUpdated);
      socket.disconnect();
    };
  }, [googleMapsApiKey]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const visibleDrivers = drivers.filter((driver) => filter === "ALL" || driver.availabilityStatus === filter);
  const onlineCount = drivers.filter((d) => d.availabilityStatus === "ONLINE").length;
  const busyCount = drivers.filter((d) => d.availabilityStatus === "BUSY").length;

  if (!googleMapsApiKey) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Live drivers map
        </Typography>
        <Alert noKey />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", px: { xs: 2, md: 4 }, pb: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: 'none' }}>
            Back
          </Button>
          <MyLocationIcon sx={{ color: "#03CD8C" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Live drivers map
          </Typography>
          <Chip
            size="small"
            label={loading ? "Loading…" : `${drivers.length} active drivers`}
            color="success"
            variant="outlined"
          />
          <Chip size="small" label={`${onlineCount} online`} sx={{ backgroundColor: "#10b981", color: "#fff" }} />
          <Chip size="small" label={`${busyCount} busy`} sx={{ backgroundColor: "#f59e0b", color: "#fff" }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {(["ALL", "ONLINE", "BUSY"] as const).map((value) => (
            <Button
              key={value}
              size="small"
              variant={filter === value ? "contained" : "outlined"}
              onClick={() => setFilter(value)}
              sx={{ textTransform: "none", borderRadius: 2, minWidth: 0 }}
            >
              {value}
            </Button>
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={refreshing}
            onClick={() => void refresh()}
            sx={{ textTransform: "none", borderRadius: 2, ml: 1 }}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </Box>
      </Box>

      {error ? (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#fef2f2" }}>
          <Typography color="error" variant="body2">{error}</Typography>
        </Paper>
      ) : null}

      <Box sx={{ flex: 1, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(148,163,184,0.5)" }}>
        {!isLoaded && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.paper", zIndex: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {loadError ? (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "error.light", zIndex: 2 }}>
            <Typography color="error">Map load error: {loadError.message}</Typography>
          </Box>
        ) : null}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center ?? undefined}
            zoom={zoom}
            onLoad={(map) => { mapRef.current = map; }}
            onUnmount={() => { mapRef.current = null; }}
            onCenterChanged={() => {
              // Only track operator panning once a real center exists; never
              // let the map reset to a hardcoded/empty viewport. Guard against
              // the infinite re-render loop caused by setting state with a new
              // object reference that produces the same numeric coordinates.
              if (!centerRef.current) return;
              const map = mapRef.current;
              if (!map) return;
              const next = map.getCenter();
              if (!next) return;
              const lat = next.lat();
              const lng = next.lng();
              if (
                Math.abs(lat - centerRef.current.lat) < 1e-6 &&
                Math.abs(lng - centerRef.current.lng) < 1e-6
              ) return;
              setCenter({ lat, lng });
            }}
            onZoomChanged={() => {
              const map = mapRef.current;
              if (!map) return;
              const nextZoom = map.getZoom();
              if (typeof nextZoom === "number") setZoom(nextZoom);
            }}
            options={{
              fullscreenControl: false,
              mapTypeControl: true,
              streetViewControl: false,
              mapId: (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "").trim() || undefined,
            }}
          >
            {visibleDrivers.map((driver) => (
              <MarkerF
                key={driver.driverId}
                position={{ lat: driver.latitude, lng: driver.longitude }}
                icon={markerIcon(driver, (window as any).google?.maps)}
                title={`${driver.name ?? driver.driverId} (${driver.availabilityStatus})`}
                onClick={() => setSelected(driver)}
              />
            ))}
            {selected ? (
              <InfoWindowF
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelected(null)}
              >
                <Box sx={{ py: 0.5, minWidth: 200 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {vehicleIcon(selected.vehicleType)} {selected.name ?? selected.driverId}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {selected.plate ? `${selected.plate} · ` : ""}{selected.vehicleType ?? "—"} · {selected.driverId}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Status: {selected.availabilityStatus} · Last seen: {formatLastSeen(selected.lastLocationAt)}
                  </Typography>
                </Box>
              </InfoWindowF>
            ) : null}
          </GoogleMap>
        )}
      </Box>

      <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          Refreshes automatically every 15s{lastUpdated ? ` · Last updated ${formatLastSeen(lastUpdated)}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Typography variant="caption" color="text.secondary">● Online</Typography>
          <Typography variant="caption" color="text.secondary">● Busy</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function Alert({ noKey }: { noKey: boolean }) {
  return (
    <Paper sx={{ p: 3, backgroundColor: "#fffbeb" }}>
      <Typography color="warning.main" sx={{ fontWeight: 600 }}>
        {noKey
          ? "A Google Maps API key is required. Set VITE_GOOGLE_MAPS_API_KEY in Rides-Admin/.env to render the live map."
          : "Map unavailable"}
      </Typography>
    </Paper>
  );
}
