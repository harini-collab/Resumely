const path = require("path");
const fs = require("fs");
const Resume = require("../models/Resume");
const User = require("../models/User");
const { parseResume } = require("../utils/resumeParser");
const { analyzeResume } = require("../utils/scoringEngine");
const { normalizeJobRole, JOB_ROLES } = require("../config/jobRoles");
const { extractTextFromPDF, cleanupFile } = require("../services/pdfService");
const { uploadFileToCloud, deleteFileFromCloud } = require("../services/cloudStorageService");
const { generateAISuggestions, improveResumeSentences, explainRejection, generateComparisonInsight } = require("../services/openaiService");

// ─── Helper: extract text from upload or body ─────────────────────────────────
const getResumeText = async (req) => {
  if (req.file) {
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let storage = { provider: "local" };

    try {
      const cloudAsset = await uploadFileToCloud(
        filePath,
        req.file.filename || req.file.originalname,
        req.file.mimetype
      );
      if (cloudAsset) {
        storage = cloudAsset;
      }

      if (ext === ".pdf") {
        const { text } = await extractTextFromPDF(filePath);
        cleanupFile(filePath);
        return { text, fileName: req.file.originalname, fileType: "pdf", storage };
      } else {
        const text = fs.readFileSync(filePath, "utf8");
        cleanupFile(filePath);
        return { text, fileName: req.file.originalname, fileType: "text", storage };
      }
    } catch (err) {
      cleanupFile(filePath);
      throw err;
    }
  }

  if (req.body.resumeText) {
    if (req.body.resumeText.length > 50000) {
      throw new Error("Resume text is too long. Please keep it under 50,000 characters.");
    }
    return { text: req.body.resumeText, fileName: null, fileType: "text", storage: { provider: "local" } };
  }

  throw new Error("No resume provided. Upload a PDF/TXT file or provide resumeText in the body.");
};

// ─── POST /api/resume/upload ──────────────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    const { text, fileName, fileType, storage } = await getResumeText(req);

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, message: "Resume content is too short or empty." });
    }

    const extractedData = parseResume(text);

    // Save to DB (without full analysis yet)
    const resumeCount = await Resume.countDocuments({ userId: req.user._id });
    const resume = await Resume.create({
      userId: req.user._id,
      rawText: text,
      fileName,
      fileType,
      extractedData,
      storage,
      version: resumeCount + 1,
      label: `Resume v${resumeCount + 1}`,
      isAnalyzed: false,
    });

    // Update user resume count
    await User.findByIdAndUpdate(req.user._id, { $inc: { resumeCount: 1 } });

    res.status(201).json({
      success: true,
      message: "Resume uploaded and parsed successfully",
      data: {
        resumeId: resume._id,
        version: resume.version,
        extractedData: {
          name: extractedData.name,
          email: extractedData.email,
          skillsFound: extractedData.skills?.length || 0,
          skills: extractedData.skills,
          educationFound: extractedData.education?.length || 0,
          experienceFound: extractedData.experience?.length || 0,
          projectsFound: extractedData.projects?.length || 0,
          links: extractedData.links,
        },
        instructions: "Use POST /api/resume/analyze with this resumeId and your jobTarget to get full analysis.",
        storage,
      },
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to process resume." });
  }
};

