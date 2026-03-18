-- SubTrack Gamification Schema Migration
-- 03_gamification.sql

-- 1. User XP Table
CREATE TABLE IF NOT EXISTS public.user_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp" ON public.user_xp
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own xp" ON public.user_xp
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 2. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'trophy',
    xp_reward INTEGER DEFAULT 50,
    rarity TEXT DEFAULT 'common', -- common, rare, epic, legendary
    condition_type TEXT NOT NULL, -- subscription_count, total_saved, streak_days, boss_defeated
    condition_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Achievements (join table)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Boss Battles Table
CREATE TABLE IF NOT EXISTS public.boss_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    hp INTEGER DEFAULT 1000,
    max_hp INTEGER DEFAULT 1000,
    xp_reward INTEGER DEFAULT 200,
    icon TEXT DEFAULT 'dragon',
    is_active BOOLEAN DEFAULT FALSE,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. User Boss Progress
CREATE TABLE IF NOT EXISTS public.user_boss_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    boss_id UUID NOT NULL REFERENCES public.boss_battles(id) ON DELETE CASCADE,
    damage_dealt INTEGER DEFAULT 0,
    defeated BOOLEAN DEFAULT FALSE,
    defeated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, boss_id)
);

ALTER TABLE public.user_boss_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own boss progress" ON public.user_boss_progress
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Seed: Default Achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, rarity, condition_type, condition_value) VALUES
  ('First Step',           'Add your first subscription',                      'star',        50,  'common',    'subscription_count', 1),
  ('Collector',            'Track 5 subscriptions',                            'package',     100, 'common',    'subscription_count', 5),
  ('Power User',           'Track 10 subscriptions',                           'zap',         200, 'rare',      'subscription_count', 10),
  ('Subscription Master',  'Track 20 subscriptions',                           'crown',       400, 'epic',      'subscription_count', 20),
  ('Saver',                'Cancel a subscription worth $10+',                 'piggy-bank',  150, 'common',    'total_saved',        10),
  ('Big Saver',            'Cancel subscriptions worth $100+ total',           'trending-up', 300, 'rare',      'total_saved',        100),
  ('Weekly Warrior',       'Use SubTrack 7 days in a row',                     'calendar',    250, 'rare',      'streak_days',        7),
  ('Boss Slayer',          'Defeat your first subscription boss',              'sword',       500, 'legendary', 'boss_defeated',      1)
ON CONFLICT DO NOTHING;

-- Seed: Initial Boss Battle
INSERT INTO public.boss_battles (name, description, hp, max_hp, xp_reward, icon, is_active, ends_at) VALUES
  (
    'The Subscription Dragon',
    'A fearsome dragon feeding on your forgotten subscriptions. Cancel unused subs to deal damage!',
    5000, 5000, 500, 'dragon', TRUE, now() + INTERVAL '30 days'
  )
ON CONFLICT DO NOTHING;
