import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_KEY = Deno.env.get("LIVEAVATAR_API_KEY") || "e12d7f47-c09d-11f0-a99e-066a7fa2e369";
const API_URL = Deno.env.get("LIVEAVATAR_API_URL") || "https://api.liveavatar.com";
const AVATAR_ID = Deno.env.get("LIVEAVATAR_AVATAR_ID") || "0aae6046-0ab9-44fe-a08d-c5ac3f406d34";
const VOICE_ID = Deno.env.get("LIVEAVATAR_VOICE_ID") || "b2bd6569-a537-4342-aeca-a1f15d2a2c97";
const CONTEXT_ID = Deno.env.get("LIVEAVATAR_CONTEXT_ID") || "6a4a3c62-a8f3-4bd4-b7b2-08c31fd72428";
const LANGUAGE = Deno.env.get("LIVEAVATAR_LANGUAGE") || "en";

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