// ─── POST /api/resume/analyze ─────────────────────────────────────────────────
const analyzeResumeHandler = async (req, res) => {
  try {
    const { resumeId, jobTarget } = req.body;
    const includeAI = req.body.includeAI === true || req.body.includeAI === "true";

    let resume;

    // Support inline text + jobTarget without prior upload
    if (!resumeId) {
      const { text, fileName, fileType, storage } = await getResumeText(req);
      const extractedData = parseResume(text);
      const resumeCount = await Resume.countDocuments({ userId: req.user._id });
      resume = new Resume({
        userId: req.user._id,
        rawText: text,
        fileName,
        fileType,
        storage,
        extractedData,
        version: resumeCount + 1,
        label: `Resume v${resumeCount + 1}`,
        isAnalyzed: false,
      });
    } else {
      resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
      if (!resume) {
        return res.status(404).json({ success: false, message: "Resume not found." });
      }
    }

    if (!jobTarget) {
      return res.status(400).json({ success: false, message: "jobTarget is required for analysis." });
    }

    const normalizedRole = normalizeJobRole(jobTarget);
    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        message: `Unknown job role: "${jobTarget}". Supported roles: ${Object.values(JOB_ROLES).map((r) => r.displayName).join(", ")}`,
      });
    }

    // Core deterministic analysis
    const analysisResult = analyzeResume(resume.extractedData, normalizedRole, resume.rawText);
    const roleConfig = JOB_ROLES[normalizedRole];

    // Optionally enrich with AI suggestions (async, non-blocking if disabled)
    let aiSuggestions = [];
    if (includeAI && process.env.OPENAI_API_KEY) {
      try {
        aiSuggestions = await generateAISuggestions(analysisResult, roleConfig.displayName);
      } catch (aiErr) {
        console.warn("AI suggestions skipped:", aiErr.message);
      }
    }

    // Save results to DB
    resume.jobTarget = {
      rawInput: jobTarget,
      normalizedRole,
      displayName: roleConfig.displayName,
    };
    resume.scores = {
      resumeScore: analysisResult.scores.resumeScore,
      jobScore: analysisResult.scores.jobScore,
      completenessScore: analysisResult.scores.completenessScore,
      experienceScore: analysisResult.scores.experienceScore,
    };
    resume.skillAnalysis = analysisResult.skillAnalysis;
    resume.feedback = {
      ...analysisResult.feedback,
      aiSuggestions,
    };
    resume.isAnalyzed = true;
    await resume.save();

    // Update user version count if this was a fresh inline analysis (no prior upload)
    if (!resumeId) {
      const resumeCount = await Resume.countDocuments({ userId: req.user._id });
      await User.findByIdAndUpdate(req.user._id, { resumeCount });
    }

    res.status(200).json({
      success: true,
      message: "Resume analyzed successfully",
      data: {
        resumeId: resume._id,
        jobTarget: resume.jobTarget,
        scores: {
          ...analysisResult.scores,
          interpretation: getScoreInterpretation(analysisResult.scores.jobScore),
        },
        skillAnalysis: {
          matchPercentage: analysisResult.skillAnalysis.matchPercentage,
          matchedSkills: analysisResult.skillAnalysis.matched,
          missingSkills: analysisResult.skillAnalysis.missing,
          bonusSkills: analysisResult.skillAnalysis.extra,
        },
        feedback: {
          strengths: analysisResult.feedback.strengths,
          weaknesses: analysisResult.feedback.weaknesses,
          rejectionReasons: analysisResult.feedback.rejectionReasons,
          suggestions: analysisResult.feedback.suggestions,
          aiSuggestions: aiSuggestions.length > 0 ? aiSuggestions : undefined,
        },
        requiredSkillsForRole: roleConfig.requiredSkills,
        extractedSummary: {
          skillsDetected: resume.extractedData?.skills?.length || 0,
          experienceEntries: resume.extractedData?.experience?.length || 0,
          projectsDetected: resume.extractedData?.projects?.length || 0,
          educationEntries: resume.extractedData?.education?.length || 0,
          textLength: resume.rawText?.length || 0,
        },
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Analyze error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Analysis failed." });
  }
};

// ─── POST /api/resume/improve ─────────────────────────────────────────────────
const improveResume = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: "AI service not configured. Set OPENAI_API_KEY." });
    }

    const { lines, jobTarget } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an array of resume lines to improve." });
    }

    const improvedLines = await improveResumeSentences(lines, jobTarget);

    res.json({
      success: true,
      message: "Resume lines improved",
      data: {
        jobTarget,
        original: lines,
        improved: improvedLines,
        count: improvedLines.length,
      },
    });
  } catch (error) {
    console.error("Improve error:", error.message);
    res.status(500).json({ success: false, message: "Failed to improve resume: " + error.message });
  }
};

