#!/usr/bin/env bash
#
# setup-server.sh — Idempotent first-boot provisioning for an EVzone web
# droplet (Ubuntu 22.04/24.04). Safe to re-run; every step is guarded.
#
# Installs: nginx, Certbot (+ nginx plugin), and hardens the firewall.
# Frontends are static files served by nginx; no Node/PM2 runtime is required
# on the host (builds happen in CI).
#
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

log() { echo "[setup-server] $*"; }

if ! command -v nginx >/dev/null 2>&1 || ! command -v certbot >/dev/null 2>&1; then
  log "Installing nginx + certbot"
  sudo apt-get update -y
  sudo apt-get install -y nginx certbot python3-certbot-nginx ufw
  sudo systemctl enable --now nginx
else
  log "nginx + certbot already present"
fi

sudo mkdir -p /var/www/_letsencrypt

log "Configuring UFW (allow 22/80/443, deny the rest)"
sudo ufw --force enable || true
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming || true
sudo ufw default allow outgoing || true

if ! sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (sudo crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --nginx") | sudo crontab -
  log "Added Certbot renew cron"
fi

log "Server setup complete."
