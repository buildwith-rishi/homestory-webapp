// ========================================
// BROWSER CONSOLE TEST SCRIPT
// ========================================
// Copy and paste this into your browser console
// when you're on the dashboard page

console.clear();
console.log("🔍 DEBUGGING 401 UNAUTHORIZED ERROR\n");

// 1. Check if user is logged in
const user = localStorage.getItem("user");
const token = localStorage.getItem("auth_token");

console.log("1️⃣ USER CHECK:");
if (user) {
  const userData = JSON.parse(user);
  console.log("   ✅ User found:", userData);
  console.log("   📧 Email:", userData.email);
  console.log("   👤 Role:", userData.role);
  console.log(
    "   🔑 Is Admin?",
    userData.role === "ADMIN" || userData.role === "admin",
  );
} else {
  console.error("   ❌ No user found in localStorage");
}

console.log("\n2️⃣ TOKEN CHECK:");
if (token) {
  console.log("   ✅ Token exists");
  console.log("   📏 Length:", token.length);
  console.log("   🔍 First 50 chars:", token.substring(0, 50) + "...");

  // Try to decode JWT (if it's a valid JWT)
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("   📦 Token Payload:", payload);

      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const isExpired = Date.now() > payload.exp * 1000;
        console.log("   ⏰ Expires:", expDate.toLocaleString());
        console.log(
          "   ⚠️  Is Expired?",
          isExpired ? "❌ YES - THIS IS THE PROBLEM!" : "✅ No",
        );
      }
    }
  } catch (e) {
    console.log("   ⚠️  Could not decode token (might not be JWT)");
  }
} else {
  console.error("   ❌ No token found in localStorage");
}

console.log("\n3️⃣ API ENDPOINT TEST:");
console.log("   🌐 Testing: POST /api/admin/users");

// Test the actual API call
fetch("https://ghs.oneweekmvps.com/api/admin/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({
    name: "Console Test User",
    email: "consoletest@example.com",
    password: "test123456",
    role: "CUSTOMER",
  }),
})
  .then((response) => {
    console.log("\n4️⃣ API RESPONSE:");
    console.log("   📊 Status:", response.status, response.statusText);
    console.log("   🏷️  Status Code:", response.status);

    if (response.status === 401) {
      console.error(
        "   ❌ 401 UNAUTHORIZED - Backend is rejecting your token!",
      );
      console.log("\n   🔧 SOLUTIONS:");
      console.log("   1. Log out and log back in");
      console.log("   2. Check if your user role is ADMIN");
      console.log("   3. Contact backend team - token validation is failing");
    } else if (response.status === 403) {
      console.error("   ❌ 403 FORBIDDEN - You don't have admin permissions");
    } else if (response.status === 200 || response.status === 201) {
      console.log(
        "   ✅ SUCCESS! User created (but this was a test, you might want to delete it)",
      );
    }

    return response.json();
  })
  .then((data) => {
    console.log("   📦 Response Data:", data);

    if (data.message) {
      console.log("   💬 Message:", data.message);
    }
  })
  .catch((error) => {
    console.error("\n   ❌ NETWORK ERROR:", error);
    console.log("   💡 This might be a CORS issue or the backend is down");
  });

console.log("\n5️⃣ ENVIRONMENT CHECK:");
console.log("   🌐 Current URL:", window.location.href);
console.log("   🏠 API Base URL: https://ghs.oneweekmvps.com");

console.log("\n✅ Test complete! Check the results above.");
console.log("📋 If you see 401 error, it's a BACKEND issue.");
console.log("📞 Share this output with your backend team.\n");
