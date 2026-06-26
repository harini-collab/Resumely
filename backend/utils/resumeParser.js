/**
 * Resume Parser
 * Extracts structured information from raw resume text using regex and NLP-lite techniques.
 * No AI involved — purely deterministic parsing.
 */

// ─── Skill Keyword Registry ───────────────────────────────────────────────────
const SKILLS_REGISTRY = [
  // Programming Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "c", "go", "golang",
  "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
  "bash", "shell scripting", "powershell", "dart", "elixir", "haskell", "lua",

  // Frontend
  "html", "css", "react", "react.js", "vue", "vue.js", "angular", "svelte",
  "next.js", "nuxt.js", "gatsby", "webpack", "vite", "tailwind", "tailwindcss",
  "bootstrap", "sass", "scss", "redux", "zustand", "mobx", "jquery",

  // Backend
  "node.js", "node", "express", "express.js", "nestjs", "fastapi", "django",
  "flask", "spring boot", "spring", "laravel", "rails", "asp.net", "fastify",
  "hapi", "koa", "strapi",

  // Databases
  "mongodb", "mongoose", "postgresql", "postgres", "mysql", "sqlite", "redis",
  "firebase", "supabase", "cassandra", "dynamodb", "neo4j", "elasticsearch",
  "database", "sql", "nosql", "orm", "sequelize", "prisma", "typeorm",

  // Cloud & DevOps
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ansible", "jenkins", "gitlab ci", "github actions", "ci/cd",
  "nginx", "apache", "linux", "ubuntu", "serverless", "lambda",

  // APIs & Protocols
  "rest", "restful", "graphql", "grpc", "websocket", "api", "soap", "microservices",
  "api design", "openapi", "swagger", "postman",

  // ML & AI
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn", "nlp",
  "computer vision", "neural networks", "hugging face", "transformers",
  "mlops", "jupyter", "data science", "statistics",

  // Mobile
  "react native", "flutter", "ios", "android", "swift ui", "jetpack compose",
  "xcode", "android studio", "expo",

  // Tools & Practices
  "git", "github", "gitlab", "bitbucket", "jira", "confluence", "agile",
  "scrum", "kanban", "tdd", "bdd", "testing", "jest", "mocha", "cypress",
  "selenium", "unit testing", "integration testing", "code review", "debugging",

  // Design
  "figma", "adobe xd", "sketch", "photoshop", "illustrator", "canva",
  "user research", "wireframing", "prototyping", "design systems",
  "responsive design", "ui/ux", "accessibility",

  // Security
  "cybersecurity", "penetration testing", "network security", "cryptography",
  "oauth", "jwt", "authentication", "authorization", "ssl", "tls",

  // Data & Analytics
  "data analysis", "data visualization", "tableau", "power bi", "excel",
  "looker", "google analytics", "spark", "hadoop", "kafka", "airflow",

  // Soft skills (tracked separately)
  "leadership", "communication", "teamwork", "problem solving", "time management",
  "project management", "mentoring", "public speaking",
];

// ─── Extractor Functions ──────────────────────────────────────────────────────

const extractName = (text) => {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  // Name is usually the first non-empty line that looks like a real name
  // Match 2-4 word names (handles middle names like "Surya Harini Tripurari")
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+(?: [A-Z][a-z]+){1,3}$/.test(line)) {
      return line;
    }
  }
  return null;
};

const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
};

const extractPhone = (text) => {
  const match = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return match ? match[0] : null;
};

const extractLinks = (text) => {
  const links = {
    github: null,
    linkedin: null,
    portfolio: null,
    other: [],
  };

  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9_\-]+/i);
  if (githubMatch) links.github = `https://${githubMatch[0]}`;

  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9_\-]+/i);
  if (linkedinMatch) links.linkedin = `https://${linkedinMatch[0]}`;

  const portfolioMatch = text.match(/https?:\/\/(?!github|linkedin)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)*/i);
  if (portfolioMatch) links.portfolio = portfolioMatch[0];

  return links;
};

const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  const found = new Set();

  for (const skill of SKILLS_REGISTRY) {
    // Word boundary matching
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
    if (regex.test(lowerText)) {
      found.add(skill.toLowerCase());
    }
  }

  return Array.from(found);
};

