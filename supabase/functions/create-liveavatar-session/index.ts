import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const HEYGEN_API_KEY = "ff7941e7-bf38-11f0-a99e-066a7fa2e369";
const HEYGEN_API_URL = "https://api.heygen.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Creating HeyGen streaming token...');

    const response = await fetch(`${HEYGEN_API_URL}/v1/streaming.create_token`, {
      method: 'POST',
      headers: {
        'x-api-key': HEYGEN_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HeyGen API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Failed to create token: ${errorText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Token created successfully');

    return new Response(
      JSON.stringify({ sessionToken: data.data.token }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});