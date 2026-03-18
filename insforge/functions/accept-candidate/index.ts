import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : '';

  const client = createClient({
    baseUrl: Deno.env.get('APP_URL') || '',
    edgeFunctionToken: userToken
  });

  const { data: userData, error: userError } = await client.auth.getCurrentUser();
  if (userError || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.user.id;
  const { id } = await req.json();

  try {
    // 1. Fetch candidate
    const { data: candidate, error: candidateError } = await client.database
      .from('discovery_candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (candidateError || !candidate) throw new Error('Candidate not found');

    // 2. Create subscription
    const { data: subscription, error: subError } = await client.database
      .from('subscriptions')
      .insert([{
        user_id: userId,
        name: candidate.merchant_name,
        amount: candidate.amount || 0,
        currency: candidate.currency || 'USD',
        billing_cycle: candidate.billing_cycle_guess || 'monthly',
        next_billing_date: candidate.next_billing_date_guess,
        is_active: true
      }])
      .select()
      .single();

    if (subError) throw subError;

    // 3. Update candidate status
    const { error: updateError } = await client.database
      .from('discovery_candidates')
      .update({
        status: 'accepted',
        accepted_subscription_id: subscription.id
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify(subscription), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