// ─── POST /api/resume/compare ─────────────────────────────────────────────────
const compareResumes = async (req, res) => {
  try {
    const { resumeId1, resumeId2, jobTarget } = req.body;

    if (!resumeId1 || !resumeId2) {
      return res.status(400).json({ success: false, message: "Provide both resumeId1 and resumeId2." });
    }

    if (resumeId1 === resumeId2) {
      return res.status(400).json({ success: false, message: "Cannot compare a resume with itself." });
    }

    const [resume1, resume2] = await Promise.all([
      Resume.findOne({ _id: resumeId1, userId: req.user._id }),
      Resume.findOne({ _id: resumeId2, userId: req.user._id }),
    ]);

    if (!resume1) return res.status(404).json({ success: false, message: "Resume 1 not found." });
    if (!resume2) return res.status(404).json({ success: false, message: "Resume 2 not found." });

    const targetRole = jobTarget || resume1.jobTarget?.rawInput || resume2.jobTarget?.rawInput;
    const normalizedRole = normalizeJobRole(targetRole || "software engineer");

    // Analyze both deterministically
    const analysis1 = analyzeResume(resume1.extractedData, normalizedRole, resume1.rawText);
    const analysis2 = analyzeResume(resume2.extractedData, normalizedRole, resume2.rawText);

    const score1 = Math.round(
      (analysis1.scores.resumeScore || 0) * 0.4 +
      (analysis1.scores.jobScore || 0) * 0.6
    );
    const score2 = Math.round(
      (analysis2.scores.resumeScore || 0) * 0.4 +
      (analysis2.scores.jobScore || 0) * 0.6
    );
    const winner = score1 >= score2 ? "Resume 1" : "Resume 2";

    // Skill differences
    const skills1 = new Set(resume1.extractedData?.skills || []);
    const skills2 = new Set(resume2.extractedData?.skills || []);

    const uniqueToResume1 = [...skills1].filter((s) => !skills2.has(s));
    const uniqueToResume2 = [...skills2].filter((s) => !skills1.has(s));
    const sharedSkills = [...skills1].filter((s) => skills2.has(s));

    // Optional AI comparison insight
    let aiInsight = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        aiInsight = await generateComparisonInsight(
          { overallScore: score1, skills: [...skills1] },
          { overallScore: score2, skills: [...skills2] },
          targetRole || "the target role"
        );
      } catch (aiErr) {
        console.warn("AI comparison insight skipped:", aiErr.message);
      }
    }

    res.json({
      success: true,
      message: "Resumes compared successfully",
      data: {
        winner,
        jobTarget: targetRole,
        resume1: {
          id: resume1._id,
          label: resume1.label,
          overallScore: score1,
          jobScore: analysis1.scores.jobScore,
          matchPercentage: analysis1.skillAnalysis.matchPercentage,
          skillCount: skills1.size,
          uniqueSkills: uniqueToResume1,
          strengths: analysis1.feedback.strengths.slice(0, 3),
        },
        resume2: {
          id: resume2._id,
          label: resume2.label,
          overallScore: score2,
          jobScore: analysis2.scores.jobScore,
          matchPercentage: analysis2.skillAnalysis.matchPercentage,
          skillCount: skills2.size,
          uniqueSkills: uniqueToResume2,
          strengths: analysis2.feedback.strengths.slice(0, 3),
        },
        skillDifferences: {
          sharedSkills,
          uniqueToResume1,
          uniqueToResume2,
        },
        scoreDelta: Math.abs(score1 - score2),
        aiInsight,
      },
    });
  } catch (error) {
    console.error("Compare error:", error.message);
    res.status(500).json({ success: false, message: "Comparison failed: " + error.message });
  }
};

