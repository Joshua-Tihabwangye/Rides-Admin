import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  ADMIN_SUMMARY_UPDATED_EVENT,
  createAdminSocket,
  getActiveDrivers,
  getAdminDashboard,
  getAdminMonitoringSnapshot,
  getAdminRiderDemand,
  listAdminMonitoringDrivers,
  listAdminMonitoringFailedDispatches,
  listAdminMonitoringJobs,
  listAdminRides,
  type AdminDashboardCounts,
  type AdminMonitoringDriver,
  type AdminMonitoringFailedDispatch,
  type AdminMonitoringJob,
  type AdminMonitoringSnapshot,
  type AdminRideListItemResponse,
  type AdminRiderDemandSnapshot,
} from "../services/api/adminApi";

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
  serviceType?: string;
  serviceId?: string;
  activeAssignment?: {
    serviceType: "RIDE" | "DELIVERY";
    serviceId: string;
    status?: string;
    pickup?: string;
    destination?: string;
    distanceKm?: number;
    durationMinutes?: number;
    trackingCode?: string;
    routeId?: string;
  };
};

const ACTIVE_RIDE_STATUSES = new Set([
  "SEARCHING",
  "OFFERED",
  "ACCEPTED",
  "ARRIVING",
  "ARRIVED",
  "IN_PROGRESS",
]);
const STATUS_POLL_MS = 10_000;
const MOVEMENT_POLL_MS = 15_000;
const DASHBOARD_POLL_MS = 30_000;
const ACTIVE_DRIVER_LIMIT = 300;

