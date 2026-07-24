import { request } from "./httpClient";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MarketplaceProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  optionValues?: Record<string, unknown>;
  unitPrice: number;
  currency: string;
  estimatedWeightKg?: number;
  estimatedLengthCm?: number;
  estimatedWidthCm?: number;
  estimatedHeightCm?: number;
  fragile: boolean;
  active: boolean;
  availableQuantity: number;
}

export interface MarketplaceProduct {
  id: string;
  sellerOrganizationId: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  status: string;
  currency: string;
  defaultImageAssetId?: string;
  metadata?: Record<string, unknown>;
  variants: MarketplaceProductVariant[];
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; pageCount: number };
}

export interface MarketplaceCartItem {
  id: string;
  productVariantId: string;
  sellerOrganizationId: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  productName: string;
  variant?: { sku?: string; name?: string; optionValues?: Record<string, unknown> };
  lineTotal: number;
}

export interface MarketplaceCart {
  id: string;
  status: string;
  currency: string;
  version: number;
  items: MarketplaceCartItem[];
  itemCount: number;
  subtotal: number;
}

export interface SimulationSession {
  id: string;
  adminActorUserId: string;
  buyerUserId: string;
  sellerOrganizationId: string;
  merchantLocationId?: string;
  status: string;
  expiresAt?: string;
}

export interface CheckoutResult {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    currency: string;
    subtotal: number;
    deliveryTotal: number;
    grandTotal: number;
    sellerOrders: Array<{
      id: string;
      sellerOrganizationId: string;
      fulfillmentStatus: string;
      dispatchStatus: string;
      deliveryOrderId?: string;
      subtotal: number;
      deliveryAmount: number;
    }>;
  };
  payment: { status: string };
  dropoffCredentials: Array<{
    deliveryOrderId: string;
    sellerOrderId: string;
    status: string;
    qrDownloadUrl?: string;
  }>;
}

export interface SellerOrderSummary {
  id: string;
  marketplaceOrderId: string;
  fulfillmentStatus: string;
  dispatchStatus: string;
  dispatchFailureReason?: string;
  currency: string;
  subtotal: number;
  deliveryAmount: number;
  deliveryOrderId?: string;
  merchantLocationId?: string;
  version: number;
  createdAt: string;
  itemCount?: number;
  totalQuantity?: number;
}

export interface SellerOrderDetail extends SellerOrderSummary {
  recipient?: { name?: string; phone?: string };
  deliveryAddress?: string;
  paymentStatus?: string;
  merchantLocation?: { id: string; name: string; address: string } | null;
  items: Array<{
    id: string;
    sku: string;
    productName: string;
    variant?: { name?: string; optionValues?: Record<string, unknown> };
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    estimatedUnitWeightKg?: number;
    estimatedDimensions?: Record<string, unknown>;
  }>;
}

export interface PackageLabelView {
  id: string;
  packageNumber: number;
  totalPackages: number;
  packageIdentifier: string;
  packageName?: string;
  weightKg: number;
  size: string;
  status: string;
  activeLabel?: {
    id: string;
    version: number;
    status: string;
    pdfDownloadUrl?: string;
    pngDownloadUrl?: string;
    qrDownloadUrl?: string;
  };
}

// ── Catalog (real marketplace APIs) ──────────────────────────────────────────

interface PaginatedEnvelope<T> {
  success?: boolean;
  data?: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pageCount?: number;
    totalPages?: number;
  };
}

/**
 * The backend envelope for lists is `{ success, data: T[], meta }`. The default
 * unwrap would drop `meta`, so list helpers keep the envelope and normalize it.
 */
async function listPaginated<T>(path: string, query?: Record<string, string | number>): Promise<Paginated<T>> {
  const envelope = await request<PaginatedEnvelope<T>>(path, {
    unwrapData: false,
    ...(query ? { query } : {}),
  });
  const meta = envelope?.meta ?? {};
  return {
    items: Array.isArray(envelope?.data) ? envelope.data : [],
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 20,
      total: meta.total ?? 0,
      pageCount: meta.pageCount ?? meta.totalPages ?? 1,
    },
  };
}

