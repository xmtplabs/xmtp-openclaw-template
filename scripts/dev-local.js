// Local dev: use sibling openclaw repo. Run from xmtp-openclaw-template.
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const openclawRoot = path.resolve(root, "..", "openclaw");

process.env.OPENCLAW_ENTRY = path.join(openclawRoot, "openclaw.mjs");
process.env.OPENCLAW_BUNDLED_PLUGINS_DIR = path.join(openclawRoot, "extensions");
process.env.SETUP_PASSWORD = process.env.SETUP_PASSWORD || "test";

const { spawn } = await import("node:child_process");
const proc = spawn(process.execPath, ["src/server.js"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
proc.on("exit", (code) => process.exit(code ?? 0));
