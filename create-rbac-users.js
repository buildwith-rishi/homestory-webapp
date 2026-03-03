#!/usr/bin/env node
/**
 * create-rbac-users.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provisions all CRM role users in the GHS backend.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword node create-rbac-users.js
 *
 * Or interactively:
 *   node create-rbac-users.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require("https");
const readline = require("readline");

const API_BASE = "https://ghs.oneweekmvps.com";

// ── Role user definitions ───────────────────────────────────────────────────
const USERS_TO_CREATE = [
  {
    name: "Super Admin",
    email: "superadmin@goodhomestory.com",
    password: "GHS@SuperAdmin2026",
    role: "SUPER_ADMIN",
    phone: "+91-9000000001",
  },
  {
    name: "GHS Admin",
    email: "admin@goodhomestory.com",
    password: "GHS@Admin2026",
    role: "ADMIN",
    phone: "+91-9000000002",
  },
  {
    name: "Design Head",
    email: "designhead@goodhomestory.com",
    password: "GHS@DesignHead2026",
    role: "DESIGN_HEAD",
    phone: "+91-9000000003",
  },
  {
    name: "Project Manager",
    email: "pm@goodhomestory.com",
    password: "GHS@PM2026",
    role: "PROJECT_MANAGER",
    phone: "+91-9000000004",
  },
  {
    name: "Senior Designer",
    email: "designer@goodhomestory.com",
    password: "GHS@Designer2026",
    role: "DESIGNER",
    phone: "+91-9000000005",
  },
  {
    name: "BDR Executive",
    email: "bdr@goodhomestory.com",
    password: "GHS@BDR2026",
    role: "BDR",
    phone: "+91-9000000006",
  },
  {
    name: "Accounts Manager",
    email: "accounts@goodhomestory.com",
    password: "GHS@Accounts2026",
    role: "ACCOUNTS",
    phone: "+91-9000000007",
  },
  {
    name: "Site Engineer",
    email: "engineer@goodhomestory.com",
    password: "GHS@Engineer2026",
    role: "SITE_ENGINEER",
    phone: "+91-9000000008",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "ghs.oneweekmvps.com",
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { "Content-Length": Buffer.byteLength(data) }),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(bold("\n🔐 GHS RBAC User Setup Script"));
  console.log("─".repeat(50));

  // 1. Get admin credentials
  const adminEmail =
    process.env.ADMIN_EMAIL || (await prompt("Admin email    : "));
  const adminPassword =
    process.env.ADMIN_PASSWORD || (await prompt("Admin password : "));

  // 2. Login to get token
  console.log(`\n${cyan("→")} Logging in as ${adminEmail}…`);
  const loginRes = await request("POST", "/api/auth/login", {
    email: adminEmail,
    password: adminPassword,
  });

  if (loginRes.status !== 200 || !loginRes.body) {
    console.error(
      red(
        `✗ Login failed (HTTP ${loginRes.status}): ${JSON.stringify(loginRes.body)}`,
      ),
    );
    process.exit(1);
  }

  const token = loginRes.body.accessToken || loginRes.body.token;
  if (!token) {
    console.error(red("✗ No token received from login response"));
    process.exit(1);
  }
  console.log(green("✓ Login successful"));

  // 3. Create users
  console.log(`\n${bold("Creating role users…")}\n`);
  const results = [];

  for (const user of USERS_TO_CREATE) {
    process.stdout.write(
      `  Creating ${user.role.padEnd(18)} (${user.email})… `,
    );
    try {
      const res = await request("POST", "/api/admin/users", user, token);
      if (res.status === 201 || res.status === 200) {
        console.log(green("✓ Created"));
        results.push({ ...user, status: "created" });
      } else if (
        res.status === 409 ||
        (res.body && res.body.message?.toLowerCase().includes("exist"))
      ) {
        console.log(`${cyan("→")} Already exists (skipped)`);
        results.push({ ...user, status: "exists" });
      } else {
        console.log(
          red(
            `✗ Failed (HTTP ${res.status}): ${JSON.stringify(res.body?.message || res.body)}`,
          ),
        );
        results.push({ ...user, status: "failed", error: res.body?.message });
      }
    } catch (err) {
      console.log(red(`✗ Error: ${err.message}`));
      results.push({ ...user, status: "error", error: err.message });
    }
  }

  // 4. Summary
  console.log(`\n${"─".repeat(50)}`);
  console.log(bold("SUMMARY"));
  console.log("─".repeat(50));
  const created = results.filter((r) => r.status === "created").length;
  const existed = results.filter((r) => r.status === "exists").length;
  const failed = results.filter(
    (r) => r.status === "failed" || r.status === "error",
  ).length;

  console.log(`  ${green("✓")} Created : ${created}`);
  console.log(`  ${cyan("→")} Existed : ${existed}`);
  console.log(`  ${failed > 0 ? red("✗") : " "} Failed  : ${failed}`);

  console.log(bold("\n📋 CREDENTIALS TABLE"));
  console.log("─".repeat(80));
  console.log(`${"Role".padEnd(20)} ${"Email".padEnd(38)} Password`);
  console.log("─".repeat(80));
  for (const u of results) {
    const statusIcon =
      u.status === "created"
        ? green("✓")
        : u.status === "exists"
          ? cyan("→")
          : red("✗");
    console.log(
      `${statusIcon} ${u.role.padEnd(18)} ${u.email.padEnd(38)} ${u.password}`,
    );
  }
  console.log("─".repeat(80));
  console.log(
    "\nSave the credentials above in RBAC_CREDENTIALS.md for your team.\n",
  );
}

main().catch((err) => {
  console.error(red(`\nFatal error: ${err.message}`));
  process.exit(1);
});
