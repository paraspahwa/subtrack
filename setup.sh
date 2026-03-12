#!/bin/bash

# ─────────────────────────────────────────────
# StudyQuizAI — One-command setup script
# ─────────────────────────────────────────────

set -e

echo "⚡ StudyQuizAI — Setup"
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
    echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   • OPENAI_API_KEY     → https://platform.openai.com/api-keys"
    echo "   • RAZORPAY_KEY_ID    → https://dashboard.razorpay.com/app/keys"
    echo "   • RAZORPAY_KEY_SECRET"
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

# ── Setup frontend .env ─────────────────────
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "📄 Created frontend/.env"
fi

# ── Build and run ────────────────────────────
echo ""
echo "🏗️  Building containers..."
docker compose build

echo ""
echo "🚀 Starting StudyQuizAI..."
docker compose up -d

echo ""
echo "═══════════════════════════════════════"
echo "✅ StudyQuizAI is running!"
echo ""
echo "   🌐 App:     http://localhost:3000"
echo "   🔌 API:     http://localhost:8000"
echo "   💚 Health:  http://localhost:8000/health"
echo ""
echo "📋 Next steps:"
echo "   1. Create subscription plans:"
echo "      curl -X POST http://localhost:8000/payment/create-plan"
echo ""
echo "   2. Copy the plan IDs to frontend/.env:"
echo "      VITE_RAZORPAY_MONTHLY_PLAN_ID=plan_xxxxx"
echo "      VITE_RAZORPAY_YEARLY_PLAN_ID=plan_yyyyy"
echo ""
echo "   3. Rebuild frontend: docker compose up -d --build frontend"
echo ""
echo "═══════════════════════════════════════"
echo "   To stop: docker compose down"
echo "   Logs:    docker compose logs -f"
echo "═══════════════════════════════════════"