export function listMarketplaceProducts(query: {
  search?: string;
  sellerOrganizationId?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<MarketplaceProduct>> {
  return listPaginated<MarketplaceProduct>("/marketplace/products", query as Record<string, string | number>);
}

export function getMarketplaceProduct(productId: string): Promise<MarketplaceProduct> {
  return request<MarketplaceProduct>(`/marketplace/products/${productId}`);
}

// ── Simulation sessions ──────────────────────────────────────────────────────

export function createSimulationSession(input: {
  buyerUserId: string;
  sellerOrganizationId: string;
  merchantLocationId?: string;
}): Promise<SimulationSession> {
  return request<SimulationSession>("/admin/marketplace-simulation/sessions", { method: "POST", body: input });
}

export function listSimulationSessions(): Promise<{ items: SimulationSession[] }> {
  return request<{ items: SimulationSession[] }>("/admin/marketplace-simulation/sessions");
}

// ── Client shop proxies (act as the session's simulated buyer) ───────────────

export function simGetOrCreateCart(sessionId: string): Promise<MarketplaceCart> {
  return request<MarketplaceCart>(`/admin/marketplace-simulation/${sessionId}/cart`, { method: "POST" });
}

export function simAddCartItem(sessionId: string, cartId: string, productVariantId: string, quantity: number): Promise<MarketplaceCart> {
  return request<MarketplaceCart>(`/admin/marketplace-simulation/${sessionId}/cart/${cartId}/items`, {
    method: "POST",
    body: { productVariantId, quantity },
  });
}

export function simUpdateCartItem(sessionId: string, cartId: string, itemId: string, quantity: number): Promise<MarketplaceCart> {
  return request<MarketplaceCart>(`/admin/marketplace-simulation/${sessionId}/cart/${cartId}/items/${itemId}`, {
    method: "PATCH",
    body: { quantity },
  });
}

export function simRemoveCartItem(sessionId: string, cartId: string, itemId: string): Promise<MarketplaceCart> {
  return request<MarketplaceCart>(`/admin/marketplace-simulation/${sessionId}/cart/${cartId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function simCheckout(
  sessionId: string,
  input: {
    cartId: string;
    recipient: { name: string; phone: string; email?: string };
    deliveryAddress: { address: string; latitude: number; longitude: number; placeId?: string; instructions?: string };
    paymentMethod: string;
  },
  idempotencyKey: string,
): Promise<CheckoutResult> {
  return request<CheckoutResult>(`/admin/marketplace-simulation/${sessionId}/checkout`, {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

// ── Seller proxies (act as the session's simulated seller) ───────────────────

export function simListSellerOrders(sessionId: string, status?: string): Promise<Paginated<SellerOrderSummary>> {
  return listPaginated<SellerOrderSummary>(
    `/admin/marketplace-simulation/${sessionId}/seller-orders`,
    status ? { status } : undefined,
  );
}

export function simGetSellerOrder(sessionId: string, sellerOrderId: string): Promise<SellerOrderDetail> {
  return request<SellerOrderDetail>(`/admin/marketplace-simulation/${sessionId}/seller-orders/${sellerOrderId}`);
}

export function simSellerAction(
  sessionId: string,
  sellerOrderId: string,
  action: "accept" | "reject" | "start-preparation" | "ready-for-shipment" | "retry-dispatch",
  body: Record<string, unknown> = {},
): Promise<SellerOrderSummary> {
  return request<SellerOrderSummary>(`/admin/marketplace-simulation/${sessionId}/seller-orders/${sellerOrderId}/${action}`, {
    method: "POST",
    body,
  });
}

export function simFinalizePackages(
  sessionId: string,
  sellerOrderId: string,
  packages: Array<{
    clientReference: string;
    packageName: string;
    weightKg: number;
    size: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    fragile?: boolean;
    items: Array<{ marketplaceOrderItemId: string; quantity: number }>;
  }>,
): Promise<SellerOrderDetail> {
  return request<SellerOrderDetail>(`/admin/marketplace-simulation/${sessionId}/seller-orders/${sellerOrderId}/packages`, {
    method: "PUT",
    body: { packages },
  });
}

export function simGetSellerLabels(sessionId: string, sellerOrderId: string): Promise<PackageLabelView[]> {
  return request<PackageLabelView[]>(`/admin/marketplace-simulation/${sessionId}/seller-orders/${sellerOrderId}/labels`);
}
