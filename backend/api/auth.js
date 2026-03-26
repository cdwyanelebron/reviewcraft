// api/auth.js
// POST /api/auth?action=signup|login|logout|me
// Thin wrapper around Supabase Auth for the frontend to call

const { createClient } = require("@supabase/supabase-js");

// Uses ANON key here (not service key) — auth operations use RLS
const getClient = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query.action;
  const supabase = getClient();

  try {
    // ── SIGN UP ──────────────────────────────────────
    if (action === "signup" && req.method === "POST") {
      const { email, password, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || "" } },
      });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ ok: true, user: data.user, session: data.session });
    }

    // ── LOGIN ────────────────────────────────────────
    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });
      return res.status(200).json({ ok: true, user: data.user, session: data.session });
    }

    // ── LOGOUT ───────────────────────────────────────
    if (action === "logout" && req.method === "POST") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      const { createClient: createUserClient } = require("@supabase/supabase-js");
      const userClient = createUserClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      await userClient.auth.signOut();
      return res.status(200).json({ ok: true });
    }

    // ── GET CURRENT USER (from token) ────────────────
    if (action === "me" && req.method === "GET") {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: "Invalid token" });
      return res.status(200).json({ ok: true, user });
    }

    return res.status(400).json({ error: "Unknown action. Use: signup|login|logout|me" });

  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
