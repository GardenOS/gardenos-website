"use strict";

/**
 * Next.js dev via Webpack only. Turbopack on Windows + Node 22+ can crash with:
 *   Cannot find module '.next/postcss.js'
 * Clears any TURBOPACK-related env (including Windows case variants) and strips turbo CLI flags.
 */

const { spawn } = require("child_process");
const path = require("path");

const env = { ...process.env };
for (const key of Object.keys(env)) {
  const u = key.toUpperCase();
  if (u === "TURBOPACK" || u === "IS_TURBOPACK_TEST") {
    delete env[key];
  }
}
// Never set TURBOPACK to "". next-intl's plugin uses `process.env.TURBOPACK != null` and would
// enable the Turbopack branch while Next is actually using Webpack → "Couldn't find next-intl config".

const nextCli = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
const turboFlags = new Set(["--turbopack", "--turbo", "-T"]);
const forwarded = process.argv.slice(2).filter((a) => !turboFlags.has(a));
const args = ["dev", ...forwarded];

const child = spawn(process.execPath, [nextCli, ...args], {
  stdio: "inherit",
  env,
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
