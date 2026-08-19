import carTopView from "../assets/vehicles/markers/car_top_view_vector.svg?raw";
import motorcycleTopView from "../assets/vehicles/markers/motorcycle_rider_vector.svg?raw";

export type DriverVehicleKind = "car" | "bike";

const TWO_WHEELED: ReadonlySet<string> = new Set([
  "BICYCLE",
  "BIKE",
  "MOTORCYCLE",
  "SCOOTER",
]);

const VEHICLE_RAW_SVG: Record<DriverVehicleKind, string> = {
  car: carTopView,
  bike: motorcycleTopView,
};

const VEHICLE_SIZES: Record<DriverVehicleKind, [number, number]> = {
  car: [58, 40],
  bike: [42, 54],
};

const VEHICLE_VIEWBOX: Record<DriverVehicleKind, string> = {
  car: "0 0 560 350",
  bike: "0 0 600 600",
};

export function driverVehicleKind(vehicleType?: string): DriverVehicleKind {
  if (vehicleType && TWO_WHEELED.has(vehicleType.toUpperCase())) return "bike";
  return "car";
}

function svgInner(raw: string): string {
  const openEnd = raw.indexOf(">");
  const closeStart = raw.lastIndexOf("</svg>");
  if (openEnd < 0 || closeStart < 0) return raw;
  return raw.slice(openEnd + 1, closeStart);
}

export function vehicleMarkerIconUrl(kind: DriverVehicleKind, heading?: number | null, isBusy = false): string {
  const raw = VEHICLE_RAW_SVG[kind];
  const rotation = typeof heading === "number" && Number.isFinite(heading) ? heading : 0;
  const viewBox = VEHICLE_VIEWBOX[kind];
  const [vbW, vbH] = viewBox.split(" ").slice(2).map(Number);
  const cx = vbW / 2;
  const cy = vbH / 2;
  // The Google Maps marker API cannot rotate icons, so the heading is baked
  // into the SVG itself: the vehicle art (drawn facing north) is rotated
  // around the center of the viewBox. The halo is a translucent ring so
  // vehicles stay visible on any map background.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
    `<circle cx="${cx}" cy="${cy}" r="${Math.max(vbW, vbH) / 2 - 6}" fill="none" stroke="${isBusy ? "#f59e0b" : "#ffffff"}" stroke-width="6" stroke-opacity="0.9" />` +
    `<g transform="rotate(${rotation} ${cx} ${cy})">${svgInner(raw)}</g>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function vehicleMarkerAnchor(kind: DriverVehicleKind, google: any) {
  const [width, height] = VEHICLE_SIZES[kind];
  return google ? new google.maps.Point(width / 2, height / 2) : { x: width / 2, y: height / 2 };
}

export function vehicleMarkerSize(kind: DriverVehicleKind, google: any) {
  const [width, height] = VEHICLE_SIZES[kind];
  return google ? new google.maps.Size(width, height) : { width, height };
}