const fetch = require("node-fetch");
async function test() {
  const login = await fetch("https://ghs.oneweekmvps.com/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: "admin@example.com", password: "admin123"})
  });
  const {token} = await login.json();
  const users = await fetch("https://ghs.oneweekmvps.com/api/admin/users?limit=100", {
    headers: {"Authorization": "Bearer " + token}
  });
  const data = await users.json();
  console.log("admin/users returning keys: ", data.users ? Object.keys(data.users[0]) : "no users array", "roleTitle fields:", data.users?.find(u => u.name === "arjeet"));
}
test();
