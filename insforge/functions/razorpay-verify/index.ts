import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function hmacSha256(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  const generatedSignature = await hmacSha256(
    razorpay_order_id + "|" + razorpay_payment_id,
    secret
  );

  if (generatedSignature !== razorpay_signature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Update payment status
    const { data: payment, error: fetchError } = await client.database
      .from('payments')
      .select('plan')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();
    
    if (fetchError) throw fetchError;

    const { error: updatePaymentError } = await client.database
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'success',
        updated_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updatePaymentError) throw updatePaymentError;

    // 2. Update user profile to Pro
    const { error: updateProfileError } = await client.database
      .from('profiles')
      .update({
        plan: payment.plan || 'pro',
        subscription_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateProfileError) throw updateProfileError;

    return new Response(JSON.stringify({ success: true }), {
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
