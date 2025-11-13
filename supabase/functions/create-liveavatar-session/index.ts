import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_KEY = "ff7941e7-bf38-11f0-a99e-066a7fa2e369";
const API_URL = "https://api.liveavatar.com";
const AVATAR_ID = "0aae6046-0ab9-44fe-a08d-c5ac3f406d34";
const VOICE_ID = "ac277b338cf64d8b9686784c43c563da";
const CONTEXT_ID = "5237a256-1c21-4b84-843e-6ac4ab8deb23";
const LANGUAGE = "en";

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