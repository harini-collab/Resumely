/**
 * Career Intelligence Routes
 * Converted from Python career_intel_backend to Node.js.
 * Provides AI-powered job matching and career insights.
 */

const express = require("express");
const { authenticate } = require("../middleware/auth");
const Resume = require("../models/Resume");
const { JOB_ROLES } = require("../config/jobRoles");

const router = express.Router();

// All career routes require auth
router.use(authenticate);

// ─── POST /api/career/job-match ───────────────────────────────────────────────
// Matches a user's resume against multiple job roles and returns confidence scores
router.post("/job-match", async (req, res) => {
  try {
    const { resumeId } = req.body;

    let resume;
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resume) {
        return res.status(404).json({ success: false, message: "Resume not found." });
      }
    } else {
      // Use the latest analyzed resume
      resume = await Resume.findOne({ userId: req.user._id, isAnalyzed: true })
        .sort({ createdAt: -1 });
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: "No analyzed resume found. Upload and analyze a resume first.",
        });
      }
    }

    const userSkills = new Set((resume.extractedData?.skills || []).map((s) => s.toLowerCase()));
    const expCount   = resume.extractedData?.experience?.length || 0;
    const projCount  = resume.extractedData?.projects?.length  || 0;

    // Score each job role against the user's skills
    const matches = Object.entries(JOB_ROLES).map(([key, role]) => {
      const required  = role.requiredSkills  || [];
      const important = role.importantSkills || [];
      const niceToHave= role.niceToHave      || [];

      const reqMatched   = required.filter((s)  => userSkills.has(s.toLowerCase())).length;
      const impMatched   = important.filter((s) => userSkills.has(s.toLowerCase())).length;
      const niceMatched  = niceToHave.filter((s) => userSkills.has(s.toLowerCase())).length;

      // Weighted confidence
      const reqScore  = required.length  ? (reqMatched  / required.length)  * 50 : 0;
      const impScore  = important.length ? (impMatched  / important.length)  * 30 : 0;
      const niceScore = niceToHave.length? (niceMatched / niceToHave.length) * 10 : 0;

      // Experience & project bonus
      const expBonus  = Math.min(expCount  * 2, 6);
      const projBonus = Math.min(projCount * 1.5, 4);

      const confidence = Math.round(Math.min(reqScore + impScore + niceScore + expBonus + projBonus, 100));

      const missingRequired = required.filter((s) => !userSkills.has(s.toLowerCase()));

      return {
        role: key,
        displayName: role.displayName,
        confidence,
        matchedRequired: reqMatched,
        totalRequired: required.length,
        missingRequired: missingRequired.slice(0, 5),
        reason: buildMatchReason(confidence, reqMatched, required.length, role.displayName),
      };
    });

    // Sort by confidence descending, return top 8
    const topMatches = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        label: resume.label,
        totalSkills: userSkills.size,
        jobMatches: topMatches,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Job match error:", error.message);
    res.status(500).json({ success: false, message: "Job match failed: " + error.message });
  }
});

// ─── GET /api/career/insights ─────────────────────────────────────────────────
// Returns aggregated insights across all user resumes
router.get("/insights", async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id, isAnalyzed: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("scores skillAnalysis jobTarget extractedData createdAt label");

    if (resumes.length === 0) {
      return res.json({
        success: true,
        data: {
          message: "Upload and analyze resumes to unlock insights.",
          totalResumes: 0,
          insights: [],
        },
      });
    }

    // Aggregate skill gaps across all resumes
    const allMissing = {};
    const allMatched = {};
    resumes.forEach((r) => {
      (r.skillAnalysis?.missing || []).forEach((s) => {
        allMissing[s] = (allMissing[s] || 0) + 1;
      });
      (r.skillAnalysis?.matched || []).forEach((s) => {
        allMatched[s] = (allMatched[s] || 0) + 1;
      });
    });

    const topMissingSkills = Object.entries(allMissing)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    const topStrengthSkills = Object.entries(allMatched)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Score trends
    const latest = resumes[0];
    const oldest = resumes[resumes.length - 1];
    const avgJobScore = Math.round(
      resumes.reduce((sum, r) => sum + (r.scores?.jobScore || 0), 0) / resumes.length
    );

    // Targeted roles
    const roleFreq = {};
    resumes.forEach((r) => {
      const role = r.jobTarget?.displayName;
      if (role) roleFreq[role] = (roleFreq[role] || 0) + 1;
    });
    const targetRoles = Object.entries(roleFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([role]) => role);

    res.json({
      success: true,
      data: {
        totalResumes: resumes.length,
        latestResume: {
          id: latest._id,
          label: latest.label,
          jobScore: latest.scores?.jobScore || 0,
          resumeScore: latest.scores?.resumeScore || 0,
        },
        averageJobScore: avgJobScore,
        targetRoles,
        topMissingSkills,
        topStrengthSkills,
        scoreImprovement: resumes.length > 1
          ? Math.round((latest.scores?.jobScore || 0) - (oldest.scores?.jobScore || 0))
          : 0,
        recommendations: buildRecommendations(topMissingSkills, avgJobScore),
      },
    });
  } catch (error) {
    console.error("Insights error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch insights: " + error.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildMatchReason(confidence, reqMatched, totalRequired, roleName) {
  if (confidence >= 75) return `Strong match for ${roleName} — you have ${reqMatched}/${totalRequired} core skills`;
  if (confidence >= 50) return `Decent match — ${reqMatched}/${totalRequired} required skills present`;
  if (confidence >= 25) return `Partial match — significant skill gaps remain`;
  return `Low match — most required skills for ${roleName} are missing`;
}

function buildRecommendations(missingSkills, avgScore) {
  const recs = [];
  if (avgScore < 50) {
    recs.push("Your average job match is below 50% — focus on building core technical skills.");
  }
  if (missingSkills.length > 0) {
    const top3 = missingSkills.slice(0, 3).map((s) => s.skill).join(", ");
    recs.push(`Most frequently missing skills across your resumes: ${top3}. Consider adding these.`);
  }
  recs.push("Upload multiple resume versions to track your improvement over time.");
  return recs;
}

module.exports = router;
