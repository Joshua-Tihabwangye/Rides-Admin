import { useMemo } from "react";
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Box, Chip, Stack, Typography } from "@mui/material";
import MapErrorBoundary from "../MapErrorBoundary";
import type { AdminRideStopResponse } from "../../services/api/adminApi";
import {
  rideRouteMapCenter,
  rideRouteMapPoints,
  validRideRouteStops,
  type MapPoint,
} from "./rideRouteMapModel";

const markerColorByType: Record<string, string> = {
  PICKUP: "#10b981",
  DROPOFF: "#ef4444",
  STOP: "#3b82f6",
  RETURN: "#f59e0b",
};

function mapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function getGoogleMaps(): typeof google.maps | null {
  return typeof globalThis !== "undefined" ? globalThis.google?.maps ?? null : null;
}

function resolveGoogleMapsApiKey(): string {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
}

function CoordinateFallback({
  stops,
  message,
}: {
  stops: AdminRideStopResponse[];
  message: string;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {message}
      </Typography>
      {stops.length > 0 ? (
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          {stops.map((stop) => (
            <Chip
              key={stop.id}
              size="small"
              component="a"
              href={mapsLink(stop.latitude, stop.longitude)}
              target="_blank"
              rel="noreferrer"
              clickable
              label={`${stop.type} ${String(stop.sequence)} · ${stop.latitude.toFixed(6)}, ${stop.longitude.toFixed(6)}`}
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No valid stop coordinates are available.
        </Typography>
      )}
    </Box>
  );
}

export default function RideRouteMap({ stops, route }: { stops: AdminRideStopResponse[]; route?: Record<string, unknown> }) {
  const googleMapsApiKey = resolveGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "ride-route-map",
    googleMapsApiKey,
    preventGoogleFontsLoading: true,
    version: "weekly",
  });
  const googleMaps = isLoaded ? getGoogleMaps() : null;
  const mapsReady = Boolean(googleMaps);

  const ordered = useMemo(() => [...stops].sort((a, b) => a.sequence - b.sequence), [stops]);
  const geoStops = useMemo(() => validRideRouteStops(ordered), [ordered]);
  const points = useMemo<MapPoint[]>(() => rideRouteMapPoints(ordered, route), [ordered, route]);

  const center = useMemo<MapPoint | undefined>(() => rideRouteMapCenter(points), [points]);

  const fitBounds = useMemo(() => {
    if (points.length === 0 || !googleMaps) return undefined;
    const bounds = new googleMaps.LatLngBounds();
    points.forEach((p) => bounds.extend(new googleMaps.LatLng(p.lat, p.lng)));
    return bounds;
  }, [googleMaps, points]);

  if (!googleMapsApiKey) {
    return (
      <CoordinateFallback
        stops={geoStops}
        message="Interactive map unavailable — set VITE_GOOGLE_MAPS_API_KEY to enable. Stop coordinates:"
      />
    );
  }

  if (!isLoaded && !loadError) {
    return (
      <Box
        sx={{
          width: "100%",
          height: 340,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.50",
        }}
      >
        <Typography variant="caption" color="text.secondary">Loading map…</Typography>
      </Box>
    );
  }

  if (isLoaded && !mapsReady) {
    return (
      <CoordinateFallback
        stops={geoStops}
        message="Interactive map unavailable. Stop coordinates:"
      />
    );
  }

  if (loadError && !isLoaded) {
    return (
      <Box>
        <Typography variant="body2" color="error">
          Map load error: {loadError.message}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <CoordinateFallback
            stops={geoStops}
            message="Use stop coordinates while the interactive map is unavailable:"
          />
        </Box>
      </Box>
    );
  }

  return (
    <MapErrorBoundary>
      <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        {mapsReady && googleMaps && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: 340 }}
            center={center ?? { lat: 0.3476, lng: 32.5825 }}
            zoom={center ? 13 : 10}
            options={{
              fullscreenControl: false,
              mapTypeControl: false,
              streetViewControl: false,
            }}
            onLoad={(map) => {
              if (fitBounds) map.fitBounds(fitBounds);
            }}
          >
            {points.length > 1 && (
              <PolylineF
                path={points}
                options={{
                  strokeColor: "#0ea5e9",
                  strokeOpacity: 0.85,
                  strokeWeight: 4,
                }}
              />
            )}
            {geoStops.map((stop) => (
              <MarkerF
                key={stop.id}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                title={`${stop.type} #${stop.sequence}: ${stop.address || ""}`}
                label={{
                  text: String(stop.sequence),
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
                icon={{
                  path: googleMaps.SymbolPath.CIRCLE,
                  scale: 13,
                  fillColor: markerColorByType[stop.type] ?? "#0ea5e9",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }}
              />
            ))}
          </GoogleMap>
        )}
      </Box>
    </MapErrorBoundary>
  );
}
