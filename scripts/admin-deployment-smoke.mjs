const baseUrl = process.env.ADMIN_SMOKE_BASE_URL?.replace(/\/+$/, "");

const routes = [
  "/admin/login",
  "/admin/home",
  "/admin/drivers",
  "/admin/riders",
  "/admin/finance",
  "/admin/pricing",
  "/admin/system/overview",
];

function fail(message) {
  throw new Error(`[admin-smoke] ${message}`);
}

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (!response.ok && response.status < 300) return response;
  if (response.status >= 400) fail(`${path} returned HTTP ${response.status}`);
  return response;
}

if (!baseUrl) {
  fail("ADMIN_SMOKE_BASE_URL is required, e.g. https://admin.example.com");
}

const indexResponses = await Promise.all(routes.map((route) => get(route)));
const html = await indexResponses[0].text();
const assetRefs = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
  .map((match) => match[1])
  .filter((ref) => ref.startsWith("/assets/"));
const cssRefs = assetRefs.filter((ref) => ref.endsWith(".css"));
const jsRefs = assetRefs.filter((ref) => ref.endsWith(".js"));

if (cssRefs.length === 0) fail("index.html does not reference a CSS bundle");
if (jsRefs.length === 0) fail("index.html does not reference a JS bundle");

await Promise.all(
  assetRefs.map(async (ref) => {
    const response = await get(ref);
    const cacheControl = response.headers.get("cache-control") ?? "";
    if (!cacheControl.includes("immutable")) {
      fail(`${ref} is missing immutable Cache-Control`);
    }
  }),
);

console.log(`[admin-smoke] verified ${routes.length} routes and ${assetRefs.length} assets at ${baseUrl}`);