const extractSection = (text, sectionNames) => {
  const lines = text.split("\n");
  let inSection = false;
  const sectionContent = [];
  const sectionRegex = new RegExp(`^(${sectionNames.join("|")})\\s*:?\\s*$`, "i");
  const inlineSectionRegex = new RegExp(`^(${sectionNames.join("|")})\\s*:?\\s+(.+)`, "i");
  const nextSectionRegex = /^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|CERTIFICATIONS|SUMMARY|OBJECTIVE|WORK|PUBLICATIONS|AWARDS|LANGUAGES|REFERENCES|CONTACT)\s*:?\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (sectionRegex.test(line)) {
      inSection = true;
      continue;
    }
    // Handle inline section headers: "EDUCATION  IIT Patna"
    const inlineMatch = inlineSectionRegex.exec(line);
    if (inlineMatch && sectionNames.some(n => n.toLowerCase() === inlineMatch[1].toLowerCase())) {
      inSection = true;
      sectionContent.push(inlineMatch[2]);
      continue;
    }
    if (inSection && nextSectionRegex.test(line) && !sectionRegex.test(line)) {
      break;
    }
    if (inSection && line) {
      sectionContent.push(line);
    }
  }

  return sectionContent.join("\n");
};

const extractEducation = (text) => {
  const educationSection = extractSection(text, ["education", "academic background", "qualifications"]);
  const edu = [];

  const degreeKeywords = ["bachelor", "b.tech", "b.e.", "b.sc", "master", "m.tech", "m.sc", "mba",
    "phd", "diploma", "associate", "bca", "mca", "be", "me", "bcs", "mcs"];

  const lines = educationSection.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (degreeKeywords.some((d) => line.includes(d))) {
      const yearMatch = lines[i].match(/\b(19|20)\d{2}\b/);
      edu.push({
        degree: lines[i].split(/at|from|,|-/)[0]?.trim() || lines[i],
        institution: lines[i + 1]?.trim() || "",
        year: yearMatch ? yearMatch[0] : "",
      });
    }
  }

  // Fallback: look for any line with university/college keywords
  if (edu.length === 0) {
    const uniKeywords = ["university", "college", "institute", "school", "iit", "nit", "iim"];
    text.split("\n").forEach((line) => {
      if (uniKeywords.some((k) => line.toLowerCase().includes(k))) {
        const yearMatch = line.match(/\b(19|20)\d{2}\b/);
        edu.push({ degree: "", institution: line.trim(), year: yearMatch ? yearMatch[0] : "" });
      }
    });
  }

  return edu.slice(0, 5);
};

const extractProjects = (text) => {
  const projectSection = extractSection(text, ["projects", "personal projects", "academic projects", "side projects"]);
  const projects = [];

  if (!projectSection) return projects;

  // Split by bullets or numbered list or double newlines
  const chunks = projectSection.split(/\n(?=[•\-*\d]|\n)/);
  for (const chunk of chunks.slice(0, 6)) {
    const lines = chunk.split("\n").filter(Boolean);
    if (lines.length === 0) continue;

    const name = lines[0].replace(/^[•\-*\d.]+\s*/, "").trim();
    const description = lines.slice(1).join(" ").trim();
    const techMatches = extractSkills(chunk);

    if (name.length > 2) {
      projects.push({ name, description, technologies: techMatches });
    }
  }

  return projects;
};

const extractExperience = (text) => {
  const expSection = extractSection(text, ["experience", "work experience", "professional experience", "employment"]);
  const experiences = [];

  if (!expSection) return experiences;

  const lines = expSection.split("\n").filter(Boolean);
  let current = null;

  for (const line of lines) {
    // Detect role lines: lines with company names or date ranges
    const isRoleLine = /\b(at|@|–|-)\b/i.test(line) || /\b(20\d{2}|present|current)\b/i.test(line);

    if (isRoleLine && line.length < 120) {
      if (current) experiences.push(current);
      const parts = line.split(/\bat\b|@|–|-/i);
      current = {
        role: parts[0]?.trim() || line,
        company: parts[1]?.trim() || "",
        duration: line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2}).*?(Present|20\d{2})?/i)?.[0] || "",
        description: "",
      };
    } else if (current) {
      current.description += " " + line;
    }
  }

  if (current) experiences.push(current);
  return experiences.slice(0, 6);
};

// ─── Main Parser ──────────────────────────────────────────────────────────────

const parseResume = (rawText) => {
  const cleanText = rawText.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();

  return {
    name: extractName(cleanText),
    email: extractEmail(cleanText),
    phone: extractPhone(cleanText),
    skills: extractSkills(cleanText),
    education: extractEducation(cleanText),
    experience: extractExperience(cleanText),
    projects: extractProjects(cleanText),
    links: extractLinks(cleanText),
    summary: null, // Will be populated if summary section exists
  };
};

module.exports = { parseResume, SKILLS_REGISTRY };
