import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  listMarketplaceProducts,
  getMarketplaceProduct,
  listDeliveryPaymentMethods,
  searchPlaces,
  createSimulationSession,
  listSimulationSessions,
  simGetOrCreateCart,
  simAddCartItem,
  simUpdateCartItem,
  simRemoveCartItem,
  simCheckout,
  simListSellerOrders,
  simGetSellerOrder,
  simSellerAction,
  simFinalizePackages,
  simGetSellerLabels,
} from "./marketplaceApi";

function stubFetch(json: unknown, status = 200, ok: boolean = status >= 200 && status < 300) {
  return vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      text: () => Promise.resolve(typeof json === "string" ? json : JSON.stringify(json)),
    } as unknown as Response),
  );
}

type Call = [string, RequestInit];
function lastCall(): Call {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Call[];
  return calls[calls.length - 1];
}

const product = {
  id: "p1",
  sellerOrganizationId: "s1",
  name: "Test Product",
  status: "ACTIVE",
  currency: "UGX",
  variants: [],
};

describe("marketplaceApi — catalog", () => {
  beforeEach(() => stubFetch({ data: [product], meta: { page: 1, limit: 20, total: 1, pageCount: 1 } }));
  afterEach(() => vi.unstubAllGlobals());

  it("lists products via GET /marketplace/products with normalized envelope", async () => {
    const result = await listMarketplaceProducts({ search: "shoes", sellerOrganizationId: "s1", page: 2, limit: 5 });
    const [url, init] = lastCall();
    expect(init.method).toBe("GET");
    expect(url).toContain("/marketplace/products");
    expect(url).toContain(`search=${encodeURIComponent("shoes")}`);
    expect(url).toContain(`sellerOrganizationId=${encodeURIComponent("s1")}`);
    expect(url).toContain("page=2");
    expect(url).toContain("limit=5");
    expect(result.items).toHaveLength(1);
    expect(result.meta).toMatchObject({ page: 1, limit: 20, total: 1, pageCount: 1 });
  });

  it("falls back to pageCount from totalPages when pageCount is absent", async () => {
    stubFetch({ data: [], meta: { page: 1, limit: 20, total: 40, totalPages: 2 } });
    const result = await listMarketplaceProducts({});
    expect(result.meta.pageCount).toBe(2);
  });

  it("fetches a single product and unwraps data", async () => {
    stubFetch({ data: product });
    const result = await getMarketplaceProduct("p1");
    const [url] = lastCall();
    expect(url).toContain("/marketplace/products/p1");
    expect(result.id).toBe("p1");
  });

  it("throws ApiRequestError with status + message on 404", async () => {
    stubFetch({ code: "NOT_FOUND", message: "Product not found" }, 404, false);
    await expect(getMarketplaceProduct("missing")).rejects.toMatchObject({
      status: 404,
      message: "Product not found",
    });
  });
});

describe("marketplaceApi — payment capabilities", () => {
  beforeEach(() => stubFetch([{ method: "MOBILE_MONEY", provider: "PAYTOTA", country: "UG", currency: "UGX", requiresPhone: true, requiresEmail: false, serviceTypes: ["DELIVERY"] }]));
  afterEach(() => vi.unstubAllGlobals());

  it("requests DELIVERY payment methods with country/currency/operator filters", async () => {
    await listDeliveryPaymentMethods({ country: "UG", currency: "UGX", operator: "MTN" });
    const [url] = lastCall();
    expect(url).toContain("/payments/methods");
    expect(url).toContain("serviceType=DELIVERY");
    expect(url).toContain("country=UG");
    expect(url).toContain("currency=UGX");
    expect(url).toContain("operator=MTN");
  });

  it("omits undefined payment filters", async () => {
    await listDeliveryPaymentMethods({});
    const [url] = lastCall();
    expect(url).toContain("serviceType=DELIVERY");
    expect(url).not.toContain("country=");
  });
});

describe("marketplaceApi — geo", () => {
  beforeEach(() => stubFetch({ items: [], provider: "geo", message: "ok" }));
  afterEach(() => vi.unstubAllGlobals());

  it("searches places with lowercased country code and limit", async () => {
    await searchPlaces("Kampala", "UG", 3);
    const [url] = lastCall();
    expect(url).toContain("/geo/places");
    expect(url).toContain(`query=${encodeURIComponent("Kampala")}`);
    expect(url).toContain("countryCode=ug");
    expect(url).toContain("limit=3");
  });
});

describe("marketplaceApi — simulation sessions", () => {
  const session = {
    id: "sess1",
    adminActorUserId: "a1",
    buyerUserId: "b1",
    sellerOrganizationId: "s1",
    status: "ACTIVE",
  };
  beforeEach(() => stubFetch({ data: session }));
  afterEach(() => vi.unstubAllGlobals());

  it("creates a session via POST with buyer/seller body", async () => {
    const result = await createSimulationSession({ buyerUserId: "b1", sellerOrganizationId: "s1", merchantLocationId: "m1" });
    const [url, init] = lastCall();
    expect(init.method).toBe("POST");
    expect(url).toContain("/admin/marketplace-simulation/sessions");
    expect(JSON.parse(init.body as string)).toMatchObject({ buyerUserId: "b1", sellerOrganizationId: "s1", merchantLocationId: "m1" });
    expect(result.id).toBe("sess1");
  });

  it("lists sessions via GET", async () => {
    stubFetch({ items: [session] });
    await listSimulationSessions();
    const [url] = lastCall();
    expect(url).toContain("/admin/marketplace-simulation/sessions");
  });
});

