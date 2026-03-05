#!/usr/bin/env node
/**
 * create-new-role-users.cjs
 * Creates SALES, HR, and LEAD_PROJECT_MANAGER users only.
 */

const https = require("https");

const API_HOST = "ghs.oneweekmvps.com";

const NEW_USERS = [
  {
    name: "Sales Executive",
    email: "sales@goodhomestory.com",
    password: "GHS@Sales2026",
    role: "SALES",
    phone: "+91-9000000009",
  },
  {
    name: "HR Manager",
    email: "hr@goodhomestory.com",
    password: "GHS@HR2026",
    role: "HR",
    phone: "+91-9000000010",
  },
  {
    name: "Lead Project Manager",
    email: "leadpm@goodhomestory.com",
    password: "GHS@LeadPM2026",
    role: "LEAD_PROJECT_MANAGER",
    phone: "+91-9000000011",
  },
];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: API_HOST,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { "Content-Length": Buffer.byteLength(data) }),
      },
      timeout: 15000,
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

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(red("✗ Set ADMIN_EMAIL and ADMIN_PASSWORD env vars."));
    process.exit(1);
  }

  console.log(
    bold("\n🔐 Creating new role users (SALES / HR / LEAD_PROJECT_MANAGER)"),
  );
  console.log("─".repeat(60));

  // Login
  console.log(`${cyan("→")} Logging in as ${adminEmail}…`);
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
    console.error(red("✗ No token in login response"));
    process.exit(1);
  }
  console.log(green("✓ Login successful\n"));

  // Create users
  for (const user of NEW_USERS) {
    process.stdout.write(`  ${user.role.padEnd(22)} (${user.email})… `);
    try {
      const res = await request("POST", "/api/admin/users", user, token);
      if (res.status === 201 || res.status === 200) {
        console.log(green("✓ Created"));
      } else if (
        res.status === 409 ||
        (res.body?.message || res.body?.error || "")
          .toLowerCase()
          .includes("exist")
      ) {
        console.log(`${cyan("→")} Already exists (skipped)`);
      } else {
        console.log(
          red(
            `✗ HTTP ${res.status}: ${JSON.stringify(res.body?.message || res.body?.error || res.body)}`,
          ),
        );
      }
    } catch (err) {
      console.log(red(`✗ ${err.message}`));
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(bold("📋 Credentials"));
  console.log("─".repeat(60));
  for (const u of NEW_USERS) {
    console.log(`  ${u.role.padEnd(22)}  ${u.email.padEnd(35)}  ${u.password}`);
  }
  console.log("─".repeat(60) + "\n");
}

main().catch((err) => {
  console.error(red(`\nFatal: ${err.message}`));
  process.exit(1);
});
