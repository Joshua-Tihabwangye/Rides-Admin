import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createAdminSocket,
  getActiveDrivers,
  getAdminDashboard,
  getAdminMonitoringSnapshot,
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

const ACTIVE_RIDE_STATUSES = new Set(["SEARCHING", "OFFERED", "ACCEPTED", "ARRIVING", "ARRIVED", "IN_PROGRESS"]);
const STATUS_POLL_MS = 2_000;
const MOVEMENT_POLL_MS = 5_000;
const ACTIVE_DRIVER_LIMIT = 300;

type AdminLiveDataState = {
  drivers: LiveDriverMarker[];
  monitoringSnapshot: AdminMonitoringSnapshot | null;
  monitoringDrivers: AdminMonitoringDriver[];
  rideJobs: AdminMonitoringJob[];
  deliveryJobs: AdminMonitoringJob[];
  failedDispatches: AdminMonitoringFailedDispatch[];
  dashboard: AdminDashboardCounts | null;
  activeRides: AdminRideListItemResponse[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: (showSpinner?: boolean) => Promise<void>;
};

const AdminLiveDataContext = createContext<AdminLiveDataState | null>(null);

function mergeDriverLocation(prev: LiveDriverMarker[], location: Partial<LiveDriverMarker> & { driverId?: string }) {
  if (!location.driverId || typeof location.latitude !== "number" || typeof location.longitude !== "number") return prev;
  const index = prev.findIndex((driver) => driver.driverId === location.driverId);
  if (index === -1) return [...prev, { ...(location as LiveDriverMarker), distanceKm: location.distanceKm ?? 0 }];
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

function normalizeSocketLocation(payload: any): Partial<LiveDriverMarker> | null {
  const data = payload?.data ?? payload;
  const event = data?.event ?? payload?.event;
  const location = data?.location ?? data;
  if (event && event !== "driver.location" && event !== "driver.location.updated") return null;
  const driverId = location?.driverId ?? data?.driverId ?? payload?.driverId;
  const latitude = Number(location?.latitude ?? data?.latitude ?? payload?.latitude);
  const longitude = Number(location?.longitude ?? data?.longitude ?? payload?.longitude);
  if (!driverId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    ...location,
    driverId,
    latitude,
    longitude,
    serviceType: location?.serviceType ?? data?.serviceType ?? payload?.serviceType,
    serviceId: location?.serviceId ?? data?.serviceId ?? payload?.serviceId,
    lastLocationAt: location?.lastLocationAt ?? data?.recordedAt ?? payload?.recordedAt ?? new Date().toISOString(),
  };
}

export function AdminLiveDataProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<LiveDriverMarker[]>([]);
  const [monitoringSnapshot, setMonitoringSnapshot] = useState<AdminMonitoringSnapshot | null>(null);
  const [monitoringDrivers, setMonitoringDrivers] = useState<AdminMonitoringDriver[]>([]);
  const [rideJobs, setRideJobs] = useState<AdminMonitoringJob[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<AdminMonitoringJob[]>([]);
  const [failedDispatches, setFailedDispatches] = useState<AdminMonitoringFailedDispatch[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboardCounts | null>(null);
  const [activeRides, setActiveRides] = useState<AdminRideListItemResponse[]>([]);
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
        const [activeDrivers, rideJobRows, deliveryJobRows, failedRows, dashboardData, ridesData] = await Promise.all([
          getActiveDrivers(undefined, undefined, 50, ACTIVE_DRIVER_LIMIT),
          listAdminMonitoringJobs("ride"),
          listAdminMonitoringJobs("delivery"),
          listAdminMonitoringFailedDispatches(),
          getAdminDashboard(),
          listAdminRides({ page: 1, limit: 100 }),
        ]);
        setDrivers(activeDrivers.drivers ?? []);
        setRideJobs(rideJobRows ?? []);
        setDeliveryJobs(deliveryJobRows ?? []);
        setFailedDispatches(failedRows ?? []);
        setDashboard(dashboardData);
        setActiveRides(
          (ridesData.items ?? [])
            .filter((ride) => ACTIVE_RIDE_STATUSES.has(String(ride.status).toUpperCase()))
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

  const refresh = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      await Promise.all([refreshStatus(), refreshMovement()]);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [refreshMovement, refreshStatus]);

  useEffect(() => {
    void refreshStatus();
    void refreshMovement();
    const statusInterval = window.setInterval(() => void refreshStatus(), STATUS_POLL_MS);
    const movementInterval = window.setInterval(() => void refreshMovement(), MOVEMENT_POLL_MS);
    return () => {
      window.clearInterval(statusInterval);
      window.clearInterval(movementInterval);
    };
  }, [refreshMovement, refreshStatus]);

  useEffect(() => {
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
    socket.on("service.updated", onDriverLocation);
    socket.on("operations.service.updated", onDriverLocation);
    socket.on("driver.location.updated", onDriverLocation);
    socket.on("ride.created", requestFastRefresh);
    socket.on("ride.updated", requestFastRefresh);
    socket.on("delivery.updated", requestFastRefresh);
    socket.connect();
    return () => {
      socket.off("service.updated", onDriverLocation);
      socket.off("operations.service.updated", onDriverLocation);
      socket.off("driver.location.updated", onDriverLocation);
      socket.off("ride.created", requestFastRefresh);
      socket.off("ride.updated", requestFastRefresh);
      socket.off("delivery.updated", requestFastRefresh);
      socket.disconnect();
    };
  }, [refreshMovement, refreshStatus]);

  const value = useMemo<AdminLiveDataState>(() => ({
    drivers,
    monitoringSnapshot,
    monitoringDrivers,
    rideJobs,
    deliveryJobs,
    failedDispatches,
    dashboard,
    activeRides,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  }), [activeRides, dashboard, deliveryJobs, drivers, error, failedDispatches, lastUpdated, loading, monitoringDrivers, monitoringSnapshot, refresh, refreshing, rideJobs]);

  return <AdminLiveDataContext.Provider value={value}>{children}</AdminLiveDataContext.Provider>;
}

export function useAdminLiveData(): AdminLiveDataState {
  const value = useContext(AdminLiveDataContext);
  if (!value) throw new Error("useAdminLiveData must be used inside AdminLiveDataProvider");
  return value;
}