// ─── GET /api/resume/progress/:userId ────────────────────────────────────────
const getProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own progress (or admins)
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const resumes = await Resume.find({ userId, isAnalyzed: true })
      .sort({ createdAt: 1 })
      .select("label version scores skillAnalysis feedback.strengths feedback.weaknesses jobTarget createdAt");

    if (resumes.length === 0) {
      return res.json({
        success: true,
        message: "No analyzed resumes found. Upload and analyze a resume to start tracking progress.",
        data: { totalResumes: 0, progress: [] },
      });
    }

    // Build progress timeline
    const timeline = resumes.map((r, idx) => ({
      version: r.version || idx + 1,
      label: r.label,
      resumeId: r._id,
      jobTarget: r.jobTarget?.displayName || "N/A",
      scores: {
        overall: Math.round(
          (r.scores.resumeScore || 0) * 0.3 +
          (r.scores.jobScore || 0) * 0.4 +
          (r.scores.completenessScore || 0) * 0.2 +
          (r.scores.experienceScore || 0) * 0.1
        ),
        resumeScore: r.scores.resumeScore,
        jobScore: r.scores.jobScore,
        completenessScore: r.scores.completenessScore,
      },
      skillMatchPercentage: r.skillAnalysis?.matchPercentage || 0,
      analyzedAt: r.createdAt,
    }));

    // Compute improvements between versions
    const improvements = [];
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      const scoreDelta = curr.scores.overall - prev.scores.overall;
      const skillDelta = curr.skillMatchPercentage - prev.skillMatchPercentage;

      improvements.push({
        fromVersion: prev.version,
        toVersion: curr.version,
        overallScoreChange: scoreDelta,
        jobScoreChange: curr.scores.jobScore - prev.scores.jobScore,
        skillMatchChange: skillDelta,
        improved: scoreDelta > 0,
        message: scoreDelta > 0
          ? `Score improved by ${scoreDelta} points 🎉`
          : scoreDelta === 0
          ? "Score unchanged — keep refining"
          : `Score dropped by ${Math.abs(scoreDelta)} — review changes`,
      });
    }

    const latest = timeline[timeline.length - 1];
    const first = timeline[0];
    const totalImprovement = latest.scores.overall - first.scores.overall;

    // Missing skills from latest
    const latestResume = resumes[resumes.length - 1];
    const stillMissing = latestResume.skillAnalysis?.missing || [];

    res.json({
      success: true,
      data: {
        userId,
        totalResumes: resumes.length,
        summary: {
          firstScore: first.scores.overall,
          latestScore: latest.scores.overall,
          totalImprovement,
          improvementStatus:
            totalImprovement > 20 ? "Excellent progress! 🚀"
            : totalImprovement > 10 ? "Good improvement 📈"
            : totalImprovement > 0 ? "Slight improvement — keep going"
            : "No improvement yet — time to level up!",
          stillMissingSkills: stillMissing.slice(0, 6),
        },
        timeline,
        improvements,
      },
    });
  } catch (error) {
    console.error("Progress error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch progress." });
  }
};

// ─── GET /api/resume/:id ──────────────────────────────────────────────────────
const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }
    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch resume." });
  }
};

// ─── GET /api/resume (list all user resumes) ──────────────────────────────────
const listResumes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("label version fileName fileType jobTarget scores isAnalyzed storage createdAt"),
      Resume.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: {
        count: resumes.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        resumes,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to list resumes." });
  }
};

// ─── DELETE /api/resume/:id ───────────────────────────────────────────────────
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }
    await User.findByIdAndUpdate(req.user._id, { $inc: { resumeCount: -1 } });
    res.json({ success: true, message: "Resume deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete resume." });
  }
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
const listJobRoles = async (req, res) => {
  const roles = Object.entries(JOB_ROLES).map(([key, config]) => ({
    key,
    displayName: config.displayName,
    requiredSkills: config.requiredSkills,
    importantSkills: config.importantSkills,
  }));

  res.json({ success: true, data: { count: roles.length, roles } });
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getScoreInterpretation = (jobScore) => {
  if (jobScore >= 80) return "Excellent — Strong candidate for this role";
  if (jobScore >= 60) return "Good — Competitive with some gaps";
  if (jobScore >= 40) return "Fair — Significant skill gaps present";
  if (jobScore >= 20) return "Weak — Major improvements needed";
  return "Poor — Resume does not align with this role";
};

module.exports = {
  uploadResume,
  analyzeResumeHandler,
  improveResume,
  compareResumes,
  getProgress,
  getResume,
  listResumes,
  deleteResume,
  listJobRoles,
};
