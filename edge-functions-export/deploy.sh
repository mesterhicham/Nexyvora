#!/bin/bash

# Academy Platform - Edge Functions Deployment Script
# This script deploys all edge functions to your Supabase project

set -e

echo "🚀 Academy Platform - Edge Functions Deployment"
echo "================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
echo "📋 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Running login..."
    supabase login
fi

# Check if project is linked
if [ ! -f "./.supabase/linked_project" ] && [ ! -f "./supabase/.temp" ]; then
    echo ""
    echo "⚠️  Project not linked yet."
    read -p "Enter your Supabase project reference ID: " PROJECT_REF
    supabase link --project-ref "$PROJECT_REF"
fi

echo ""
echo "📦 Deploying Edge Functions..."
echo ""

# Deploy each function
FUNCTIONS=(
    "ai-assistant"
    "get-formation-content-url"
    "manage-roles"
    "send-payment-notification"
    "send-formation-completion-email"
    "validate-quiz"
    "whatsapp-otp"
)

for func in "${FUNCTIONS[@]}"; do
    echo "  → Deploying $func..."
    supabase functions deploy "$func" --no-verify-jwt || {
        echo "  ⚠️  Failed to deploy $func, continuing..."
    }
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployed functions:"
supabase functions list

echo ""
echo "🔐 Don't forget to set your secrets:"
echo "   supabase secrets set RESEND_API_KEY=your_key"
echo "   supabase secrets set LOVABLE_API_KEY=your_key"
echo ""
