const { spawnSync } = require("child_process");
const path = require("path");

const [targetDir, ...npmArgs] = process.argv.slice(2);

if (!targetDir || npmArgs.length === 0) {
  console.error("Usage: node scripts/npm-in-dir.js <dir> <npm args...>");
  process.exit(1);
}

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error("npm_execpath is missing. Run this command through npm.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [npmCli, ...npmArgs], {
  cwd: path.resolve(__dirname, "..", targetDir),
  stdio: "inherit",
  shell: false,
});

process.exit(result.status || 0);
