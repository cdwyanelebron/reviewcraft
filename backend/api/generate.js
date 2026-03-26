// api/generate.js
// POST /api/generate
// Body: { content, title, courseCode, purpose, detail, special, themeId, userId? }
// Returns: { reviewer: { id, html, data }, ok: true }

const Anthropic = require("@anthropic-ai/sdk");
const { supabase } = require("../lib/supabase");

const client = new Anthropic.Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Prompt maps ──────────────────────────────────────────────────────────────
const PURPOSE_MAP = {
  general:     "a general study reviewer",
  exam:        "an exam preparation reviewer focusing on likely test topics",
  quiz:        "a quick quiz reviewer with the most important facts",
  finals:      "a comprehensive finals reviewer covering all major topics",
  midterms:    "a midterms reviewer",
  definitions: "a key definitions and vocabulary reviewer",
  formulas:    "a formulas and equations reviewer — highlight all formulas clearly",
  summary:     "a concise summary reviewer",
  cheatsheet:  "a compact cheat sheet with only the most critical points",
};
const DETAIL_MAP = {
  concise:  "Keep bullets very short (1 line). Max 4 subtopics per section. Be minimal.",
  standard: "Balance depth and brevity. Include key details and brief explanations.",
  detailed: "Be comprehensive. Include definitions, examples, sub-bullets, and context.",
};

const SYSTEM_PROMPT = `You are an expert academic reviewer maker for Filipino college students.
Transform raw study material into a perfectly structured reviewer document.

Output ONLY valid JSON — no markdown fences, no preamble, no explanation. Exact schema:
{
  "lectureTitle": "string",
  "courseCode": "string",
  "summary": "2-3 sentence overview of the entire content",
  "topicOutline": [
    { "num": "1", "mainTopic": "string", "subtopics": ["string"] }
  ],
  "sections": [
    {
      "id": "string",
      "title": "string",
      "bullets": [{ "text": "string", "sub": ["string"] }],
      "notes": ["string"],
      "subsections": [
        {
          "id": "string",
          "title": "string",
          "bullets": [{ "text": "string", "sub": [] }],
          "example": "string or null"
        }
      ]
    }
  ],
  "keyTerms": [
    { "term": "string", "definition": "string" }
  ]
}

Rules:
- 2–5 main sections
- 1–3 subsections each
- keyTerms: 5–12 most important vocabulary words
- summary: plain text overview
- Student-friendly, clear Filipino college language
- If content is very long, summarize and extract the most important points`;

// ── Main handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Handle preflight
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      content,
      title     = "Reviewer",
      courseCode = "",
      purpose   = "general",
      detail    = "standard",
      special   = "",
      themeId   = "cyan",
      userId    = null,   // optional — if logged in via Supabase auth
    } = req.body;

    // ── Validate ──
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: "Content is too short. Please provide more text." });
    }

    // ── Trim content to safe size ──
    const safeContent = content.substring(0, 6000);

    const purposeText = PURPOSE_MAP[purpose] || PURPOSE_MAP.general;
    const detailText  = DETAIL_MAP[detail]   || DETAIL_MAP.standard;

    const userPrompt = [
      `Create ${purposeText}.`,
      detailText,
      special ? `Special instructions: ${special}` : "",
      `Title: "${title}"`,
      courseCode ? `Course code: "${courseCode}"` : "",
      "",
      "STUDY MATERIAL:",
      safeContent,
    ].filter(Boolean).join("\n");

    // ── Call Anthropic (Haiku — fast + cheap) ──
    const message = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const rawText = (message.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("AI returned invalid JSON. Please try again.");
    }

    // ── Save to Supabase (if userId provided or always save anonymously) ──
    let savedId = null;
    try {
      const { data: saved, error: dbErr } = await supabase
        .from("reviewers")
        .insert({
          user_id:     userId || null,
          title:       parsed.lectureTitle || title,
          course_code: parsed.courseCode   || courseCode,
          theme_id:    themeId,
          purpose,
          detail_level: detail,
          reviewer_data: parsed,          // full JSON stored in jsonb column
          created_at:  new Date().toISOString(),
        })
        .select("id")
        .single();

      if (!dbErr && saved) savedId = saved.id;
    } catch (dbSaveErr) {
      // Non-fatal — still return the reviewer even if DB save fails
      console.error("DB save error:", dbSaveErr.message);
    }

    return res.status(200).json({
      ok: true,
      reviewer: {
        id:   savedId,
        data: parsed,
      },
    });

  } catch (err) {
    console.error("Generate error:", err.message);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