describe("marketplaceApi — cart lifecycle", () => {
  const cart = { id: "c1", status: "ACTIVE", currency: "UGX", version: 1, items: [], itemCount: 0, subtotal: 0 };
  beforeEach(() => stubFetch({ data: cart }));
  afterEach(() => vi.unstubAllGlobals());

  it("creates a cart with POST", async () => {
    await simGetOrCreateCart("sess1");
    const [url, init] = lastCall();
    expect(init.method).toBe("POST");
    expect(url).toContain("/admin/marketplace-simulation/sess1/cart");
  });

  it("adds an item with POST and body", async () => {
    await simAddCartItem("sess1", "c1", "v1", 3);
    const [url, init] = lastCall();
    expect(init.method).toBe("POST");
    expect(url).toContain("/admin/marketplace-simulation/sess1/cart/c1/items");
    expect(JSON.parse(init.body as string)).toEqual({ productVariantId: "v1", quantity: 3 });
  });

  it("updates an item with PATCH and body", async () => {
    await simUpdateCartItem("sess1", "c1", "i1", 2);
    const [url, init] = lastCall();
    expect(init.method).toBe("PATCH");
    expect(url).toContain("/admin/marketplace-simulation/sess1/cart/c1/items/i1");
    expect(JSON.parse(init.body as string)).toEqual({ quantity: 2 });
  });

  it("removes an item with DELETE", async () => {
    await simRemoveCartItem("sess1", "c1", "i1");
    const [url, init] = lastCall();
    expect(init.method).toBe("DELETE");
    expect(url).toContain("/admin/marketplace-simulation/sess1/cart/c1/items/i1");
  });
});

describe("marketplaceApi — checkout idempotency", () => {
  const checkoutResult = {
    order: { id: "o1", orderNumber: "ORD-1", status: "CREATED", paymentStatus: "AUTHORIZED", currency: "UGX", subtotal: 1000, deliveryTotal: 200, grandTotal: 1200, sellerOrders: [] },
    payment: { status: "AUTHORIZED" },
    dropoffCredentials: [],
  };
  beforeEach(() => stubFetch({ data: checkoutResult }));
  afterEach(() => vi.unstubAllGlobals());

  it("sends a unique Idempotency-Key header on checkout", async () => {
    const result = await simCheckout(
      "sess1",
      {
        cartId: "c1",
        recipient: { name: "Jane", phone: "+256700000009" },
        deliveryAddress: { address: "Kira Rd", latitude: 0.3, longitude: 32.5 },
        paymentMethod: "MOBILE_MONEY",
        paymentTiming: "PREPAID",
      },
      "idempotency-abc-123",
    );
    const [url, init] = lastCall();
    expect(init.method).toBe("POST");
    expect(url).toContain("/admin/marketplace-simulation/sess1/checkout");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe("idempotency-abc-123");
    expect(result.order.id).toBe("o1");
  });
});

describe("marketplaceApi — seller fulfillment", () => {
  const sellerOrder = {
    id: "so1",
    marketplaceOrderId: "o1",
    fulfillmentStatus: "PENDING_SELLER_ACCEPTANCE",
    dispatchStatus: "NOT_DISPATCHED",
    currency: "UGX",
    subtotal: 1000,
    deliveryAmount: 200,
    version: 1,
  };
  beforeEach(() => stubFetch({ data: [sellerOrder] }));
  afterEach(() => vi.unstubAllGlobals());

  it("lists seller orders with optional status query", async () => {
    await simListSellerOrders("sess1", "READY_FOR_SHIPMENT");
    const [url] = lastCall();
    expect(url).toContain("/admin/marketplace-simulation/sess1/seller-orders");
    expect(url).toContain(`status=${encodeURIComponent("READY_FOR_SHIPMENT")}`);
  });

  it("gets a seller order detail", async () => {
    stubFetch({ data: { ...sellerOrder, items: [] } });
    await simGetSellerOrder("sess1", "so1");
    const [url] = lastCall();
    expect(url).toContain("/admin/marketplace-simulation/sess1/seller-orders/so1");
  });

  it.each(["accept", "reject", "start-preparation", "ready-for-shipment", "retry-dispatch"] as const)(
    "performs seller action %s via POST",
    async (action) => {
      await simSellerAction("sess1", "so1", action, { note: "ok" });
      const [url, init] = lastCall();
      expect(init.method).toBe("POST");
      expect(url).toContain(`/admin/marketplace-simulation/sess1/seller-orders/so1/${action}`);
      expect(JSON.parse(init.body as string)).toEqual({ note: "ok" });
    },
  );

  it("finalizes packages via PUT with package array", async () => {
    stubFetch({ data: { ...sellerOrder, items: [] } });
    const packages = [
      { clientReference: "pk1", packageName: "Box A", weightKg: 1.2, size: "SMALL", items: [{ marketplaceOrderItemId: "oi1", quantity: 1 }] },
    ];
    await simFinalizePackages("sess1", "so1", packages);
    const [url, init] = lastCall();
    expect(init.method).toBe("PUT");
    expect(url).toContain("/admin/marketplace-simulation/sess1/seller-orders/so1/packages");
    expect(JSON.parse(init.body as string)).toEqual({ packages });
  });

  it("retrieves seller labels via GET", async () => {
    stubFetch({ data: [] });
    await simGetSellerLabels("sess1", "so1");
    const [url] = lastCall();
    expect(url).toContain("/admin/marketplace-simulation/sess1/seller-orders/so1/labels");
  });
});
