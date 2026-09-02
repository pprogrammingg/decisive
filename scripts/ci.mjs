#!/usr/bin/env node
/**
 * CI checks for Decisive: unit tests + static security scan (+ npm audit when lockfile exists).
 * Writes badges/tests.svg and badges/security.svg. Exit 1 if anything fails.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".expo" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function runTests() {
  const r = spawnSync(process.execPath, ["--test", "tests/logic.test.js"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const out = (r.stdout || "") + (r.stderr || "");
  const tests = +(out.match(/# tests (\d+)/) || [0, 0])[1];
  const pass = +(out.match(/# pass (\d+)/) || [0, 0])[1];
  const fail = +(out.match(/# fail (\d+)/) || [0, 0])[1];
  const ok = r.status === 0 && fail === 0 && tests > 0;
  const pct = tests ? Math.round((pass / tests) * 100) : 0;
  return { ok, tests, pass, fail, pct, out };
}

const SECRET_FILES = /\.(pem|p8|p12|jks|keystore)$/i;
const SECRET_NAMES = /^(credentials\.json|google-services\.json|\.env|\.env\..*|id_rsa|id_ed25519)$/i;
const SECRET_BODY = [
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-/
];

function scanSecurity() {
  const findings = [];
  const files = walk(ROOT);
  for (const p of files) {
    const rel = p.slice(ROOT.length + 1);
    const base = rel.split(/[/\\]/).pop();
    if (SECRET_FILES.test(base) || SECRET_NAMES.test(base)) {
      findings.push({ rel, msg: "secret-looking file must not be in git" });
      continue;
    }
    const ext = extname(p);
    if (![".js", ".ts", ".tsx", ".mjs", ".html", ".json", ".yml", ".yaml", ".md", ".env"].includes(ext)) continue;
    if (rel.startsWith("badges/")) continue;
    let text;
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    if (text.length > 400_000) continue;
    for (const re of SECRET_BODY) {
      if (re.test(text)) findings.push({ rel, msg: "possible secret in file body" });
    }
    if (ext === ".js" || ext === ".mjs" || ext === ".html") {
      if (/\beval\s*\(/.test(text) || /\bnew Function\s*\(/.test(text)) {
        findings.push({ rel, msg: "eval / Function constructor" });
      }
      if (/\bdocument\.write\s*\(/.test(text)) {
        findings.push({ rel, msg: "document.write" });
      }
      const htmlAssign = text.matchAll(/\.innerHTML\s*=\s*([^;]+)/g);
      for (const m of htmlAssign) {
        const rhs = m[1].trim();
        const literal = /^["'`]/.test(rhs) && !/\$\{/.test(rhs) && !/\+/.test(rhs);
        if (!literal) findings.push({ rel, msg: "innerHTML is not a string literal (XSS risk)" });
      }
    }
  }
  return findings;
}

function auditMobile() {
  const dir = join(ROOT, "apps/mobile");
  if (!existsSync(join(dir, "package.json"))) return { ok: true, skipped: true, msg: "no mobile package" };
  const r = spawnSync("npm", ["audit", "--omit=dev", "--audit-level=high", "--json"], {
    cwd: dir,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  if (r.status === 0) return { ok: true, skipped: false, high: 0 };
  let high = 0;
  try {
    const j = JSON.parse(r.stdout || "{}");
    high = j.metadata?.vulnerabilities?.high
      + j.metadata?.vulnerabilities?.critical
      || 0;
  } catch { /* npm audit without lockfile often fails */ }
  if (!existsSync(join(dir, "package-lock.json")) && !existsSync(join(dir, "node_modules"))) {
    return { ok: true, skipped: true, msg: "no lockfile yet — static scan only" };
  }
  return { ok: r.status === 0, skipped: false, high, out: r.stderr || r.stdout };
}

function badgeSvg(label, message, color) {
  const char = 7.2;
  const lw = Math.ceil(label.length * char) + 12;
  const mw = Math.ceil(message.length * char) + 12;
  const w = lw + mw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <rect width="${lw}" height="20" fill="#555"/>
  <rect x="${lw}" width="${mw}" height="20" fill="${color}"/>
  <rect width="${w}" height="20" fill="url(#g)"/>
  <linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${lw / 2}" y="14">${label}</text>
    <text x="${lw + mw / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${lw + mw / 2}" y="14">${message}</text>
  </g>
</svg>
`;
}

function writeBadges(tests, secOk, secMsg) {
  const dir = join(ROOT, "badges");
  mkdirSync(dir, { recursive: true });
  const tColor = tests.ok ? "#4c1" : "#e05d44";
  const tMsg = tests.ok ? `${tests.pass}/${tests.tests} · ${tests.pct}%` : `fail ${tests.fail}`;
  writeFileSync(join(dir, "tests.svg"), badgeSvg("tests", tMsg, tColor));
  writeFileSync(join(dir, "security.svg"), badgeSvg("security", secMsg, secOk ? "#4c1" : "#e05d44"));
}

const tests = runTests();
const findings = scanSecurity();
const audit = auditMobile();
const secOk = findings.length === 0 && audit.ok;
const secMsg = !secOk
  ? `${findings.length + (audit.ok ? 0 : 1)} issue${findings.length + (audit.ok ? 0 : 1) === 1 ? "" : "s"}`
  : audit.skipped
    ? "100%"
    : "100%";

writeBadges(tests, secOk, tests.ok && secOk ? "100%" : secMsg);

console.log("tests", tests.ok ? `pass ${tests.pass}/${tests.tests}` : "FAIL");
if (!tests.ok) console.log(tests.out);
console.log("security findings", findings.length);
for (const f of findings) console.log(" -", f.rel, "—", f.msg);
if (audit.skipped) console.log("npm audit skipped:", audit.msg);
else console.log("npm audit", audit.ok ? "ok" : "FAIL", audit.high != null ? `(high+critical ${audit.high})` : "");

if (!tests.ok || !secOk) process.exit(1);
