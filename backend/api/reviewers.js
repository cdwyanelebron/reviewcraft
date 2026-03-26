// api/reviewers.js
// GET    /api/reviewers          — list user's reviewers
// GET    /api/reviewers?id=xxx   — get single reviewer
// DELETE /api/reviewers?id=xxx   — delete reviewer

const { supabase } = require("../lib/supabase");

// ── Helper: get userId from Bearer token ──────────────────────────────────────
async function getUserIdFromToken(authHeader) {
  const token = (authHeader || "").replace("Bearer ", "").trim();
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const userId = await getUserIdFromToken(req.headers.authorization);

    // ── LIST all reviewers for this user ─────────────────────────────────────
    if (req.method === "GET" && !req.query.id) {
      const query = supabase
        .from("reviewers")
        .select("id, title, course_code, theme_id, purpose, detail_level, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      // If logged in, only their reviewers. Otherwise return recent 10 anonymous.
      if (userId) {
        query.eq("user_id", userId);
      } else {
        query.is("user_id", null).limit(10);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ ok: true, reviewers: data });
    }

    // ── GET single reviewer (full data) ──────────────────────────────────────
    if (req.method === "GET" && req.query.id) {
      const { data, error } = await supabase
        .from("reviewers")
        .select("*")
        .eq("id", req.query.id)
        .single();

      if (error || !data) return res.status(404).json({ error: "Reviewer not found" });

      // Only allow owner or anonymous reviewers
      if (data.user_id && data.user_id !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      return res.status(200).json({ ok: true, reviewer: data });
    }

    // ── DELETE reviewer ───────────────────────────────────────────────────────
    if (req.method === "DELETE" && req.query.id) {
      if (!userId) return res.status(401).json({ error: "Must be logged in to delete" });

      const { error } = await supabase
        .from("reviewers")
        .delete()
        .eq("id", req.query.id)
        .eq("user_id", userId); // ensures they can only delete their own

      if (error) throw error;
      return res.status(200).json({ ok: true, deleted: req.query.id });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Reviewers error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
