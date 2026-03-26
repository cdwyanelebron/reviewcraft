// api/health.js
// GET /api/health — check if the API is running

module.exports = async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    app: "ReviewCraft AI",
    version: "1.0.0",
    by: "DL Caliwan",
    timestamp: new Date().toISOString(),
    env: {
      anthropic:  !!process.env.ANTHROPIC_API_KEY,
      supabase:   !!process.env.SUPABASE_URL,
    },
  });
};
