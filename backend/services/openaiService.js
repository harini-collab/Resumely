require("dotenv").config();
const Groq = require("groq-sdk");

// Using Groq (free) instead of OpenAI — same API style, no cost!
const groq = new Groq({
  apiKey: process.env.OPENAI_API_KEY,  // we reuse the same env variable name
});

const GROQ_MODEL = process.env.OPENAI_MODEL || "llama3-8b-8192";

// Helper to call Groq chat completion
const chat = async (prompt, max_tokens = 500) => {
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens,
    temperature: 0.7,
  });
  return response.choices[0].message.content.trim();
};

// ─── generateAISuggestions ────────────────────────────────────────────────────
const generateAISuggestions = async (analysisResult, jobRoleDisplayName) => {
  try {
    const prompt = `
You are a professional resume coach and hiring expert.

A student's resume has been analyzed for a "${jobRoleDisplayName}" position.
Here are the results:

- Resume Score: ${analysisResult.scores.resumeScore}/100
- Job Match Score: ${analysisResult.scores.jobScore}/100
- Missing Skills: ${analysisResult.skillAnalysis.missing.join(", ") || "None"}
- Weaknesses found: ${analysisResult.feedback.weaknesses.join("; ") || "None"}

Give 3 specific, actionable suggestions to help this student improve their resume 
and increase their chances of getting hired for this role.
Each suggestion should be practical and achievable for a student.

Respond with ONLY a JSON array of 3 strings. No other text.
Example: ["suggestion 1", "suggestion 2", "suggestion 3"]
    `.trim();

    const content = await chat(prompt, 500);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(suggestions)) return suggestions.slice(0, 3);
    }
    return [];
  } catch (error) {
    console.warn("⚠️  AI suggestions failed:", error.message);
    return [];
  }
};

// ─── improveResumeSentences ───────────────────────────────────────────────────
const improveResumeSentences = async (lines, jobTarget) => {
  try {
    const prompt = `
You are a professional resume writer.

Rewrite these weak resume bullet points to be stronger, more impactful, 
and relevant for a "${jobTarget || "software engineering"}" role.

Rules:
- Add specific metrics where possible (%, numbers, time saved)
- Use strong action verbs (Built, Developed, Optimized, Led, Reduced)
- Keep each bullet under 20 words
- Make them sound professional and confident

Weak bullets to improve:
${lines.map((l, i) => `${i + 1}. ${l}`).join("\n")}

Respond with ONLY a JSON array of improved strings in the same order.
No explanation, no preamble. Just the JSON array.
    `.trim();

    const content = await chat(prompt, 600);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const improved = JSON.parse(jsonMatch[0]);
      if (Array.isArray(improved)) return improved;
    }
    return lines;
  } catch (error) {
    throw new Error("Failed to improve resume sentences: " + error.message);
  }
};

// ─── explainRejection ─────────────────────────────────────────────────────────
const explainRejection = async (analysisResult, jobRoleDisplayName) => {
  try {
    const prompt = `
You are a hiring manager at a tech company.

A student applied for a "${jobRoleDisplayName}" role. Their resume scored ${analysisResult.scores.jobScore}/100.

Missing required skills: ${analysisResult.skillAnalysis.missing.slice(0, 5).join(", ")}
Their weaknesses: ${analysisResult.feedback.weaknesses.slice(0, 3).join("; ")}

In 2-3 sentences, explain honestly WHY this resume would be rejected by an ATS system 
or a recruiter. Be direct but constructive. Address the student like a mentor.

Respond with ONLY the explanation text. No JSON, no bullet points.
    `.trim();

    return await chat(prompt, 200);
  } catch (error) {
    console.warn("⚠️  Rejection explanation failed:", error.message);
    return null;
  }
};

// ─── generateComparisonInsight ────────────────────────────────────────────────
const generateComparisonInsight = async (resume1Data, resume2Data, jobRole) => {
  try {
    const prompt = `
You are a senior recruiter comparing two candidates for a "${jobRole}" position.

Candidate 1: Score ${resume1Data.overallScore}/100, Skills: ${resume1Data.skills.slice(0, 6).join(", ")}
Candidate 2: Score ${resume2Data.overallScore}/100, Skills: ${resume2Data.skills.slice(0, 6).join(", ")}

In 2 sentences, explain which candidate is stronger for this role and the key reason why.
Be specific and honest.

Respond with ONLY the insight text. No JSON format needed.
    `.trim();

    return await chat(prompt, 150);
  } catch (error) {
    console.warn("⚠️  Comparison insight failed:", error.message);
    return null;
  }
};

module.exports = {
  generateAISuggestions,
  improveResumeSentences,
  explainRejection,
  generateComparisonInsight,
};
