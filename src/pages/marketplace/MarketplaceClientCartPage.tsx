import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  simCheckout,
  simGetOrCreateCart,
  simRemoveCartItem,
  simUpdateCartItem,
  type CheckoutResult,
  type MarketplaceCart,
} from "../../services/api/marketplaceApi";
import { useSimulationSession } from "../../components/marketplace/useSimulationSession";

function formatUgx(amount: number, currency = "UGX") {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Pay on delivery (cash)" },
  { value: "EVZONE_WALLET", label: "EVzone Wallet" },
  { value: "MOBILE_MONEY", label: "Mobile money" },
];

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
  const [latitude, setLatitude] = useState("0.3476");
  const [longitude, setLongitude] = useState("32.5825");
  const [instructions, setInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
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

  const checkout = useCallback(async () => {
    if (!session || !cart) return;
    setCheckingOut(true);
    setError(null);
    try {
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
            address: address.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            instructions: instructions.trim() || undefined,
          },
          paymentMethod,
        },
        `admin-sim-${session.id}-${Date.now()}`,
      );
      setConfirmation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }, [session, cart, recipientName, recipientPhone, recipientEmail, address, latitude, longitude, instructions, paymentMethod]);

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
                <Stack key={credential.deliveryOrderId} direction="row" spacing={2} alignItems="center">
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
                <TextField
                  size="small"
                  label="Delivery address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  fullWidth
                />
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
                <TextField
                  size="small"
                  label="Delivery instructions (optional)"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Payment method</InputLabel>
                  <Select
                    label="Payment method"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartCheckoutIcon />}
                  disabled={
                    checkingOut ||
                    !recipientName.trim() ||
                    !recipientPhone.trim() ||
                    !address.trim() ||
                    !Number.isFinite(Number(latitude)) ||
                    !Number.isFinite(Number(longitude))
                  }
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
