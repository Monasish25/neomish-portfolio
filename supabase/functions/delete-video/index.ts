// Supabase Edge Function: delete-video
// Receives project_id, deletes Mux asset, removes database row
//
// Deployed with: supabase functions deploy delete-video
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

    // ── Parse body ─────────────────────────────────────────────
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Get project to find Mux asset_id ───────────────────────
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: project, error: fetchError } = await adminSupabase
      .from("projects")
      .select("asset_id")
      .eq("id", project_id)
      .single();

    if (fetchError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Delete Mux asset (if exists) ───────────────────────────
    if (project.asset_id) {
      const muxTokenId = Deno.env.get("MUX_TOKEN_ID");
      const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET");
      const muxAuth = btoa(`${muxTokenId}:${muxTokenSecret}`);

      const muxRes = await fetch(`https://api.mux.com/video/v1/assets/${project.asset_id}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${muxAuth}` },
      });

      // Mux returns 204 on success; 404 if already deleted — both are fine
      if (!muxRes.ok && muxRes.status !== 404) {
        console.error("Mux delete failed:", await muxRes.text());
        // Continue with DB delete anyway
      }
    }

    // ── Delete from database ───────────────────────────────────
    const { error: deleteError } = await adminSupabase
      .from("projects")
      .delete()
      .eq("id", project_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: "Database delete failed", details: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
