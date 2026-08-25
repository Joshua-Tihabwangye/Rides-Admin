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
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { simListSellerOrders, type SellerOrderSummary } from "../../services/api/marketplaceApi";
import { useSimulationSession } from "../../components/marketplace/useSimulationSession";

const TABS = [
  { value: "", label: "All" },
  { value: "PENDING_SELLER_ACCEPTANCE", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "PACKAGES_FINALIZED", label: "Packages Finalized" },
  { value: "READY_FOR_SHIPMENT", label: "Ready" },
  { value: "HANDED_TO_DRIVER", label: "With Driver" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "REJECTED", label: "Rejected" },
];

function statusColor(status: string): "default" | "primary" | "success" | "warning" | "error" {
  if (status === "DELIVERED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "error";
  if (status === "PENDING_SELLER_ACCEPTANCE") return "warning";
  if (status === "READY_FOR_SHIPMENT") return "primary";
  return "default";
}

export default function MarketplaceSellerOrdersPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSimulationSession();
  const [tab, setTab] = useState("");
  const [orders, setOrders] = useState<SellerOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const result = await simListSellerOrders(session.id, tab || undefined);
      setOrders(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load seller orders");
    } finally {
      setLoading(false);
    }
  }, [session, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  if (sessionLoading) {
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

  return (
    <Box py={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">Marketplace — Seller Orders</Typography>
          <Typography variant="body2" color="text.secondary">
            Live fulfilment queue of the simulated seller organization.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => void load()}>
          Refresh
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
        {TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Alert severity="info">No seller orders in this state yet. Place an order from the Client Cart.</Alert>
      ) : (
        <Card variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Seller order</TableCell>
                  <TableCell>Fulfilment</TableCell>
                  <TableCell>Dispatch</TableCell>
                  <TableCell align="right">Items</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Created</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {order.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        order {order.marketplaceOrderId.slice(0, 8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" color={statusColor(order.fulfillmentStatus)} label={order.fulfillmentStatus} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={order.dispatchStatus} />
                      {order.dispatchFailureReason ? (
                        <Typography variant="caption" color="error" display="block">
                          {order.dispatchFailureReason}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="right">{order.itemCount ?? "—"}</TableCell>
                    <TableCell align="right">{order.totalQuantity ?? "—"}</TableCell>
                    <TableCell align="right">
                      {order.currency} {Math.round(order.subtotal).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => navigate(`/admin/marketplace/seller/orders/${order.id}`)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
