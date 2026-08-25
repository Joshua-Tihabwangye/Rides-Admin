import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import {
  simFinalizePackages,
  simGetSellerLabels,
  simGetSellerOrder,
  simSellerAction,
  type PackageLabelView,
  type SellerOrderDetail,
} from "../../services/api/marketplaceApi";
import { useSimulationSession } from "../../components/marketplace/useSimulationSession";

function formatUgx(amount: number, currency = "UGX") {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

interface PackageDraft {
  packageName: string;
  weightKg: string;
  size: string;
  fragile: boolean;
  allocations: Record<string, number>; // marketplaceOrderItemId -> quantity
}

const PACKAGE_SIZES = ["SMALL", "MEDIUM", "LARGE", "CUSTOM"];

export default function MarketplaceSellerOrderDetailPage() {
  const navigate = useNavigate();
  const { sellerOrderId = "" } = useParams();
  const { session, loading: sessionLoading } = useSimulationSession();
  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [labels, setLabels] = useState<PackageLabelView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [packages, setPackages] = useState<PackageDraft[]>([]);

  const load = useCallback(async () => {
    if (!session || !sellerOrderId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await simGetSellerOrder(session.id, sellerOrderId);
      setOrder(detail);
      if (["READY_FOR_SHIPMENT", "HANDED_TO_DRIVER", "IN_TRANSIT", "DELIVERED"].includes(detail.fulfillmentStatus)) {
        const labelRows = await simGetSellerLabels(session.id, sellerOrderId);
        setLabels(labelRows);
      }
      if (packages.length === 0) {
        setPackages([
          {
            packageName:
              detail.items.length === 1
                ? detail.items[0].productName
                : detail.items.map((item) => item.productName).join(" + "),
            weightKg: String(
              detail.items.reduce((sum, item) => sum + (item.estimatedUnitWeightKg ?? 0.5) * item.quantity, 0).toFixed(2),
            ),
            size: "SMALL",
            fragile: false,
            allocations: Object.fromEntries(detail.items.map((item) => [item.id, item.quantity])),
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the seller order");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sellerOrderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const action = useCallback(
    async (kind: "accept" | "reject" | "start-preparation" | "ready-for-shipment" | "retry-dispatch", body: Record<string, unknown> = {}) => {
      if (!session) return;
      setBusy(true);
      setError(null);
      try {
        await simSellerAction(session.id, sellerOrderId, kind, body);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : `Unable to ${kind}`);
      } finally {
        setBusy(false);
      }
    },
    [session, sellerOrderId, load],
  );

  const allocationError = useMemo(() => {
    if (!order) return null;
    for (const item of order.items) {
      const allocated = packages.reduce((sum, pkg) => sum + (pkg.allocations[item.id] ?? 0), 0);
      if (allocated !== item.quantity) {
        return `"${item.productName}" ordered ${item.quantity} but packed ${allocated}`;
      }
    }
    for (const pkg of packages) {
      if (!pkg.packageName.trim()) return "Every package needs a name";
      if (!(Number(pkg.weightKg) > 0)) return `Package "${pkg.packageName}" needs a positive weight`;
    }
    return null;
  }, [order, packages]);

  const finalize = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await simFinalizePackages(
        session.id,
        sellerOrderId,
        packages.map((pkg, index) => ({
          clientReference: `box-${index + 1}`,
          packageName: pkg.packageName,
          weightKg: Number(pkg.weightKg),
          size: pkg.size,
          fragile: pkg.fragile,
          items: Object.entries(pkg.allocations)
            .filter(([, quantity]) => quantity > 0)
            .map(([marketplaceOrderItemId, quantity]) => ({ marketplaceOrderItemId, quantity })),
        })),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finalize packages");
    } finally {
      setBusy(false);
    }
  }, [session, sellerOrderId, packages, load]);

  const download = useCallback(async (url: string, filename: string) => {
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

  if (sessionLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box py={4}>
        <Alert
          severity="info"
          action={<Button onClick={() => navigate("/admin/marketplace/client/products")}>Go to Client Shop</Button>}
        >
          Start a marketplace simulation session from the Client Shop page first.
        </Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box py={4}>
        <Alert severity="error">{error ?? "Seller order not found"}</Alert>
      </Box>
    );
  }

  const editablePackages = ["ACCEPTED", "PREPARING", "PACKAGES_FINALIZED"].includes(order.fulfillmentStatus);

  return (
    <Box py={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">Seller order {order.id.slice(0, 8)}</Typography>
          <Typography variant="body2" color="text.secondary">
            Marketplace order {order.marketplaceOrderId.slice(0, 8)} · payment {order.paymentStatus ?? "unknown"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={order.fulfillmentStatus} color="primary" variant="outlined" />
          <Chip label={order.dispatchStatus} variant="outlined" />
        </Stack>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {order.dispatchFailureReason ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button disabled={busy} onClick={() => void action("retry-dispatch")}>
              Retry dispatch
            </Button>
          }
        >
          Dispatch failed: {order.dispatchFailureReason}. The commercial order is unaffected.
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ flex: 1, width: "100%" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Items to fulfil
              </Typography>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between" sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {item.productName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.sku} · {item.variant?.name} · {item.estimatedUnitWeightKg ?? "?"} kg each
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    x{item.quantity} · {formatUgx(item.lineTotal, order.currency)}
                  </Typography>
                </Stack>
              ))}
              <Stack direction="row" justifyContent="space-between" pt={1}>
                <Typography variant="subtitle2">Order value</Typography>
                <Typography variant="subtitle2">{formatUgx(order.subtotal, order.currency)}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Recipient: {order.recipient?.name} · {order.deliveryAddress}
              </Typography>

              <Divider />
              <Typography variant="subtitle2">Seller actions</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {order.fulfillmentStatus === "PENDING_SELLER_ACCEPTANCE" ? (
                  <>
                    <Button variant="contained" disabled={busy} onClick={() => void action("accept")}>
                      Accept order
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={busy}
                      onClick={() => void action("reject", { reason: "Rejected via admin simulation" })}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                {order.fulfillmentStatus === "ACCEPTED" ? (
                  <Button variant="contained" disabled={busy} onClick={() => void action("start-preparation")}>
                    Start preparation
                  </Button>
                ) : null}
                {order.fulfillmentStatus === "PACKAGES_FINALIZED" ? (
                  <Button variant="contained" disabled={busy} onClick={() => void action("ready-for-shipment")}>
                    Ready for shipment
                  </Button>
                ) : null}
              </Stack>

              {labels.length > 0 ? (
                <>
                  <Divider />
                  <Typography variant="subtitle2">Package pickup labels (seller-only)</Typography>
                  {labels.map((pkg) =>
                    pkg.activeLabel ? (
                      <Stack key={pkg.id} direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {pkg.packageIdentifier} · label v{pkg.activeLabel.version} · {pkg.activeLabel.status}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          disabled={!pkg.activeLabel.pdfDownloadUrl}
                          onClick={() =>
                            pkg.activeLabel?.pdfDownloadUrl &&
                            void download(pkg.activeLabel.pdfDownloadUrl, `label-${pkg.packageIdentifier}.pdf`)
                          }
                        >
                          PDF
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          disabled={!pkg.activeLabel.pngDownloadUrl}
                          onClick={() =>
                            pkg.activeLabel?.pngDownloadUrl &&
                            void download(pkg.activeLabel.pngDownloadUrl, `label-${pkg.packageIdentifier}.png`)
                          }
                        >
                          PNG
                        </Button>
                      </Stack>
                    ) : null,
                  )}
                </>
              ) : null}
            </Stack>
          </CardContent>
        </Card>

        {editablePackages ? (
          <Card variant="outlined" sx={{ width: { xs: "100%", lg: 480 } }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700}>
                    Package builder
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setPackages((previous) => [
                        ...previous,
                        {
                          packageName: order?.items[0]?.productName ?? `Package ${previous.length + 1}`,
                          weightKg: "0.5",
                          size: "SMALL",
                          fragile: false,
                          allocations: {},
                        },
                      ])
                    }
                  >
                    <AddIcon />
                  </IconButton>
                </Stack>

                {packages.map((pkg, index) => (
                  <Card key={index} variant="outlined" sx={{ bgcolor: "background.default" }}>
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <TextField
                            size="small"
                            label="Package name"
                            value={pkg.packageName}
                            onChange={(event) =>
                              setPackages((previous) =>
                                previous.map((entry, i) => (i === index ? { ...entry, packageName: event.target.value } : entry)),
                              )
                            }
                            fullWidth
                          />
                          <IconButton
                            size="small"
                            disabled={packages.length <= 1}
                            onClick={() => setPackages((previous) => previous.filter((_, i) => i !== index))}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            label="Weight (kg)"
                            value={pkg.weightKg}
                            onChange={(event) =>
                              setPackages((previous) =>
                                previous.map((entry, i) => (i === index ? { ...entry, weightKg: event.target.value } : entry)),
                              )
                            }
                          />
                          <FormControl size="small" fullWidth>
                            <InputLabel>Size</InputLabel>
                            <Select
                              label="Size"
                              value={pkg.size}
                              onChange={(event) =>
                                setPackages((previous) =>
                                  previous.map((entry, i) => (i === index ? { ...entry, size: event.target.value } : entry)),
                                )
                              }
                            >
                              {PACKAGE_SIZES.map((size) => (
                                <MenuItem key={size} value={size}>
                                  {size}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Items inside
                        </Typography>
                        {order.items.map((item) => (
                          <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ flex: 1 }}>
                              {item.productName} (x{item.quantity})
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              inputProps={{ min: 0, max: item.quantity }}
                              value={pkg.allocations[item.id] ?? 0}
                              onChange={(event) =>
                                setPackages((previous) =>
                                  previous.map((entry, i) =>
                                    i === index
                                      ? {
                                          ...entry,
                                          allocations: {
                                            ...entry.allocations,
                                            [item.id]: Math.max(0, Math.min(item.quantity, Number(event.target.value) || 0)),
                                          },
                                        }
                                      : entry,
                                  ),
                                )
                              }
                              sx={{ width: 80 }}
                            />
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}

                {allocationError ? <Alert severity="warning">{allocationError}</Alert> : null}
                <Button variant="contained" disabled={busy || Boolean(allocationError)} onClick={() => void finalize()}>
                  Finalize packages
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Box>
  );
}
