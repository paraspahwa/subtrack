import { createClient } from 'npm:@insforge/sdk';
import Razorpay from 'npm:razorpay';

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

  const { data: sessionData, error: sessionError } = await client.auth.getCurrentSession();
  if (sessionError || !sessionData?.session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = sessionData.session.user.id;
  const { amount, currency, plan_type } = await req.json();

  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID') || '',
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') || '',
  });

  try {
    const order = await razorpay.orders.create({
      amount: amount, // in paise
      currency: currency || 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { user_id: userId, plan: plan_type || 'pro' },
    });

    // Store order in database
    const { error: dbError } = await client.database.from('payments').insert([{
      user_id: userId,
      razorpay_order_id: order.id,
      plan: plan_type || 'pro',
      amount: amount / 100,
      currency: currency || 'INR',
      status: 'pending'
    }]);

    if (dbError) throw dbError;

    return new Response(JSON.stringify({
      razorpay_order_id: order.id,
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      amount: amount,
      currency: currency || 'INR',
      email: userData.user.email,
    }), {
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
