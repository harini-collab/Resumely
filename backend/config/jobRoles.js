/**
 * Job Role Skill Configuration
 * Defines required skills, weights, and scoring criteria for each role.
 * This drives the deterministic scoring logic (NO AI involvement).
 */

const JOB_ROLES = {
  "backend developer": {
    displayName: "Backend Developer",
    requiredSkills: ["node.js", "express", "database", "api", "rest", "sql", "mongodb", "postgresql"],
    importantSkills: ["docker", "aws", "redis", "microservices", "graphql", "testing", "ci/cd"],
    niceToHave: ["kubernetes", "kafka", "elasticsearch", "grpc"],
    keywords: ["server", "backend", "api development", "database design", "authentication"],
    minRequiredMatch: 3,
  },

  "frontend developer": {
    displayName: "Frontend Developer",
    requiredSkills: ["html", "css", "javascript", "react", "responsive design"],
    importantSkills: ["typescript", "vue", "angular", "webpack", "testing", "git", "figma"],
    niceToHave: ["next.js", "graphql", "performance optimization", "accessibility"],
    keywords: ["ui", "ux", "component", "browser", "web design", "dom"],
    minRequiredMatch: 3,
  },

  "full stack developer": {
    displayName: "Full Stack Developer",
    requiredSkills: ["javascript", "react", "node.js", "database", "api", "html", "css"],
    importantSkills: ["typescript", "mongodb", "sql", "docker", "git", "testing"],
    niceToHave: ["aws", "graphql", "redis", "ci/cd", "kubernetes"],
    keywords: ["full stack", "end-to-end", "frontend", "backend", "web application"],
    minRequiredMatch: 4,
  },

  "data scientist": {
    displayName: "Data Scientist",
    requiredSkills: ["python", "machine learning", "statistics", "pandas", "numpy", "sql"],
    importantSkills: ["tensorflow", "pytorch", "scikit-learn", "data visualization", "jupyter", "r"],
    niceToHave: ["spark", "hadoop", "tableau", "power bi", "deep learning", "nlp"],
    keywords: ["data analysis", "model training", "feature engineering", "regression", "classification"],
    minRequiredMatch: 3,
  },

  "devops engineer": {
    displayName: "DevOps Engineer",
    requiredSkills: ["docker", "kubernetes", "ci/cd", "linux", "aws", "terraform"],
    importantSkills: ["jenkins", "ansible", "monitoring", "bash scripting", "git", "nginx"],
    niceToHave: ["istio", "helm", "prometheus", "grafana", "elk stack"],
    keywords: ["deployment", "infrastructure", "automation", "pipeline", "cloud", "scalability"],
    minRequiredMatch: 3,
  },

  "mobile developer": {
    displayName: "Mobile Developer",
    requiredSkills: ["react native", "flutter", "ios", "android", "mobile ui"],
    importantSkills: ["swift", "kotlin", "firebase", "api integration", "state management", "app store"],
    niceToHave: ["dart", "objective-c", "java", "push notifications", "offline storage"],
    keywords: ["mobile app", "cross-platform", "native", "ios development", "android development"],
    minRequiredMatch: 2,
  },

  "ui/ux designer": {
    displayName: "UI/UX Designer",
    requiredSkills: ["figma", "user research", "wireframing", "prototyping", "design systems"],
    importantSkills: ["adobe xd", "sketch", "usability testing", "information architecture", "adobe illustrator"],
    niceToHave: ["motion design", "html", "css", "after effects", "user journey mapping"],
    keywords: ["design thinking", "user experience", "interface design", "accessibility", "visual design"],
    minRequiredMatch: 2,
  },

  "machine learning engineer": {
    displayName: "Machine Learning Engineer",
    requiredSkills: ["python", "tensorflow", "pytorch", "machine learning", "deep learning", "mlops"],
    importantSkills: ["scikit-learn", "docker", "kubernetes", "aws sagemaker", "model deployment", "data pipelines"],
    niceToHave: ["spark", "kubeflow", "mlflow", "transformers", "distributed training"],
    keywords: ["model training", "neural networks", "model serving", "feature store", "experiment tracking"],
    minRequiredMatch: 3,
  },

  "cybersecurity analyst": {
    displayName: "Cybersecurity Analyst",
    requiredSkills: ["network security", "penetration testing", "siem", "vulnerability assessment", "firewalls"],
    importantSkills: ["ethical hacking", "python", "linux", "incident response", "cryptography", "compliance"],
    niceToHave: ["ceh", "cissp", "oscp", "threat intelligence", "forensics"],
    keywords: ["security", "threat analysis", "risk assessment", "intrusion detection", "cyber threats"],
    minRequiredMatch: 2,
  },

  "cloud architect": {
    displayName: "Cloud Architect",
    requiredSkills: ["aws", "azure", "gcp", "cloud infrastructure", "terraform", "microservices"],
    importantSkills: ["kubernetes", "serverless", "iam", "vpc", "cost optimization", "multi-cloud"],
    niceToHave: ["cka", "aws solutions architect", "disaster recovery", "service mesh"],
    keywords: ["cloud design", "scalable architecture", "high availability", "cloud migration"],
    minRequiredMatch: 3,
  },

  "product manager": {
    displayName: "Product Manager",
    requiredSkills: ["product roadmap", "agile", "user stories", "stakeholder management", "analytics"],
    importantSkills: ["jira", "a/b testing", "market research", "sql", "figma", "okrs"],
    niceToHave: ["technical background", "sql", "data analysis", "go-to-market strategy"],
    keywords: ["product strategy", "backlog", "sprint planning", "kpis", "mvp", "customer discovery"],
    minRequiredMatch: 2,
  },

  "software engineer": {
    displayName: "Software Engineer",
    requiredSkills: ["data structures", "algorithms", "oop", "git", "problem solving"],
    importantSkills: ["system design", "testing", "debugging", "code review", "agile", "api design"],
    niceToHave: ["open source", "design patterns", "performance optimization", "documentation"],
    keywords: ["software development", "programming", "coding", "engineering", "development"],
    minRequiredMatch: 3,
  },
};

// Normalize any user input like "frontend dev" → "frontend developer"
const normalizeJobRole = (roleInput) => {
  if (!roleInput) return null;
  const lower = roleInput.toLowerCase().trim();

  if (JOB_ROLES[lower]) return lower;

  for (const key of Object.keys(JOB_ROLES)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }

  const keywordMap = {
    backend: "backend developer",
    frontend: "frontend developer",
    "full stack": "full stack developer",
    fullstack: "full stack developer",
    "data science": "data scientist",
    devops: "devops engineer",
    mobile: "mobile developer",
    "ui ux": "ui/ux designer",
    designer: "ui/ux designer",
    "machine learning": "machine learning engineer",
    ml: "machine learning engineer",
    security: "cybersecurity analyst",
    cloud: "cloud architect",
    product: "product manager",
    swe: "software engineer",
  };

  for (const [kw, role] of Object.entries(keywordMap)) {
    if (lower.includes(kw)) return role;
  }

  return null;
};

module.exports = { JOB_ROLES, normalizeJobRole };