type AdminLiveDataState = {
  drivers: LiveDriverMarker[];
  monitoringSnapshot: AdminMonitoringSnapshot | null;
  monitoringDrivers: AdminMonitoringDriver[];
  rideJobs: AdminMonitoringJob[];
  deliveryJobs: AdminMonitoringJob[];
  failedDispatches: AdminMonitoringFailedDispatch[];
  dashboard: AdminDashboardCounts | null;
  riderDemand: AdminRiderDemandSnapshot | null;
  activeRides: AdminRideListItemResponse[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: (showSpinner?: boolean) => Promise<void>;
};

const AdminLiveDataContext = createContext<AdminLiveDataState | null>(null);

function mergeDriverLocation(
  prev: LiveDriverMarker[],
  location: Partial<LiveDriverMarker> & { driverId?: string },
) {
  if (
    !location.driverId ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  )
    return prev;
  const index = prev.findIndex(
    (driver) => driver.driverId === location.driverId,
  );
  if (index === -1)
    return [
      ...prev,
      {
        ...(location as LiveDriverMarker),
        distanceKm: location.distanceKm ?? 0,
      },
    ];
  const next = [...prev];
  next[index] = {
    ...next[index],
    ...location,
    activeAssignment: location.activeAssignment ?? next[index].activeAssignment,
    serviceType: location.serviceType ?? next[index].serviceType,
    serviceId: location.serviceId ?? next[index].serviceId,
  };
  return next;
}

function normalizeSocketLocation(
  payload: any,
): Partial<LiveDriverMarker> | null {
  const data = payload?.data ?? payload;
  const event = data?.event ?? payload?.event;
  const location = data?.location ?? data;
  if (
    event &&
    event !== "driver.location" &&
    event !== "driver.location.updated"
  )
    return null;
  const driverId = location?.driverId ?? data?.driverId ?? payload?.driverId;
  const latitude = Number(
    location?.latitude ?? data?.latitude ?? payload?.latitude,
  );
  const longitude = Number(
    location?.longitude ?? data?.longitude ?? payload?.longitude,
  );
  if (!driverId || !Number.isFinite(latitude) || !Number.isFinite(longitude))
    return null;
  return {
    ...location,
    driverId,
    latitude,
    longitude,
    serviceType:
      location?.serviceType ?? data?.serviceType ?? payload?.serviceType,
    serviceId: location?.serviceId ?? data?.serviceId ?? payload?.serviceId,
    lastLocationAt:
      location?.lastLocationAt ??
      data?.recordedAt ??
      payload?.recordedAt ??
      new Date().toISOString(),
  };
}

export function AdminLiveDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  // Monitoring and map data is expensive (several joined backend queries). It
  // should only run on live-operations screens, not every admin route.
  const needsLiveOperationsData = [
    "/admin/home",
    "/admin/ops",
    "/admin/monitoring",
    "/admin/live-map",
  ].includes(location.pathname);
  const [drivers, setDrivers] = useState<LiveDriverMarker[]>([]);
  const [monitoringSnapshot, setMonitoringSnapshot] =
    useState<AdminMonitoringSnapshot | null>(null);
  const [monitoringDrivers, setMonitoringDrivers] = useState<
    AdminMonitoringDriver[]
  >([]);
  const [rideJobs, setRideJobs] = useState<AdminMonitoringJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<AdminMonitoringJob[]>([]);
  const [failedDispatches, setFailedDispatches] = useState<
    AdminMonitoringFailedDispatch[]
  >([]);
  const [dashboard, setDashboard] = useState<AdminDashboardCounts | null>(null);
  const [riderDemand, setRiderDemand] =
    useState<AdminRiderDemandSnapshot | null>(null);
  const [activeRides, setActiveRides] = useState<AdminRideListItemResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const statusInFlightRef = useRef<Promise<void> | null>(null);
  const movementInFlightRef = useRef<Promise<void> | null>(null);

  const refreshStatus = useCallback(async () => {
    if (statusInFlightRef.current) return statusInFlightRef.current;
    const request = (async () => {
      try {
        const [snapshot, monitorDrivers] = await Promise.all([
          getAdminMonitoringSnapshot(),
          listAdminMonitoringDrivers(),
        ]);
        setMonitoringSnapshot(snapshot);
        setMonitoringDrivers(monitorDrivers ?? []);
        setLastUpdated(new Date());
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load live driver status");
      } finally {
        setLoading(false);
        statusInFlightRef.current = null;
      }
    })();
    statusInFlightRef.current = request;
    return request;
  }, []);

  const refreshMovement = useCallback(async () => {
    if (movementInFlightRef.current) return movementInFlightRef.current;
    const request = (async () => {
      try {
        const [
          activeDrivers,
          demandData,
          rideJobRows,
          deliveryJobRows,
          failedRows,
          dashboardData,
          ridesData,
        ] = await Promise.all([
          getActiveDrivers(undefined, undefined, 50, ACTIVE_DRIVER_LIMIT),
          getAdminRiderDemand(),
          listAdminMonitoringJobs("ride"),
          listAdminMonitoringJobs("delivery"),
          listAdminMonitoringFailedDispatches(),
          getAdminDashboard(),
          listAdminRides({ page: 1, limit: 100 }),
        ]);
        setDrivers(activeDrivers.drivers ?? []);
        setRiderDemand(demandData);
        setRideJobs(rideJobRows ?? []);
        setDeliveryJobs(deliveryJobRows ?? []);
        setFailedDispatches(failedRows ?? []);
        setDashboard(dashboardData);
        setActiveRides(
          (ridesData.items ?? [])
            .filter((ride) =>
              ACTIVE_RIDE_STATUSES.has(String(ride.status).toUpperCase()),
            )
            .slice(0, 20),
        );
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err?.message ?? "Failed to load live movement data");
      } finally {
        setLoading(false);
        movementInFlightRef.current = null;
      }
    })();
    movementInFlightRef.current = request;
    return request;
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const dashboardData = await getAdminDashboard();
      setDashboard(dashboardData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load admin summary");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setRefreshing(true);
      try {
        if (needsLiveOperationsData) {
          await Promise.all([refreshStatus(), refreshMovement()]);
        } else {
          await refreshDashboard();
        }
      } finally {
        if (showSpinner) setRefreshing(false);
      }
    },
    [needsLiveOperationsData, refreshDashboard, refreshMovement, refreshStatus],
  );

  useEffect(() => {
    void refresh();
    if (!needsLiveOperationsData) {
      const dashboardInterval = window.setInterval(
        () => void refreshDashboard(),
        DASHBOARD_POLL_MS,
      );
      return () => window.clearInterval(dashboardInterval);
    }
    const statusInterval = window.setInterval(() => void refreshStatus(), STATUS_POLL_MS);
    const movementInterval = window.setInterval(() => void refreshMovement(), MOVEMENT_POLL_MS);
    return () => {
      window.clearInterval(statusInterval);
      window.clearInterval(movementInterval);
    };
  }, [needsLiveOperationsData, refresh, refreshDashboard, refreshMovement, refreshStatus]);

  useEffect(() => {
    const refreshActionSummary = () => void refreshDashboard();
    window.addEventListener(ADMIN_SUMMARY_UPDATED_EVENT, refreshActionSummary);
    return () => window.removeEventListener(ADMIN_SUMMARY_UPDATED_EVENT, refreshActionSummary);
  }, [refreshDashboard]);

  useEffect(() => {
    if (!needsLiveOperationsData) return undefined;
    const socket = createAdminSocket();
    const onDriverLocation = (payload: any) => {
      const location = normalizeSocketLocation(payload);
      if (!location) return;
      setDrivers((prev) => mergeDriverLocation(prev, location));
      setLastUpdated(new Date());
    };
    const requestFastRefresh = () => {
      void refreshStatus();
      void refreshMovement();
    };
    const onDomainEvent = (payload: { topic?: string; eventType?: string }) => {
      if (
        payload?.topic === "matching" ||
        String(payload?.eventType ?? "").startsWith("matching.")
      ) {
        requestFastRefresh();
      }
    };
    socket.on("service.updated", onDriverLocation);
    socket.on("operations.service.updated", onDriverLocation);
    socket.on("driver.location.updated", onDriverLocation);
    socket.on("driver.availability_updated", requestFastRefresh);
    socket.on("driver.availability.changed", requestFastRefresh);
    socket.on("ride.created", requestFastRefresh);
    socket.on("ride.updated", requestFastRefresh);
    socket.on("delivery.updated", requestFastRefresh);
    socket.on("domain.event", onDomainEvent);
    socket.connect();
    return () => {
      socket.off("service.updated", onDriverLocation);
      socket.off("operations.service.updated", onDriverLocation);
      socket.off("driver.location.updated", onDriverLocation);
      socket.off("driver.availability_updated", requestFastRefresh);
      socket.off("driver.availability.changed", requestFastRefresh);
      socket.off("ride.created", requestFastRefresh);
      socket.off("ride.updated", requestFastRefresh);
      socket.off("delivery.updated", requestFastRefresh);
      socket.off("domain.event", onDomainEvent);
      socket.disconnect();
    };
  }, [needsLiveOperationsData, refreshMovement, refreshStatus]);

  const value = useMemo<AdminLiveDataState>(
    () => ({
      drivers,
      monitoringSnapshot,
      monitoringDrivers,
      rideJobs,
      deliveryJobs,
      failedDispatches,
      dashboard,
      riderDemand,
      activeRides,
      loading,
      refreshing,
      error,
      lastUpdated,
      refresh,
    }),
    [
      activeRides,
      dashboard,
      deliveryJobs,
      drivers,
      error,
      failedDispatches,
      lastUpdated,
      loading,
      monitoringDrivers,
      monitoringSnapshot,
      refresh,
      refreshing,
      rideJobs,
      riderDemand,
    ],
  );

  return (
    <AdminLiveDataContext.Provider value={value}>
      {children}
    </AdminLiveDataContext.Provider>
  );
}

export function useAdminLiveData(): AdminLiveDataState {
  const value = useContext(AdminLiveDataContext);
  if (!value)
    throw new Error(
      "useAdminLiveData must be used inside AdminLiveDataProvider",
    );
  return value;
}
