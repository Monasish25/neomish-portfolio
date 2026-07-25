import { supabase } from "./supabaseClient";

export async function logActivity(action, details) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from("activity_log").insert([{ action, details }]);
    if (error) console.error("Activity logging error:", error);
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
