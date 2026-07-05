#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v flyctl >/dev/null 2>&1; then
  echo "Install Fly CLI:  brew install flyctl"
  echo "Then log in:       fly auth login"
  exit 1
fi

APP="$(grep '^app = ' fly.toml | sed "s/app = '//;s/'//")"
REGION="$(grep '^primary_region = ' fly.toml | sed "s/primary_region = '//;s/'//")"
VOLUME="fitnesspal_data"

if ! flyctl apps list 2>/dev/null | grep -q "$APP"; then
  echo "Creating Fly app: $APP"
  flyctl apps create "$APP" --yes || true
fi

if ! flyctl volumes list -a "$APP" 2>/dev/null | grep -q "$VOLUME"; then
  echo "Creating 1GB volume ($VOLUME) in $REGION ..."
  flyctl volumes create "$VOLUME" --region "$REGION" --size 1 -a "$APP" --yes
fi

if ! flyctl secrets list -a "$APP" 2>/dev/null | grep -q JWT_SECRET; then
  SECRET="$(openssl rand -hex 32)"
  echo "Setting JWT_SECRET ..."
  flyctl secrets set "JWT_SECRET=$SECRET" -a "$APP"
fi

echo "Deploying ..."
flyctl deploy -a "$APP"

echo ""
echo "Done. Open:"
flyctl info -a "$APP" | grep -i hostname || flyctl open -a "$APP"
