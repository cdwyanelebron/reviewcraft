// lib/supabase.js
// Shared Supabase admin client (uses SERVICE KEY — server-side only, never expose to frontend)

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabase };
