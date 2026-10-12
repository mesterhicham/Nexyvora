# Edge Functions Export Package

This package contains all Edge Functions for the Academy Platform, ready for deployment to your private Supabase instance.

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Deno installed** (for local development):
   ```bash
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   
   # Windows
   irm https://deno.land/install.ps1 | iex
   ```

3. **Environment Variables** configured in your Supabase project:
   - `SUPABASE_URL` (auto-provided)
   - `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)
   - `SUPABASE_ANON_KEY` (auto-provided)
   - `RESEND_API_KEY` (for email functions)
   - `LOVABLE_API_KEY` (for AI assistant)
   - `TWILIO_ACCOUNT_SID` (optional, for WhatsApp OTP)
   - `TWILIO_AUTH_TOKEN` (optional, for WhatsApp OTP)
   - `TWILIO_WHATSAPP_NUMBER` (optional, for WhatsApp OTP)

## Edge Functions Included

| Function | Description | Auth Required |
|----------|-------------|---------------|
| `ai-assistant` | AI chat assistant for users | Yes |
| `get-formation-content-url` | Generate signed URLs for formation content | Yes |
| `manage-roles` | Admin role management | Yes (admin) |
| `send-formation-completion-email` | Send course completion emails | Yes |
| `send-payment-notification` | Send payment status emails | Yes (admin) |
| `validate-quiz` | Server-side quiz validation | Yes |
| `whatsapp-otp` | WhatsApp OTP verification | No |

## Deployment Instructions

### 1. Link to Your Supabase Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

### 2. Set Environment Secrets

```bash
# Required secrets
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set LOVABLE_API_KEY=your_lovable_api_key

# Optional (for WhatsApp OTP)
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=your_whatsapp_number
```

### 3. Deploy All Functions

```bash
# Deploy all functions at once
supabase functions deploy

# Or deploy individually
supabase functions deploy ai-assistant
supabase functions deploy get-formation-content-url
supabase functions deploy manage-roles
supabase functions deploy send-formation-completion-email
supabase functions deploy send-payment-notification
supabase functions deploy validate-quiz
supabase functions deploy whatsapp-otp
```

### 4. Verify Deployment

```bash
supabase functions list
```

## Configuration

The `config.toml` file contains JWT verification settings for each function.

Functions with `verify_jwt = false` handle authentication manually within the function code to support both authenticated and unauthenticated requests.

## Calling Edge Functions

From your frontend:

```typescript
import { supabase } from '@/integrations/supabase/client';

// For authenticated functions
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* your data */ }
});

// The Supabase client automatically includes the auth token
```

## Troubleshooting

### Deploy fails with 500 error
- Delete the `deno.lock` file and retry
- Check that all imports are valid

### Function returns 401 Unauthorized
- Ensure the user is logged in
- Check that the Authorization header is being sent

### Function returns 403 Forbidden
- Verify the user has the required role (admin/teacher/student)

## Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"key": "value"}'
```
