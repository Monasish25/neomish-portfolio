// Supabase Edge Function: upload-video
// Handles Mux Direct Uploads
//
// Deployed with: supabase functions deploy upload-video
// Secrets needed: MUX_TOKEN_ID, MUX_TOKEN_SECRET, OWNER_USER_ID

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth check ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownerId = Deno.env.get("OWNER_USER_ID");
    if (user.id !== ownerId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const muxTokenId = Deno.env.get("MUX_TOKEN_ID");
    const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET");
    const muxAuth = btoa(`${muxTokenId}:${muxTokenSecret}`);

    // Parse JSON body
    const body = await req.json();
    const { action } = body;

    // ───────────────────────────────────────────────────────────
    // STEP 1: GET DIRECT UPLOAD URL
    // ───────────────────────────────────────────────────────────
    if (action === "get_url") {
      const uploadRes = await fetch("https://api.mux.com/video/v1/uploads", {
        method: "POST",
        headers: {
          Authorization: `Basic ${muxAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_asset_settings: {
            playback_policy: ["public"],
            encoding_tier: "baseline",
          },
          cors_origin: "*",
        }),
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        return new Response(JSON.stringify({ error: "Mux upload creation failed", details: errBody }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const uploadData = await uploadRes.json();
      return new Response(JSON.stringify({ 
        uploadUrl: uploadData.data.url, 
        uploadId: uploadData.data.id 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ───────────────────────────────────────────────────────────
    // STEP 2: FINALIZE UPLOAD AND INSERT INTO DATABASE
    // ───────────────────────────────────────────────────────────
    if (action === "finalize") {
      const { uploadId, title, client, cat, role, tools, dur, year, blurb, aspect_ratio } = body;

      if (!uploadId) {
        return new Response(JSON.stringify({ error: "Missing uploadId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Poll for asset readiness
      let assetId = null;
      let playbackId = null;
      let attempts = 0;
      const maxAttempts = 60; // up to 5 minutes

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 5000));
        attempts++;

        const checkRes = await fetch(`https://api.mux.com/video/v1/uploads/${uploadId}`, {
          headers: { Authorization: `Basic ${muxAuth}` },
        });
        const checkData = await checkRes.json();

        if (checkData.data.asset_id) {
          assetId = checkData.data.asset_id;

          // Get the asset to find the playback ID
          const assetRes = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
            headers: { Authorization: `Basic ${muxAuth}` },
          });
          const assetData = await assetRes.json();

          if (assetData.data.playback_ids && assetData.data.playback_ids.length > 0) {
            playbackId = assetData.data.playback_ids[0].id;
            break;
          }
        }
      }

      if (!assetId || !playbackId) {
        return new Response(JSON.stringify({ error: "Timed out waiting for Mux asset" }), {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const thumbnail = `https://image.mux.com/${playbackId}/thumbnail.png?width=640&height=360&fit_mode=smartcrop`;

      // Insert into Supabase
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: project, error: insertError } = await adminSupabase
        .from("projects")
        .insert({
          title, client, cat, role, tools, dur, year, blurb, 
          aspect_ratio: aspect_ratio || "16:9",
          playback_id: playbackId,
          asset_id: assetId,
          thumbnail,
        })
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: "Database insert failed", details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ project }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
