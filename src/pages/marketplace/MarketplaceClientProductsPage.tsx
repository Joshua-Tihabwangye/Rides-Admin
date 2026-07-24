import { useCallback, useEffect, useMemo, useState } from "react";
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
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  listMarketplaceProducts,
  simAddCartItem,
  simGetOrCreateCart,
  type MarketplaceProduct,
  type MarketplaceProductVariant,
} from "../../services/api/marketplaceApi";
import { listAdminRiders, type AdminRiderResponse } from "../../services/api/adminApi";
import { useSimulationSession } from "../../components/marketplace/useSimulationSession";

function formatUgx(amount: number, currency = "UGX") {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

export default function MarketplaceClientProductsPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading, error: sessionError, startSession } = useSimulationSession();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cartId, setCartId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [addingVariant, setAddingVariant] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, { variantId: string; quantity: number }>>({});

  // Simulation setup: buyers come from the admin riders API, sellers from the
  // live catalog — the admin never types a UUID.
  const [buyers, setBuyers] = useState<AdminRiderResponse[]>([]);
  const [buyerUserId, setBuyerUserId] = useState("");
  const [sellerOrganizationId, setSellerOrganizationId] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMarketplaceProducts({ search: search || undefined, page, limit: 8 });
      setProducts(result.items);
      setTotalPages(Math.max(1, result.meta.pageCount));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // The catalog loads immediately and independently of the simulation session.
  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (session) return;
    void (async () => {
      try {
        const riders = await listAdminRiders();
        setBuyers(riders);
        if (riders.length > 0 && !buyerUserId) {
          setBuyerUserId((riders[0] as { id?: string; userId?: string }).id ?? (riders[0] as { userId?: string }).userId ?? "");
        }
      } catch {
        // Buyer list is a convenience; setup can still be typed manually.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const sellerOptions = useMemo(
    () => Array.from(new Map(products.map((p) => [p.sellerOrganizationId, p.sellerOrganizationId])).values()),
    [products],
  );

  useEffect(() => {
    if (!sellerOrganizationId && sellerOptions.length > 0) {
      setSellerOrganizationId(sellerOptions[0]);
    }
  }, [sellerOptions, sellerOrganizationId]);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      try {
        const cart = await simGetOrCreateCart(session.id);
        setCartId(cart.id);
        setCartCount(cart.itemCount);
      } catch {
        // Cart loads lazily on first add; errors surface there.
      }
    })();
  }, [session]);

  const handleAdd = useCallback(
    async (product: MarketplaceProduct, variant: MarketplaceProductVariant) => {
      if (!session) return;
      setAddingVariant(variant.id);
      setError(null);
      try {
        let activeCartId = cartId;
        if (!activeCartId) {
          const cart = await simGetOrCreateCart(session.id);
          activeCartId = cart.id;
          setCartId(cart.id);
        }
        const quantity = selection[product.id]?.quantity ?? 1;
        const cart = await simAddCartItem(session.id, activeCartId, variant.id, quantity);
        setCartCount(cart.itemCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to add to cart");
      } finally {
        setAddingVariant(null);
      }
    },
    [session, cartId, selection],
  );

  const handleStartSimulation = useCallback(async () => {
    setSetupBusy(true);
    setSetupError(null);
    try {
      await startSession({ buyerUserId, sellerOrganizationId });
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Unable to start simulation session");
    } finally {
      setSetupBusy(false);
    }
  }, [buyerUserId, sellerOrganizationId, startSession]);

  const buyerLabel = (rider: AdminRiderResponse) => {
    const record = rider as unknown as { id?: string; userId?: string; fullName?: string; firstName?: string; lastName?: string; email?: string; phone?: string };
    const name = record.fullName ?? `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim();
    return `${name || "Rider"} · ${record.email ?? record.phone ?? ""}`;
  };

  const buyerId = (rider: AdminRiderResponse) => {
    const record = rider as unknown as { id?: string; userId?: string };
    return record.id ?? record.userId ?? "";
  };

  return (
    <Box py={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">Marketplace — Client Shop</Typography>
          <Typography variant="body2" color="text.secondary">
            Live catalog from the backend. Adding to cart writes to the simulated buyer&apos;s backend cart.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddShoppingCartIcon />} onClick={() => navigate("/admin/marketplace/client/cart")}>
          Cart ({cartCount})
        </Button>
      </Stack>

      {!session && !sessionLoading ? (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "background.default" }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 220 }}>
                <StorefrontIcon color="primary" />
                <Typography variant="subtitle2">Simulation setup</Typography>
              </Stack>
              <FormControl size="small" fullWidth>
                <InputLabel>Simulated buyer</InputLabel>
                <Select
                  label="Simulated buyer"
                  value={buyerUserId}
                  onChange={(event) => setBuyerUserId(event.target.value)}
                >
                  {buyers.map((rider) => (
                    <MenuItem key={buyerId(rider)} value={buyerId(rider)}>
                      {buyerLabel(rider)}
                    </MenuItem>
                  ))}
                  {buyers.length === 0 ? <MenuItem value="">No riders found</MenuItem> : null}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Seller organization</InputLabel>
                <Select
                  label="Seller organization"
                  value={sellerOrganizationId}
                  onChange={(event) => setSellerOrganizationId(event.target.value)}
                >
                  {sellerOptions.map((orgId) => (
                    <MenuItem key={orgId} value={orgId}>
                      {products.find((p) => p.sellerOrganizationId === orgId)?.brand ?? orgId.slice(0, 8)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={setupBusy || !buyerUserId || !sellerOrganizationId}
                onClick={() => void handleStartSimulation()}
                sx={{ whiteSpace: "nowrap" }}
              >
                {setupBusy ? "Starting…" : "Start simulation"}
              </Button>
            </Stack>
            {setupError ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {setupError}
              </Alert>
            ) : null}
            {sessionError ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {sessionError}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Search products…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(1);
              setSearch(searchInput.trim());
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 360 }}
        />
        <Button
          variant="outlined"
          onClick={() => {
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          Search
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="info">No products found. Ask an administrator to seed or create marketplace products.</Alert>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => {
            const chosen = selection[product.id];
            const chosenVariant =
              product.variants.find((variant) => variant.id === chosen?.variantId) ?? product.variants[0];
            return (
              <Grid item xs={12} md={6} lg={4} key={product.id}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.brand || "Marketplace seller"}
                          </Typography>
                        </Box>
                        <Chip size="small" label={product.status} color={product.status === "ACTIVE" ? "success" : "default"} />
                      </Stack>
                      {product.description ? (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {product.description}
                        </Typography>
                      ) : null}
                      <Divider />
                      <Stack direction="row" spacing={1}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Variant</InputLabel>
                          <Select
                            label="Variant"
                            value={chosenVariant?.id ?? ""}
                            onChange={(event) =>
                              setSelection((previous) => ({
                                ...previous,
                                [product.id]: { variantId: event.target.value, quantity: chosen?.quantity ?? 1 },
                              }))
                            }
                          >
                            {product.variants.map((variant) => (
                              <MenuItem key={variant.id} value={variant.id} disabled={variant.availableQuantity <= 0}>
                                {variant.name} — {formatUgx(variant.unitPrice, variant.currency)}
                                {variant.availableQuantity <= 0 ? " (out of stock)" : ` (${variant.availableQuantity} in stock)`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          size="small"
                          type="number"
                          label="Qty"
                          inputProps={{ min: 1, max: 99 }}
                          value={chosen?.quantity ?? 1}
                          onChange={(event) =>
                            setSelection((previous) => ({
                              ...previous,
                              [product.id]: {
                                variantId: chosenVariant?.id ?? "",
                                quantity: Math.max(1, Number(event.target.value) || 1),
                              },
                            }))
                          }
                          sx={{ width: 90 }}
                        />
                      </Stack>
                      {chosenVariant ? (
                        <Typography variant="body2" color="text.secondary">
                          {formatUgx(chosenVariant.unitPrice, chosenVariant.currency)}
                          {chosenVariant.estimatedWeightKg ? ` · ${chosenVariant.estimatedWeightKg} kg` : ""}
                          {chosenVariant.fragile ? " · fragile" : ""}
                        </Typography>
                      ) : null}
                      <Button
                        variant="contained"
                        disabled={
                          !session || !chosenVariant || chosenVariant.availableQuantity <= 0 || addingVariant === chosenVariant?.id
                        }
                        onClick={() => chosenVariant && void handleAdd(product, chosenVariant)}
                        startIcon={<AddShoppingCartIcon />}
                      >
                        {addingVariant === chosenVariant?.id
                          ? "Adding…"
                          : !session
                            ? "Start simulation to add"
                            : chosenVariant && chosenVariant.availableQuantity <= 0
                              ? "Out of stock"
                              : "Add to cart"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
        <Button disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
          Previous
        </Button>
        <Typography variant="body2" alignSelf="center">
          Page {page} of {totalPages}
        </Typography>
        <Button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
          Next
        </Button>
      </Stack>
    </Box>
  );
}
