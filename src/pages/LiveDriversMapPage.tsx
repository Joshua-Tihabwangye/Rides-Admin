import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GoogleMap,
  HeatmapLayerF,
  InfoWindowF,
  MarkerF,
  useJsApiLoader,
  type Libraries,
} from "@react-google-maps/api";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import RefreshIcon from "@mui/icons-material/Refresh";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { requestBrowserCenter } from "../utils/browserLocation";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { useNavigate } from "react-router-dom";
import {
  useAdminLiveData,
  type LiveDriverMarker,
} from "../components/AdminLiveDataProvider";
import MapErrorBoundary from "../components/MapErrorBoundary";
import {
  driverVehicleKind,
  vehicleDisplayCategory,
  vehicleMarkerAnchor,
  vehicleMarkerIconUrl,
  vehicleMarkerSize,
} from "../utils/vehicleMarkerIcons";

const GOOGLE_MAP_LIBRARIES: Libraries = ["visualization"];
type MapMode = "DRIVERS" | "RIDER_DEMAND";

function vehicleIcon(vehicleType?: string) {
  const category = vehicleDisplayCategory(vehicleType);
  if (category === "bike") return <TwoWheelerIcon fontSize="small" />;
  if (category === "shipping") return <LocalShippingIcon fontSize="small" />;
  return <DirectionsCarIcon fontSize="small" />;
}

function markerIcon(driver: LiveDriverMarker, google: any) {
  const kind = driverVehicleKind(driver.vehicleType);
  const safeGoogle =
    typeof google !== "undefined" && google?.maps ? google : null;
  return {
    url: vehicleMarkerIconUrl(kind, driver.heading, driver.availabilityStatus),
    anchor: vehicleMarkerAnchor(kind, safeGoogle),
    scaledSize: vehicleMarkerSize(kind, safeGoogle),
  };
}

