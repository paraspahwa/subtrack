import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// This admin function creates a user via InsForge auth (service role)
// POST body: { email, password, full_name }
export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow authenticated admin requests
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const client = createClient({
    baseUrl: Deno.env.get('APP_URL') || '',
    edgeFunctionToken: authHeader.replace('Bearer ', '')
  });

  // Verify caller is authenticated
    const { data: sessionData, error: sessionError } = await client.auth.getCurrentSession();
    if (sessionError || !sessionData?.session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userData = { user: sessionData.session.user };
  }

  try {
    const { email, password, full_name } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sign up new user via auth
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password,
      name: full_name || email.split('@')[0],
    });

    if (signUpError) throw signUpError;

    return new Response(JSON.stringify({ success: true, user: signUpData?.user }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
