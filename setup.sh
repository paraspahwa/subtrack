#!/bin/bash

# ─────────────────────────────────────────────
# SubTrack — One-command setup script
# ─────────────────────────────────────────────

set -e

echo "⚡ SubTrack — Setup"
echo "═══════════════════════════════════════"

# ── Check prerequisites ──────────────────────
echo ""
echo "🔍 Checking prerequisites..."

command -v docker >/dev/null 2>&1 || {
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   👉 https://docs.docker.com/get-docker/"
    exit 1
}

command -v docker compose >/dev/null 2>&1 || {
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   👉 https://docs.docker.com/compose/install/"
    exit 1
}

echo "✅ Docker found: $(docker --version)"
echo "✅ Docker Compose found: $(docker compose version)"

# ── Setup .env file ──────────────────────────
echo ""
echo "🔧 Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "📄 Created .env from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your keys:"
    echo "   • DATABASE_URL       → Supabase: Settings > Database > Connection string (Session mode)"
    echo "   • RAZORPAY_KEY_ID    → https://dashboard.razorpay.com/app/keys"
    echo "   • RAZORPAY_KEY_SECRET"
    echo "   • SECRET_KEY         → Run: openssl rand -hex 32"
    echo ""
    read -p "Have you added your API keys to .env? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "👉 Please edit .env with your keys, then run this script again."
        exit 0
    fi
else
    echo "✅ .env already exists"
fi

# ── Build and run ────────────────────────────
echo ""
echo "🏗️  Building containers..."
docker compose build

echo ""
echo "🚀 Starting SubTrack..."
docker compose up -d

echo ""
echo "═══════════════════════════════════════"
echo "✅ SubTrack is running!"
echo ""
echo "   🌐 Web App:  http://localhost:3000"
echo "   🔌 API:      http://localhost:8000"
echo "   💚 Health:   http://localhost:8000/health"
echo "   📖 API Docs: http://localhost:8000/docs"
echo ""
echo "📱 Mobile (React Native + Expo):"
echo "   cd frontend && npm install && npx expo start"
echo "   Scan the QR code with Expo Go (iOS/Android)"
echo ""
echo "📋 Production builds:"
echo "   eas build --platform android"
echo "   eas build --platform ios"
echo ""
echo "═══════════════════════════════════════"
echo "   To stop: docker compose down"
echo "   Logs:    docker compose logs -f"
echo "═══════════════════════════════════════"
