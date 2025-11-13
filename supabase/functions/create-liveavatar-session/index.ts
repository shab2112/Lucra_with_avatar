import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('LIVEAVATAR_API_KEY');
    const avatarId = Deno.env.get('LIVEAVATAR_AVATAR_ID');

    console.log('Creating LiveAvatar session in CUSTOM mode');

    const response = await fetch('https://api.liveavatar.com/v1/sessions/token', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'CUSTOM',
        avatar_id: avatarId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LiveAvatar API error:', response.status, errorText);
      throw new Error(`LiveAvatar API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Session created successfully:', data.data.session_id);

    return new Response(
      JSON.stringify({
        sessionToken: data.data.session_token,
        sessionId: data.data.session_id,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});