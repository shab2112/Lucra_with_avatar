import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_KEY = Deno.env.get("LIVEAVATAR_API_KEY");
const API_URL = Deno.env.get("LIVEAVATAR_API_URL");
const AVATAR_ID = Deno.env.get("LIVEAVATAR_AVATAR_ID");
const VOICE_ID = Deno.env.get("LIVEAVATAR_VOICE_ID");
const CONTEXT_ID = Deno.env.get("LIVEAVATAR_CONTEXT_ID");
const LANGUAGE = Deno.env.get("LIVEAVATAR_LANGUAGE");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Creating LiveAvatar session token...');

    const response = await fetch(`${API_URL}/v1/sessions/token`, {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'FULL',
        avatar_id: AVATAR_ID,
        avatar_persona: {
          voice_id: VOICE_ID,
          context_id: CONTEXT_ID,
          language: LANGUAGE,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.data?.[0]?.message ?? 'Failed to retrieve session token';
      console.error('LiveAvatar API error:', response.status, errorMessage);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Session created successfully');

    return new Response(
      JSON.stringify({
        sessionToken: data.data.session_token,
        sessionId: data.data.session_id,
      }),
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