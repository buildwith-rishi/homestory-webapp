async function test() {
  const login = await fetch("https://ghs.oneweekmvps.com/api/auth/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email: "admin@example.com", password: "admin123"})
  });
  const token = (await login.json()).accessToken;
  const c = await fetch("https://ghs.oneweekmvps.com/api/credentials", {
    headers: {"Authorization": "Bearer " + token}
  });
  const json = await c.json();
  console.log("Cred elements:", json?.data?.[0] || json?.[0] || json);
}
test();
