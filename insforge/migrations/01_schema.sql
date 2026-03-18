-- SubTrack InsForge Schema Migration
-- 01_schema.sql

-- 1. Profiles (Extension of auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    plan TEXT DEFAULT 'free',
    home_currency TEXT DEFAULT 'USD',
    subscription_active BOOLEAN DEFAULT TRUE,
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    amount DOUBLE PRECISION NOT NULL,
    last_amount DOUBLE PRECISION,
    amount_change_pct DOUBLE PRECISION,
    amount_changed_at TIMESTAMPTZ,
    amount_alert_dismissed BOOLEAN DEFAULT FALSE,
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly, weekly
    next_billing_date TIMESTAMPTZ NOT NULL,
    start_date TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    usage_rating INTEGER, -- 1-5
    cancel_url TEXT,
    cancellation_outcome TEXT,
    cancellation_outcome_at TIMESTAMPTZ,
    color TEXT,
    num_members INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    plan TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'pending', -- pending, success, failed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. Mailbox Connections
CREATE TABLE IF NOT EXISTS public.mailbox_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    email TEXT NOT NULL,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    scopes TEXT,
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT now(),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mailbox_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mailbox connections" ON public.mailbox_connections
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. Discovery Candidates
CREATE TABLE IF NOT EXISTS public.discovery_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_connection_id UUID REFERENCES public.mailbox_connections(id) ON DELETE SET NULL,
    merchant_name TEXT NOT NULL,
    amount DOUBLE PRECISION,
    currency TEXT DEFAULT 'USD',
    billing_cycle_guess TEXT,
    next_billing_date_guess TIMESTAMPTZ,
    confidence DOUBLE PRECISION DEFAULT 0.0,
    source_type TEXT DEFAULT 'email_receipt',
    source_message_id TEXT,
    raw_excerpt TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, false_positive
    accepted_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.discovery_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own discovery candidates" ON public.discovery_candidates
    FOR ALL TO authenticated USING (auth.uid() = user_id);
