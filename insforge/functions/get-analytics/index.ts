import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const EXCHANGE_RATES: Record<string, number> = {
  "USD_INR": 83.0,
  "INR_USD": 1/83.0,
  "EUR_USD": 1.08,
  "USD_EUR": 1/1.08,
  "GBP_USD": 1.27,
  "USD_GBP": 1/1.27,
};

function getExchangeRate(fromCurr: string, toCurr: string): number {
  fromCurr = fromCurr.toUpperCase();
  toCurr = toCurr.toUpperCase();
  if (fromCurr === toCurr) return 1.0;
  const key = `${fromCurr}_${toCurr}`;
  return EXCHANGE_RATES[key] || 1.0;
}

function calculateMonthlyCost(sub: any): number {
  let base = sub.amount;
  if (sub.billing_cycle === 'yearly') {
    base = sub.amount / 12;
  } else if (sub.billing_cycle === 'weekly') {
    base = sub.amount * 4.33;
  }
  return base / Math.max(1, sub.num_members || 1);
}

function convertedMonthlyCost(sub: any, targetCurrency: string): number {
  const cost = calculateMonthlyCost(sub);
  const rate = getExchangeRate(sub.currency || 'USD', targetCurrency);
  return cost * rate;
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : null;

  const client = createClient({
    baseUrl: Deno.env.get('APP_URL'),
    edgeFunctionToken: userToken,
  });

  // 1. Get User Profile
  const { data: sessionData, error: sessionError } = await client.auth.getCurrentSession();
  if (sessionError || !sessionData?.session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = sessionData.session.user.id;

  // 2. Get Profile Data (Currency)
  const { data: profiles, error: profileError } = await client.database
    .from('profiles')
    .select('home_currency')
    .eq('id', userId);
  
  const homeCurrency = profiles?.[0]?.home_currency || 'USD';

  // 3. Get Active Subscriptions
  const { data: subs, error: subsError } = await client.database
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (subsError) {
    return new Response(JSON.stringify({ error: subsError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!subs) {
    return new Response(JSON.stringify({ monthly_total: 0, yearly_total: 0, home_currency: homeCurrency }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Calculate Analytics
  const monthlyTotal = subs.reduce((acc, s) => acc + convertedMonthlyCost(s, homeCurrency), 0);
  const yearlyTotal = monthlyTotal * 12;

  const byCategory: Record<string, number> = {};
  subs.forEach(s => {
    const cost = convertedMonthlyCost(s, homeCurrency);
    const cat = s.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + cost;
  });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingRenewals = subs
    .filter(s => {
      const nextDate = s.next_billing_date ? new Date(s.next_billing_date) : null;
      return nextDate && nextDate >= now && nextDate <= in30Days;
    })
    .sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime())
    .slice(0, 5);

  const sortedSubs = [...subs].sort((a, b) => calculateMonthlyCost(b) - calculateMonthlyCost(a));
  const wasteSubs = subs.filter(s => s.usage_rating && s.usage_rating <= 2);
  const wasteMonthly = wasteSubs.reduce((acc, s) => acc + convertedMonthlyCost(s, homeCurrency), 0);

  return new Response(JSON.stringify({
    monthly_total: Math.round(monthlyTotal * 100) / 100,
    yearly_total: Math.round(yearlyTotal * 100) / 100,
    home_currency: homeCurrency,
    active_count: subs.length,
    by_category: Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, Math.round(v * 100) / 100])),
    upcoming_renewals: upcomingRenewals,
    most_expensive: sortedSubs.slice(0, 3),
    waste_subs: wasteSubs,
    waste_monthly: Math.round(wasteMonthly * 100) / 100,
    potential_yearly_savings: Math.round(wasteMonthly * 12 * 100) / 100,
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
