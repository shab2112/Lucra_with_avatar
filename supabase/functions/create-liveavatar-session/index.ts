import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LIVEAVATAR_API_KEY = "ff7941e7-bf38-11f0-a99e-066a7fa2e369";
const LIVEAVATAR_API_URL = "https://api.liveavatar.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { avatarId, voiceId, knowledgeBaseId } = await req.json();

    console.log('Creating LiveAvatar session with:', { avatarId, voiceId, knowledgeBaseId });

    const response = await fetch(`${LIVEAVATAR_API_URL}/v1/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LIVEAVATAR_API_KEY}`,
      },
      body: JSON.stringify({
        avatarId,
        voiceId,
        knowledgeBaseId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveAvatar API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Failed to create session: ${errorText}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Session created successfully');

    return new Response(
      JSON.stringify(data),
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