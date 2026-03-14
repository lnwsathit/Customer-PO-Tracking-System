#!/usr/bin/env bash
set -euo pipefail

SERVER_USER="sathit"
SERVER_HOST="192.168.1.114"
APP_DIR="/var/www/customer-po-tracking"
REPO_URL="https://github.com/lnwsathit/Customer-PO-Tracking-System.git"

ssh "${SERVER_USER}@${SERVER_HOST}" << 'EOF'
set -euo pipefail

APP_DIR="/var/www/customer-po-tracking"
REPO_URL="https://github.com/lnwsathit/Customer-PO-Tracking-System.git"

sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

npm install --omit=dev

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
fi

mysql -u root -p < "$APP_DIR/sql/schema.sql"

sudo cp "$APP_DIR/deploy/customer-po-tracking.service" /etc/systemd/system/customer-po-tracking.service
sudo systemctl daemon-reload
sudo systemctl enable customer-po-tracking
sudo systemctl restart customer-po-tracking

sudo cp "$APP_DIR/deploy/nginx-customer-po-tracking.conf" /etc/nginx/sites-available/customer-po-tracking
sudo ln -sf /etc/nginx/sites-available/customer-po-tracking /etc/nginx/sites-enabled/customer-po-tracking
sudo nginx -t
sudo systemctl reload nginx

sudo systemctl --no-pager --full status customer-po-tracking || true
EOF