function formatLastSeen(value?: string | Date | null) {
  if (!value) return "—";
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function formatAssignmentDistance(driver: LiveDriverMarker) {
  const distance = driver.activeAssignment?.distanceKm;
  if (
    typeof distance === "number" &&
    Number.isFinite(distance) &&
    distance > 0
  ) {
    return `${distance.toFixed(1)} km`;
  }
  return null;
}

function formatAssignmentDuration(driver: LiveDriverMarker) {
  const duration = driver.activeAssignment?.durationMinutes;
  if (
    typeof duration === "number" &&
    Number.isFinite(duration) &&
    duration > 0
  ) {
    return `${Math.round(duration)} min`;
  }
  return null;
}

export default function LiveDriversMapPage() {
  const navigate = useNavigate();
  const rawApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
  const googleMapsApiKey =
    rawApiKey && !/^https?:\/\//i.test(rawApiKey) ? rawApiKey : "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "live-drivers-map",
    googleMapsApiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
    // Do not set preventGoogleFontsLoading: it patches document.head and drops
    // every empty <style> Emotion inserts afterwards, leaving MUI unstyled.
  });

  const {
    drivers,
    riderDemand,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: refreshLiveData,
  } = useAdminLiveData();
  const [selected, setSelected] = useState<LiveDriverMarker | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("DRIVERS");
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [zoom, setZoom] = useState(12);
  const [filter, setFilter] = useState<"ALL" | "ONLINE" | "BUSY">("ALL");
  const mapRef = useRef<any>(null);
  const centerRef = useRef(center);
  centerRef.current = center;
  const abortCtrl = useRef<AbortController | null>(null);
  const demandPoints = useMemo(
    () => riderDemand?.points ?? [],
    [riderDemand?.points],
  );

  useEffect(() => {
    abortCtrl.current = new AbortController();
    requestBrowserCenter().then((gpsCenter) => {
      if (!abortCtrl.current?.signal.aborted && gpsCenter) setCenter(gpsCenter);
    });
    return () => {
      abortCtrl.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (centerRef.current) return;
    if (mapMode === "RIDER_DEMAND" && demandPoints.length > 0) {
      const first = demandPoints[0];
      setCenter({ lat: first.latitude, lng: first.longitude });
      return;
    }
    if (drivers.length > 0) {
      const first = drivers[0];
      setCenter({ lat: first.latitude, lng: first.longitude });
    }
  }, [demandPoints, drivers, mapMode]);

  useEffect(() => {
    if (!selected) return;
    const fresh = drivers.find(
      (driver) => driver.driverId === selected.driverId,
    );
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [drivers, selected]);

  const refresh = useCallback(
    async (silent = false) => {
      await refreshLiveData(!silent);
    },
    [refreshLiveData],
  );

  useEffect(() => {
    return () => abortCtrl.current?.abort();
  }, []);

  const visibleDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) => filter === "ALL" || driver.availabilityStatus === filter,
      ),
    [drivers, filter],
  );
  const driverMarkerEntries = useMemo(
    () =>
      visibleDrivers.map((driver) => ({
        driver,
        icon: markerIcon(driver, isLoaded ? (window as any).google : null),
      })),
    [visibleDrivers, isLoaded],
  );
  const heatmapData = useMemo(() => {
    const google = isLoaded ? (window as any).google : null;
    if (!google?.maps || mapMode !== "RIDER_DEMAND") return [];
    return demandPoints.map((point) => ({
      location: new google.maps.LatLng(point.latitude, point.longitude),
      weight: point.weight,
    }));
  }, [demandPoints, isLoaded, mapMode]);

  useEffect(() => {
    if (
      mapMode !== "RIDER_DEMAND" ||
      !isLoaded ||
      demandPoints.length === 0 ||
      !mapRef.current
    )
      return;
    const google = (window as any).google;
    if (!google?.maps) return;
    const bounds = new google.maps.LatLngBounds();
    demandPoints.forEach((point) =>
      bounds.extend({ lat: point.latitude, lng: point.longitude }),
    );
    mapRef.current.fitBounds(bounds, 56);
  }, [demandPoints, isLoaded, mapMode]);

  const onlineCount = useMemo(
    () => drivers.filter((d) => d.availabilityStatus === "ONLINE").length,
    [drivers],
  );
  const busyCount = useMemo(
    () => drivers.filter((d) => d.availabilityStatus === "BUSY").length,
    [drivers],
  );

  if (!googleMapsApiKey) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Live drivers map
        </Typography>
        <Alert severity="warning">
          Set VITE_GOOGLE_MAPS_API_KEY to load the live operations map.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: { xs: 2, md: 4 },
        pb: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBackIcon />}
            size="small"
            sx={{ textTransform: "none" }}
          >
            Back
          </Button>
          <MyLocationIcon sx={{ color: "#03CD8C" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Live operations map
          </Typography>
          {mapMode === "DRIVERS" ? (
            <>
              <Chip
                size="small"
                label={
                  loading ? "Loading…" : `${drivers.length} active drivers`
                }
                color="success"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`${onlineCount} online`}
                sx={{ backgroundColor: "#10b981", color: "#fff" }}
              />
              <Chip
                size="small"
                label={`${busyCount} busy`}
                sx={{ backgroundColor: "#f59e0b", color: "#fff" }}
              />
            </>
          ) : (
            <>
              <Chip
                size="small"
                label={
                  loading
                    ? "Loading…"
                    : `${riderDemand?.total ?? 0} waiting clients`
                }
                color="warning"
                variant="outlined"
              />
              {Object.entries(riderDemand?.byService ?? {}).map(
                ([service, count]) => (
                  <Chip
                    key={service}
                    size="small"
                    label={`${service.replace(/_/g, " ")} ${count}`}
                    variant="outlined"
                  />
                ),
              )}
            </>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={mapMode}
            onChange={(_, value: MapMode | null) => {
              if (value) {
                setMapMode(value);
                setSelected(null);
              }
            }}
            aria-label="Map data"
          >
            <ToggleButton value="DRIVERS" aria-label="Drivers">
              <DirectionsCarIcon fontSize="small" sx={{ mr: 0.75 }} /> Drivers
            </ToggleButton>
            <ToggleButton value="RIDER_DEMAND" aria-label="Rider demand">
              <PeopleAltIcon fontSize="small" sx={{ mr: 0.75 }} /> Rider demand
            </ToggleButton>
          </ToggleButtonGroup>
          {mapMode === "DRIVERS"
            ? (["ALL", "ONLINE", "BUSY"] as const).map((value) => (
                <Button
                  key={value}
                  size="small"
                  variant={filter === value ? "contained" : "outlined"}
                  onClick={() => setFilter(value)}
                  sx={{ textTransform: "none", borderRadius: 2, minWidth: 0 }}
                >
                  {value}
                </Button>
              ))
            : null}
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
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Paper>
      ) : null}

      <Box
        sx={{
          flex: 1,
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.5)",
        }}
      >
        <MapErrorBoundary>
          {!isLoaded && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "background.paper",
                zIndex: 2,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {loadError ? (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "error.light",
                zIndex: 2,
              }}
            >
              <Typography color="error">
                Map load error: {loadError.message}
              </Typography>
            </Box>
          ) : null}
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={center ?? undefined}
              zoom={zoom}
              onLoad={(map) => {
                mapRef.current = map;
              }}
              onUnmount={() => {
                mapRef.current = null;
              }}
              onCenterChanged={() => {
                // Only track operator panning once a real center exists. Guard against
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
                )
                  return;
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
                mapId:
                  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "").trim() ||
                  undefined,
              }}
            >
              {mapMode === "RIDER_DEMAND" && heatmapData.length > 0 ? (
                <HeatmapLayerF
                  data={heatmapData}
                  options={{
                    radius: 34,
                    opacity: 0.82,
                    dissipating: true,
                    gradient: [
                      "rgba(3,205,140,0)",
                      "rgba(3,205,140,0.55)",
                      "rgba(250,204,21,0.72)",
                      "rgba(249,115,22,0.86)",
                      "rgba(239,68,68,1)",
                    ],
                  }}
                />
              ) : null}
              {mapMode === "DRIVERS"
                ? driverMarkerEntries.map(({ driver, icon }) => (
                    <MarkerF
                      key={driver.driverId}
                      position={{ lat: driver.latitude, lng: driver.longitude }}
                      icon={icon}
                      title={`${driver.name ?? driver.driverId} (${driver.availabilityStatus})`}
                      onClick={() => setSelected(driver)}
                    />
                  ))
                : null}
              {mapMode === "DRIVERS" && selected ? (
                <InfoWindowF
                  position={{ lat: selected.latitude, lng: selected.longitude }}
                  onCloseClick={() => setSelected(null)}
                >
                  <Box sx={{ py: 0.5, minWidth: 240 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {vehicleIcon(selected.vehicleType)}{" "}
                        {selected.name ?? selected.driverId}
                      </Typography>
                      <Chip
                        size="small"
                        label={selected.availabilityStatus}
                        sx={{
                          backgroundColor:
                            selected.availabilityStatus === "BUSY"
                              ? "#f59e0b"
                              : "#10b981",
                          color: "#fff",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {selected.plate ? `${selected.plate} · ` : ""}
                      {selected.vehicleType ?? "—"} · {selected.driverId}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Status: {selected.availabilityStatus} · Last seen:{" "}
                      {formatLastSeen(selected.lastLocationAt)}
                    </Typography>
                    {selected.availabilityStatus === "BUSY" && (
                      <Box
                        sx={{
                          mt: 1,
                          mb: 1,
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: "#fffbeb",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <Typography
                          variant="caption"
                          display="block"
                          color="warning.dark"
                          sx={{ fontWeight: 800, textTransform: "uppercase" }}
                        >
                          Active{" "}
                          {selected.activeAssignment?.serviceType?.toLowerCase() ||
                            selected.serviceType?.toLowerCase() ||
                            "job"}
                        </Typography>
                        {selected.activeAssignment ? (
                          <>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              Status:{" "}
                              {selected.activeAssignment.status ||
                                "In progress"}
                              {selected.activeAssignment.trackingCode
                                ? ` · ${selected.activeAssignment.trackingCode}`
                                : ""}
                            </Typography>
                            {selected.activeAssignment.pickup ? (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                              >
                                Pickup: {selected.activeAssignment.pickup}
                              </Typography>
                            ) : null}
                            {selected.activeAssignment.destination ? (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                              >
                                Destination:{" "}
                                {selected.activeAssignment.destination}
                              </Typography>
                            ) : null}
                            {formatAssignmentDistance(selected) ||
                            formatAssignmentDuration(selected) ? (
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary"
                              >
                                {[
                                  formatAssignmentDistance(selected),
                                  formatAssignmentDuration(selected),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </Typography>
                            ) : null}
                          </>
                        ) : (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            Driver is busy, but route details are not available
                            yet.
                          </Typography>
                        )}
                      </Box>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setSelected(null);
                        navigate(`/admin/drivers/${selected.driverId}`);
                      }}
                      sx={{ mt: 1, width: "100%" }}
                    >
                      View driver details
                    </Button>
                  </Box>
                </InfoWindowF>
              ) : null}
            </GoogleMap>
          )}
        </MapErrorBoundary>
        {isLoaded && mapMode === "RIDER_DEMAND" && demandPoints.length === 0 ? (
          <Paper
            elevation={2}
            sx={{
              position: "absolute",
              left: 16,
              bottom: 16,
              zIndex: 2,
              px: 2,
              py: 1.25,
              pointerEvents: "none",
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              No clients are currently waiting for service.
            </Typography>
          </Paper>
        ) : null}
      </Box>

      <Box
        sx={{
          mt: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Live backend data refreshes every 5s
          {lastUpdated ? ` · Last updated ${formatLastSeen(lastUpdated)}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          {mapMode === "DRIVERS" ? (
            <>
              <Typography variant="caption" color="text.secondary">
                ● Online
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ● Busy
              </Typography>
            </>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Green to red indicates increasing client demand
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
