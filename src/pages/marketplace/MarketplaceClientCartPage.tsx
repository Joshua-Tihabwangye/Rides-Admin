import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DownloadIcon from "@mui/icons-material/Download";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import {
  listDeliveryPaymentMethods,
  searchPlaces,
  simCheckout,
  simGetOrCreateCart,
  simRemoveCartItem,
  simUpdateCartItem,
  type CheckoutResult,
  type MarketplaceCart,
  type PaymentCapability,
  type PaymentTiming,
  type PlaceSuggestion,
} from "../../services/api/marketplaceApi";
import { useSimulationSession } from "../../components/marketplace/useSimulationSession";

function formatUgx(amount: number, currency = "UGX") {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

function formatPaymentMethodLabel(method: string, provider: string, currency: string): string {
  const labels: Record<string, string> = {
    EVZONE_WALLET: "EVzone Wallet",
    MOBILE_MONEY: "Mobile money",
    CARD: "Card",
    BANK_TRANSFER: "Bank transfer",
  };
  const base = labels[method] ?? method.replace(/_/g, " ");
  return `${base} · ${provider} · ${currency}`;
}

function idempotencyKeyStorageKey(sessionId: string, cartId: string): string {
  return `evzone_admin_mkt_sim_checkout_key_${sessionId}_${cartId}`;
}

export default function MarketplaceClientCartPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSimulationSession();
  const [cart, setCart] = useState<MarketplaceCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  // Real place search state
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeOptions, setPlaceOptions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Backend-driven payment methods
  const [paymentCapabilities, setPaymentCapabilities] = useState<PaymentCapability[]>([]);
  const [paymentCapabilitiesLoading, setPaymentCapabilitiesLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming | "">("");

  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmation, setConfirmation] = useState<CheckoutResult | null>(null);

  const loadCart = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await simGetOrCreateCart(session.id);
      setCart(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the cart");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) void loadCart();
  }, [session, loadCart]);

  // Load backend payment capabilities once we know the cart currency.
  useEffect(() => {
    if (!session || !cart) return;
    setPaymentCapabilitiesLoading(true);
    listDeliveryPaymentMethods({ country: "UG", currency: cart.currency })
      .then((capabilities) => {
        const cashless = capabilities.filter((c) => c.method !== "CASH");
        const deduped = cashless.filter((c, index, arr) => arr.findIndex((x) => x.method === c.method) === index);
        setPaymentCapabilities(deduped);
        if (deduped.length > 0 && !paymentMethod) {
          setPaymentMethod(deduped[0].method);
        }
      })
      .catch(() => {
        // Leave methods empty; the selector will show unavailable state.
      })
      .finally(() => setPaymentCapabilitiesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, cart?.currency]);

  // Debounced place search
  useEffect(() => {
    if (!placeQuery.trim() || placeQuery.trim().length < 3) {
      setPlaceOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      setPlaceLoading(true);
      searchPlaces(placeQuery, "UG", 5)
        .then((result) => setPlaceOptions(result.items ?? []))
        .catch(() => setPlaceOptions([]))
        .finally(() => setPlaceLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [placeQuery]);

  const changeQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!session || !cart || quantity < 1) return;
      setBusyItem(itemId);
      setError(null);
      try {
        const updated = await simUpdateCartItem(session.id, cart.id, itemId, quantity);
        setCart(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update quantity");
      } finally {
        setBusyItem(null);
      }
    },
    [session, cart],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!session || !cart) return;
      setBusyItem(itemId);
      setError(null);
      try {
        const updated = await simRemoveCartItem(session.id, cart.id, itemId);
        setCart(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to remove the item");
      } finally {
        setBusyItem(null);
      }
    },
    [session, cart],
  );

  const checkoutIdempotencyKey = useMemo(() => {
    if (!session || !cart) return "";
    const storageKey = idempotencyKeyStorageKey(session.id, cart.id);
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) return existing;
    const generated = crypto.randomUUID();
    window.sessionStorage.setItem(storageKey, generated);
    return generated;
  }, [session, cart]);

  const checkout = useCallback(async () => {
    if (!session || !cart) return;
    setCheckingOut(true);
    setError(null);
    try {
      const deliveryLatitude = selectedPlace ? selectedPlace.latitude : Number(latitude);
      const deliveryLongitude = selectedPlace ? selectedPlace.longitude : Number(longitude);
      const deliveryAddress = selectedPlace
        ? `${selectedPlace.displayName}${address.trim() ? ` — ${address.trim()}` : ""}`
        : address.trim();
      const result = await simCheckout(
        session.id,
        {
          cartId: cart.id,
          recipient: {
            name: recipientName.trim(),
            phone: recipientPhone.trim(),
            email: recipientEmail.trim() || undefined,
          },
          deliveryAddress: {
            address: deliveryAddress,
            latitude: deliveryLatitude,
            longitude: deliveryLongitude,
            placeId: selectedPlace?.placeId,
            instructions: instructions.trim() || undefined,
          },
          paymentMethod,
          paymentTiming,
        },
        checkoutIdempotencyKey,
      );
      setConfirmation(result);
      window.sessionStorage.removeItem(idempotencyKeyStorageKey(session.id, cart.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }, [
    session,
    cart,
    recipientName,
    recipientPhone,
    recipientEmail,
    address,
    selectedPlace,
    latitude,
    longitude,
    instructions,
    paymentMethod,
    paymentTiming,
    checkoutIdempotencyKey,
  ]);

  const downloadQr = useCallback(async (url: string, filename: string) => {
    const response = await fetch(url);
    if (!response.ok) return;
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, []);

  const canCheckout = useMemo(() => {
    const hasPlace = selectedPlace !== null;
    const hasManualCoords =
      manualCoordinates && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
    return (
      !checkingOut &&
      !!paymentMethod &&
      !!paymentTiming &&
      recipientName.trim().length > 0 &&
      recipientPhone.trim().length > 0 &&
      (hasPlace || hasManualCoords)
    );
  }, [checkingOut, paymentMethod, paymentTiming, recipientName, recipientPhone, selectedPlace, manualCoordinates, latitude, longitude]);

  if (sessionLoading || (session && loading)) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box py={4}>
        <Alert severity="info" action={
          <Button onClick={() => navigate("/admin/marketplace/client/products")}>Go to Client Shop</Button>
        }>
          Start a marketplace simulation session from the Client Shop page first.
        </Alert>
      </Box>
    );
  }

  if (confirmation) {
    return (
      <Box py={3} maxWidth={760} mx="auto">
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Order confirmed</Typography>
              <Typography variant="body2" color="text.secondary">
                Marketplace order {confirmation.order.orderNumber} · {confirmation.order.status} · payment{" "}
                {confirmation.order.paymentStatus}
              </Typography>
              <Divider />
              <Typography variant="subtitle2">Totals</Typography>
              <Typography variant="body2">
                Subtotal {formatUgx(confirmation.order.subtotal, confirmation.order.currency)} · Delivery{" "}
                {formatUgx(confirmation.order.deliveryTotal, confirmation.order.currency)} · Grand total{" "}
                {formatUgx(confirmation.order.grandTotal, confirmation.order.currency)}
              </Typography>
              <Divider />
              <Typography variant="subtitle2">Seller shipments</Typography>
              {confirmation.order.sellerOrders.map((sellerOrder) => (
                <Stack key={sellerOrder.id} direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={sellerOrder.fulfillmentStatus} />
                  <Chip size="small" variant="outlined" label={sellerOrder.dispatchStatus} />
                  <Typography variant="caption" color="text.secondary">
                    {sellerOrder.id.slice(0, 8)}
                  </Typography>
                </Stack>
              ))}
              <Divider />
              <Typography variant="subtitle2">Client drop-off QR (keep private)</Typography>
              <Alert severity="warning">
                Show this QR only to the assigned EVzone driver at delivery. The seller never receives it.
              </Alert>
              {confirmation.dropoffCredentials.map((credential) => (
                <Stack key={credential.deliveryOrderId} spacing={1.5}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {credential.qrDownloadUrl ? (
                      <Box
                        component="img"
                        src={credential.qrDownloadUrl}
                        alt="Drop-off QR"
                        sx={{ width: 120, height: 120, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                      />
                    ) : null}
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={!credential.qrDownloadUrl}
                      onClick={() =>
                        credential.qrDownloadUrl &&
                        void downloadQr(credential.qrDownloadUrl, `dropoff-qr-${confirmation.order.orderNumber}.png`)
                      }
                    >
                      Download QR PNG
                    </Button>
                  </Stack>
                  {credential.dropoffPin ? (
                    <Alert severity="info" icon={false}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Drop-off confirmation code
                      </Typography>
                      <Typography variant="h4" fontWeight={800} letterSpacing={4} align="center" py={1}>
                        {credential.dropoffPin}
                      </Typography>
                      <Typography variant="caption">
                        If the driver cannot scan the QR, read them this 6-digit code. It expires once the driver
                        confirms delivery.
                      </Typography>
                    </Alert>
                  ) : null}
                </Stack>
              ))}
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => navigate("/admin/marketplace/seller/orders")}>
                  Open Seller Orders
                </Button>
                <Button variant="outlined" onClick={() => navigate("/admin/marketplace/client/products")}>
                  Back to Client Shop
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box py={3}>
      <Typography variant="h5" mb={0.5}>
        Marketplace — Client Cart &amp; Checkout
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Backend cart of the simulated buyer. Checkout creates the real marketplace order, seller orders,
        shipment drafts and the client drop-off QR.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {!cart || cart.items.length === 0 ? (
        <Alert
          severity="info"
          action={<Button onClick={() => navigate("/admin/marketplace/client/products")}>Browse products</Button>}
        >
          The cart is empty.
        </Alert>
      ) : (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="flex-start">
          <Card variant="outlined" sx={{ flex: 1, width: "100%" }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Cart items ({cart.itemCount})
                </Typography>
                {cart.items.map((item) => (
                  <Stack
                    key={item.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.variant?.name ?? item.variant?.sku} · {formatUgx(item.unitPrice, item.currency)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        disabled={busyItem === item.id || item.quantity <= 1}
                        onClick={() => void changeQuantity(item.id, item.quantity - 1)}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ minWidth: 20, textAlign: "center" }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        disabled={busyItem === item.id}
                        onClick={() => void changeQuantity(item.id, item.quantity + 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ minWidth: 90, textAlign: "right" }}>
                        {formatUgx(item.lineTotal, item.currency)}
                      </Typography>
                      <IconButton size="small" disabled={busyItem === item.id} onClick={() => void removeItem(item.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
                <Stack direction="row" justifyContent="space-between" pt={1}>
                  <Typography variant="subtitle2">Subtotal</Typography>
                  <Typography variant="subtitle2">{formatUgx(cart.subtotal, cart.currency)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ width: { xs: "100%", lg: 420 } }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Delivery &amp; payment
                </Typography>
                <TextField
                  size="small"
                  label="Recipient name"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Recipient phone"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Recipient email (optional)"
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  fullWidth
                />

                <Autocomplete
                  size="small"
                  freeSolo
                  options={placeOptions}
                  loading={placeLoading}
                  value={selectedPlace}
                  inputValue={placeQuery}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.displayName
                  }
                  isOptionEqualToValue={(option, value) => option.placeId === value.placeId}
                  onInputChange={(_, value) => setPlaceQuery(value)}
                  onChange={(_, value) => {
                    if (value && typeof value !== "string") {
                      setSelectedPlace(value);
                      setAddress(value.displayName);
                    } else {
                      setSelectedPlace(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search delivery address"
                      placeholder="Start typing a place in Uganda…"
                      fullWidth
                    />
                  )}
                />

                <Button
                  size="small"
                  sx={{ alignSelf: "flex-start" }}
                  onClick={() => setManualCoordinates((previous) => !previous)}
                >
                  {manualCoordinates ? "Hide manual coordinates" : "Enter coordinates manually"}
                </Button>
                <Collapse in={manualCoordinates}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="Latitude"
                      value={latitude}
                      onChange={(event) => setLatitude(event.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="Longitude"
                      value={longitude}
                      onChange={(event) => setLongitude(event.target.value)}
                      fullWidth
                    />
                  </Stack>
                </Collapse>

                <TextField
                  size="small"
                  label="Delivery instructions (optional)"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  fullWidth
                />

<FormControl size="small" fullWidth disabled={paymentCapabilitiesLoading}>
                   <InputLabel>Payment mode</InputLabel>
                   <Select
                     label="Payment mode"
                     value={paymentTiming}
                     onChange={(event) => setPaymentTiming(event.target.value as PaymentTiming)}
                   >
                     <MenuItem value="PREPAID">Pre-payment</MenuItem>
                     <MenuItem value="PAY_ON_DELIVERY">Payment on delivery</MenuItem>
                   </Select>
                 </FormControl>

                 <FormControl size="small" fullWidth disabled={paymentCapabilitiesLoading}>
                   <InputLabel>Payment method</InputLabel>
                   <Select
                     label="Payment method"
                     value={paymentMethod}
                     onChange={(event) => setPaymentMethod(event.target.value)}
                   >
                     {paymentCapabilities.map((capability) => (
                       <MenuItem key={capability.method} value={capability.method}>
                         {formatPaymentMethodLabel(capability.method, capability.provider, capability.currency)}
                       </MenuItem>
                     ))}
                     {paymentCapabilities.length === 0 && !paymentCapabilitiesLoading ? (
                       <MenuItem disabled value="">
                         No payment methods available
                       </MenuItem>
                     ) : null}
                   </Select>
                 </FormControl>
                {paymentCapabilities.length === 0 && !paymentCapabilitiesLoading ? (
                  <Alert severity="warning" sx={{ py: 0 }}>
                    No delivery payment methods are configured. Ask an administrator to enable at least one method.
                  </Alert>
                ) : null}

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartCheckoutIcon />}
                  disabled={!canCheckout}
                  onClick={() => void checkout()}
                >
                  {checkingOut ? "Submitting…" : `Place order · ${formatUgx(cart.subtotal, cart.currency)} + delivery`}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
