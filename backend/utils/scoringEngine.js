/**
 * Scoring Engine
 * All scoring is deterministic — NO AI involved.
 * Computes resume quality and job match scores from parsed data.
 */

const { JOB_ROLES } = require("../config/jobRoles");

const SKILL_ALIASES = {
  "nodejs": "node.js",
  "expressjs": "express",
  "reactjs": "react",
  "vuejs": "vue",
  "restful": "rest",
  "postgres": "postgresql",
  "k8s": "kubernetes",
  "ml": "machine learning",
};

const normalizeSkill = (skill) => {
  const cleaned = (skill || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9+.#]/g, "");

  return SKILL_ALIASES[cleaned] || cleaned;
};

const skillsMatch = (candidateSkill, roleSkill) => {
  const c = normalizeSkill(candidateSkill);
  const r = normalizeSkill(roleSkill);
  if (!c || !r) return false;

  if (c === r) return true;

  // Allow partial matching only for longer technical phrases.
  if (c.length >= 4 && r.length >= 4) {
    return c.includes(r) || r.includes(c);
  }

  return false;
};

// ─── Resume Quality Score (0-100) ─────────────────────────────────────────────
const scoreResume = (extractedData) => {
  let score = 0;
  const breakdown = {};

  // 1. Contact Info (15 pts)
  let contactScore = 0;
  if (extractedData.name) contactScore += 5;
  if (extractedData.email) contactScore += 5;
  if (extractedData.phone) contactScore += 3;
  if (extractedData.links?.linkedin) contactScore += 2;
  score += contactScore;
  breakdown.contact = contactScore;

  // 2. Skills Section (25 pts)
  const skillCount = extractedData.skills?.length || 0;
  const skillScore = Math.min(25, Math.round((skillCount / 15) * 25));
  score += skillScore;
  breakdown.skills = skillScore;

  // 3. Education (15 pts)
  const hasEdu = extractedData.education?.length > 0;
  const eduScore = hasEdu ? 15 : 0;
  score += eduScore;
  breakdown.education = eduScore;

  // 4. Experience (25 pts)
  const expCount = extractedData.experience?.length || 0;
  let expScore = 0;
  if (expCount >= 3) expScore = 25;
  else if (expCount === 2) expScore = 18;
  else if (expCount === 1) expScore = 10;
  score += expScore;
  breakdown.experience = expScore;

  // 5. Projects (15 pts)
  const projCount = extractedData.projects?.length || 0;
  let projScore = 0;
  if (projCount >= 3) projScore = 15;
  else if (projCount === 2) projScore = 10;
  else if (projCount === 1) projScore = 6;
  score += projScore;
  breakdown.projects = projScore;

  // 6. GitHub / Portfolio bonus (5 pts)
  let linkScore = 0;
  if (extractedData.links?.github) linkScore += 3;
  if (extractedData.links?.portfolio) linkScore += 2;
  score += linkScore;
  breakdown.links = linkScore;

  return { resumeScore: Math.min(100, Math.round(score)), breakdown };
};

// ─── Completeness Score (0-100) ───────────────────────────────────────────────
const scoreCompleteness = (extractedData) => {
  const checks = {
    hasName: !!extractedData.name,
    hasEmail: !!extractedData.email,
    hasPhone: !!extractedData.phone,
    hasSkills: (extractedData.skills?.length || 0) > 3,
    hasEducation: (extractedData.education?.length || 0) > 0,
    hasExperience: (extractedData.experience?.length || 0) > 0,
    hasProjects: (extractedData.projects?.length || 0) > 0,
    hasGithub: !!extractedData.links?.github,
    hasLinkedIn: !!extractedData.links?.linkedin,
    hasSummary: !!extractedData.summary,
  };

  const passed = Object.values(checks).filter(Boolean).length;
  return {
    completenessScore: Math.round((passed / Object.keys(checks).length) * 100),
    checks,
  };
};

// ─── Job Match Score (0-100) ──────────────────────────────────────────────────
const normalizeTextToken = (value) =>
  (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const skillInRawText = (rawText, skill) => {
  if (!rawText) return false;
  const raw = normalizeTextToken(rawText);
  const normalizedSkill = normalizeTextToken(skill);
  if (!normalizedSkill) return false;
  return raw.includes(normalizedSkill);
};

const scoreJobMatch = (extractedData, normalizedRole, rawText = "") => {
  const roleConfig = JOB_ROLES[normalizedRole];
  if (!roleConfig) {
    return {
      jobScore: 0,
      matchedSkills: [],
      missingSkills: [],
      extraSkills: [],
      matchPercentage: 0,
      error: "Unknown job role",
    };
  }

  const candidateSkills = (extractedData.skills || []).map((s) => normalizeSkill(s));

  // Check required skills
  const requiredMatched = roleConfig.requiredSkills.filter((s) => {
    return candidateSkills.some((cs) => skillsMatch(cs, s)) || skillInRawText(rawText, s);
  });
  const requiredMissing = roleConfig.requiredSkills.filter((s) =>
    !(candidateSkills.some((cs) => skillsMatch(cs, s)) || skillInRawText(rawText, s))
  );

  // Check important skills
  const importantMatched = roleConfig.importantSkills.filter((s) => {
    return candidateSkills.some((cs) => skillsMatch(cs, s)) || skillInRawText(rawText, s);
  });

  // Check nice-to-have
  const niceMatched = roleConfig.niceToHave.filter((s) => {
    return candidateSkills.some((cs) => skillsMatch(cs, s)) || skillInRawText(rawText, s);
  });

  // Scoring formula:
  // Required skills: 60% weight
  // Important skills: 30% weight
  // Nice-to-have: 10% weight
  const requiredScore = (requiredMatched.length / roleConfig.requiredSkills.length) * 60;
  const importantScore = (importantMatched.length / roleConfig.importantSkills.length) * 30;
  const niceScore = roleConfig.niceToHave.length > 0
    ? (niceMatched.length / roleConfig.niceToHave.length) * 10
    : 10;

  const jobScore = Math.round(requiredScore + importantScore + niceScore);

  // All matched skills combined
  const allMatched = [...new Set([...requiredMatched, ...importantMatched, ...niceMatched])];

  // Missing: required first, then important
  const allMissing = [
    ...requiredMissing,
    ...roleConfig.importantSkills.filter((s) =>
      !(candidateSkills.some((cs) => skillsMatch(cs, s)) || skillInRawText(rawText, s))
    ),
  ].slice(0, 12);

  // Extra skills candidate has that aren't in role definition
  const allRoleSkills = [
    ...roleConfig.requiredSkills,
    ...roleConfig.importantSkills,
    ...roleConfig.niceToHave,
  ];
  const extraSkills = candidateSkills.filter((cs) =>
    !allRoleSkills.some((rs) => skillsMatch(cs, rs))
  ).slice(0, 8);

  const totalRequired = roleConfig.requiredSkills.length;
  const matchPercentage = Math.round((requiredMatched.length / totalRequired) * 100);

  return {
    jobScore: Math.min(100, jobScore),
    matchedSkills: allMatched,
    missingSkills: allMissing,
    extraSkills,
    matchPercentage,
    requiredMatched: requiredMatched.length,
    requiredTotal: totalRequired,
  };
};

// ─── Experience Score (0-100) ─────────────────────────────────────────────────
const scoreExperience = (extractedData) => {
  const expCount = extractedData.experience?.length || 0;
  const projCount = extractedData.projects?.length || 0;

  let expScore = 0;
  if (expCount >= 4) expScore = 60;
  else if (expCount === 3) expScore = 50;
  else if (expCount === 2) expScore = 35;
  else if (expCount === 1) expScore = 20;

  let projScore = 0;
  if (projCount >= 4) projScore = 40;
  else if (projCount === 3) projScore = 30;
  else if (projCount === 2) projScore = 20;
  else if (projCount === 1) projScore = 10;

  return { experienceScore: Math.min(100, expScore + projScore) };
};

// ─── Strengths & Weaknesses Generator ────────────────────────────────────────
const generateStrengthsWeaknesses = (extractedData, jobMatchResult, roleConfig) => {
  const strengths = [];
  const weaknesses = [];
  const rejectionReasons = [];
  const suggestions = [];

  // Strengths
  if (extractedData.skills?.length >= 8) strengths.push("Strong technical skill set with diverse technologies");
  if (extractedData.links?.github) strengths.push("GitHub profile present — shows practical coding activity");
  if (extractedData.links?.linkedin) strengths.push("LinkedIn profile linked — good professional visibility");
  if (extractedData.experience?.length >= 2) strengths.push("Multiple work experiences demonstrate real-world exposure");
  if (extractedData.projects?.length >= 3) strengths.push("Strong project portfolio shows hands-on initiative");
  if (extractedData.education?.length > 0) strengths.push("Educational background is documented");
  if (jobMatchResult.matchedSkills?.length >= 5) strengths.push(`Matches ${jobMatchResult.matchedSkills.length} key skills for this role`);
  if (jobMatchResult.jobScore >= 70) strengths.push("High job match score — competitive candidate profile");

  // Weaknesses
  if (!extractedData.links?.github) weaknesses.push("No GitHub profile — hiring managers cannot verify coding skills");
  if (!extractedData.phone) weaknesses.push("Phone number missing — reduces recruiter accessibility");
  if (extractedData.skills?.length < 5) weaknesses.push("Too few skills listed — may be filtered out by ATS systems");
  if (extractedData.experience?.length === 0) weaknesses.push("No work experience section detected");
  if (extractedData.projects?.length === 0) weaknesses.push("No projects listed — hard to demonstrate practical skills");
  if (!extractedData.name) weaknesses.push("Candidate name not clearly identified at top of resume");
  if (jobMatchResult.missingSkills?.length > 5) weaknesses.push(`Missing ${jobMatchResult.missingSkills.length} required/important skills`);
  if (jobMatchResult.jobScore < 40) weaknesses.push("Low match score for target job role");

  // Rejection Reasons (based on job score)
  if (jobMatchResult.jobScore < 30) {
    rejectionReasons.push("Resume does not meet minimum skill requirements for the role");
    rejectionReasons.push("ATS keyword scan would likely filter this resume out");
  }
  if (jobMatchResult.requiredMatched < jobMatchResult.requiredTotal * 0.5) {
    rejectionReasons.push(`Only ${jobMatchResult.requiredMatched}/${jobMatchResult.requiredTotal} required skills are present`);
  }
  if (!extractedData.links?.github && roleConfig) {
    rejectionReasons.push("No GitHub/portfolio link — technical roles often require proof of work");
  }
  if (extractedData.experience?.length === 0 && extractedData.projects?.length < 2) {
    rejectionReasons.push("Insufficient evidence of practical experience or project work");
  }
  if (jobMatchResult.missingSkills?.slice(0, 3).length > 0) {
    rejectionReasons.push(`Critical missing skills: ${jobMatchResult.missingSkills.slice(0, 3).join(", ")}`);
  }

  // Suggestions (deterministic)
  if (jobMatchResult.missingSkills?.length > 0) {
    suggestions.push(`Learn these priority skills: ${jobMatchResult.missingSkills.slice(0, 4).join(", ")}`);
  }
  if (!extractedData.links?.github) {
    suggestions.push("Create and link a GitHub account with at least 3–5 meaningful repositories");
  }
  if (extractedData.projects?.length < 2) {
    suggestions.push("Add 2–3 personal or academic projects relevant to your target job");
  }
  if (!extractedData.links?.linkedin) {
    suggestions.push("Add a LinkedIn profile URL to increase recruiter trust");
  }
  if (extractedData.skills?.length < 8) {
    suggestions.push("Expand skills section with more tools, frameworks, and technologies you know");
  }
  if (extractedData.experience?.length === 0) {
    suggestions.push("Add internships, freelance work, or open-source contributions as experience");
  }

  return { strengths, weaknesses, rejectionReasons, suggestions };
};

// ─── Full Analysis ────────────────────────────────────────────────────────────
const analyzeResume = (extractedData, normalizedRole, rawText = "") => {
  const { resumeScore, breakdown } = scoreResume(extractedData);
  const { completenessScore, checks } = scoreCompleteness(extractedData);
  const jobMatchResult = scoreJobMatch(extractedData, normalizedRole, rawText);
  const { experienceScore } = scoreExperience(extractedData);
  const roleConfig = JOB_ROLES[normalizedRole];

  const { strengths, weaknesses, rejectionReasons, suggestions } =
    generateStrengthsWeaknesses(extractedData, jobMatchResult, roleConfig);

  const overallScore = Math.round(
    resumeScore * 0.3 +
    jobMatchResult.jobScore * 0.4 +
    completenessScore * 0.2 +
    experienceScore * 0.1
  );

  return {
    scores: {
      resumeScore,
      jobScore: jobMatchResult.jobScore,
      completenessScore,
      experienceScore,
      overallScore,
    },
    scoreBreakdown: breakdown,
    completenessChecks: checks,
    skillAnalysis: {
      matched: jobMatchResult.matchedSkills,
      missing: jobMatchResult.missingSkills,
      extra: jobMatchResult.extraSkills,
      matchPercentage: jobMatchResult.matchPercentage,
    },
    feedback: {
      strengths,
      weaknesses,
      rejectionReasons,
      suggestions,
    },
  };
};

module.exports = { analyzeResume, scoreResume, scoreJobMatch, scoreCompleteness, scoreExperience };
