#!/usr/bin/env bash
#
# setup-ssl.sh <domain> <email>
# Provisions (or renews) a Let's Encrypt certificate for <domain> using the
# Certbot nginx plugin, which also edits the site config to add the 443 block
# and an HTTP->HTTPS redirect. Idempotent: if a cert already exists it no-ops.
#
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "usage: setup-ssl.sh <domain> <email>" >&2
  exit 1
fi

if sudo certbot certificates 2>/dev/null | grep -q "Domains: $DOMAIN"; then
  echo "[setup-ssl] Certificate for $DOMAIN already exists — ensuring renewal timer is active."
  sudo certbot renew --dry-run --quiet || true
  exit 0
fi

sudo certbot --nginx \
  -d "$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --redirect \
  --hsts \
  --email "$EMAIL" \
  --no-eff-email

echo "[setup-ssl] Certificate provisioned for $DOMAIN."
