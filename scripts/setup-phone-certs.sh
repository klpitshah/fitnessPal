#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERT_DIR="$ROOT/certs"
mkdir -p "$CERT_DIR"

IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$IP" ]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [ -z "$IP" ]; then
  echo "Could not detect your Wi-Fi IP. Set PHONE_IP=192.168.x.x and re-run."
  exit 1
fi

echo "Generating HTTPS certificate for localhost and $IP ..."

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$CERT_DIR/key.pem" \
  -out "$CERT_DIR/cert.pem" \
  -days 825 \
  -subj "/CN=FitnessPal" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:${IP}" \
  2>/dev/null

echo ""
echo "Done. Certificate saved to:"
echo "  $CERT_DIR/cert.pem"
echo ""
echo "One-time iPhone setup (needed for camera + Add to Home Screen):"
echo "  1. AirDrop cert.pem to your iPhone and tap to install the profile"
echo "  2. Settings → General → VPN & Device Management → install FitnessPal profile"
echo "  3. Settings → General → About → Certificate Trust Settings → enable full trust"
echo ""
echo "Then on your Mac run:  npm run phone"
echo "Open on iPhone:        https://${IP}:3847"
