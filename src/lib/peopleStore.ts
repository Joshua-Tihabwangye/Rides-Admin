export type PrimaryStatus = 'approved' | 'under_review' | 'suspended'
export type ActivityStatus = 'active' | 'inactive'

export type RiderRecord = {
  id: number
  name: string
  phone: string
  city: string
  vehicle: string
  vehicleType: 'Bike' | 'Car'
  trips: number
  spend: string
  risk: 'Low' | 'High'
  primaryStatus: PrimaryStatus
  activityStatus: ActivityStatus
}

export type DriverRecord = {
  id: number
  name: string
  phone: string
  city: string
  vehicle: string
  vehicleType: 'Bike' | 'Car'
  trips: number
  spend: string
  risk: 'Low' | 'High'
  primaryStatus: PrimaryStatus
  activityStatus: ActivityStatus
}

const RIDERS_KEY = 'evzone_admin_riders'
const DRIVERS_KEY = 'evzone_admin_drivers'

const seedRiders: RiderRecord[] = [
  {
    id: 101,
    name: 'Alice Johnson',
    phone: '+250 788 123 456',
    city: 'Kigali',
    vehicle: 'EV Bike · K-101',
    vehicleType: 'Bike',
    trips: 125,
    spend: '$2,450',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'active',
  },
  {
    id: 102,
    name: 'Bob Smith',
    phone: '+250 788 654 321',
    city: 'Kigali',
    vehicle: 'EV Bike · K-102',
    vehicleType: 'Bike',
    trips: 89,
    spend: '$1,780',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'active',
  },
  {
    id: 103,
    name: 'Charlie Brown',
    phone: '+250 788 987 654',
    city: 'Musanze',
    vehicle: 'EV Bike · M-103',
    vehicleType: 'Bike',
    trips: 45,
    spend: '$890',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'inactive',
  },
]

const seedDrivers: DriverRecord[] = [
  {
    id: 201,
    name: 'Michael Driver',
    phone: '+256 701 111 111',
    city: 'Kampala',
    vehicle: 'EV Car · UAX 123X',
    vehicleType: 'Car',
    trips: 420,
    spend: '$8,200',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'active',
  },
  {
    id: 202,
    name: 'Sarah K.',
    phone: '+234 801 222 2222',
    city: 'Lagos',
    vehicle: 'EV Car · L-321',
    vehicleType: 'Car',
    trips: 315,
    spend: '$6,150',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'active',
  },
  {
    id: 203,
    name: 'Peter L.',
    phone: '+254 702 333 333',
    city: 'Nairobi',
    vehicle: 'EV Car · KAX 456L',
    vehicleType: 'Car',
    trips: 285,
    spend: '$5,550',
    risk: 'Low',
    primaryStatus: 'approved',
    activityStatus: 'active',
  },
]

function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function writeToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export function getRiders(): RiderRecord[] {
  return readFromStorage<RiderRecord[]>(RIDERS_KEY, seedRiders)
}

export function getRider(id: number): RiderRecord | undefined {
  return getRiders().find((r) => r.id === id)
}

export function upsertRider(record: RiderRecord) {
  const riders = getRiders()
  const idx = riders.findIndex((r) => r.id === record.id)
  if (idx >= 0) riders[idx] = record
  else riders.push(record)
  writeToStorage(RIDERS_KEY, riders)
}

export function createRider(partial: Omit<RiderRecord, 'id'>): RiderRecord {
  const riders = getRiders()
  const nextId = riders.length ? Math.max(...riders.map((r) => r.id)) + 1 : 100
  const record: RiderRecord = { 
    id: nextId, 
    vehicle: partial.vehicle || 'EV Bike',
    vehicleType: partial.vehicleType || 'Bike',
    ...partial 
  }
  riders.push(record)
  writeToStorage(RIDERS_KEY, riders)
  return record
}

export function getDrivers(): DriverRecord[] {
  return readFromStorage<DriverRecord[]>(DRIVERS_KEY, seedDrivers)
}

export function getDriver(id: number): DriverRecord | undefined {
  return getDrivers().find((d) => d.id === id)
}

export function upsertDriver(record: DriverRecord) {
  const drivers = getDrivers()
  const idx = drivers.findIndex((d) => d.id === record.id)
  if (idx >= 0) drivers[idx] = record
  else drivers.push(record)
  writeToStorage(DRIVERS_KEY, drivers)
}


