import { useMemo } from "react";
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from "@react-google-maps/api";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { AdminRideStopResponse } from "../../services/api/adminApi";

type MapPoint = { lat: number; lng: number };

const markerColorByType: Record<string, string> = {
  PICKUP: "#10b981",
  DROPOFF: "#ef4444",
  STOP: "#3b82f6",
  RETURN: "#f59e0b",
};

function mapsLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export default function RideRouteMap({ stops, route }: { stops: AdminRideStopResponse[]; route?: Record<string, unknown> }) {
  const rawApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  const googleMapsApiKey = rawApiKey && !/^https?:\/\//i.test(rawApiKey) ? rawApiKey : "";
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey });

  const ordered = useMemo(() => [...stops].sort((a, b) => a.sequence - b.sequence), [stops]);
  const geoStops = useMemo(
    () => ordered.filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude) && !(s.latitude === 0 && s.longitude === 0)),
    [ordered],
  );
  const routePoints = useMemo<MapPoint[]>(() => {
    const raw = route?.path ?? route?.points ?? route?.polyline;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((point) => {
      if (!point || typeof point !== "object") return [];
      const value = point as Record<string, unknown>;
      const lat = Number(value.lat ?? value.latitude);
      const lng = Number(value.lng ?? value.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : [];
    });
  }, [route]);
  const points = useMemo<MapPoint[]>(
    () => routePoints.length > 1 ? routePoints : geoStops.map((s) => ({ lat: s.latitude, lng: s.longitude })),
    [geoStops, routePoints],
  );

  const center = useMemo<MapPoint | undefined>(() => {
    if (points.length === 0) return undefined;
    return {
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
    };
  }, [points]);

  const fitBounds = useMemo(() => {
    if (!isLoaded || points.length === 0) return undefined;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
    return bounds;
  }, [isLoaded, points]);

  if (!googleMapsApiKey) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">
          Interactive map unavailable — set VITE_GOOGLE_MAPS_API_KEY to enable. Stop coordinates:
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
          {ordered.map((stop) => (
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
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          Map load error: {loadError.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      {isLoaded && (
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
                path: google.maps.SymbolPath.CIRCLE,
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
  );
}
