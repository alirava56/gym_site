import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server";

const url = process.env.DATABASE_URL;
test("admin sessions persist, expire, revoke on logout and rotate with credentials", {
  skip: !url || !new URL(url).pathname.endsWith("_test"),
}, async () => {
  const { query, getPool } = await import("@/server/database/pool");
  const { loginAdmin, readAdminSession, revokeAdminSession, changeAdminCredentials, hashAdminPassword } = await import("@/server/security/admin");
  const { attachAdminCookie, getAdminSession, isSameOrigin } = await import("@/server/security/auth");
  const { POST: updateCredentials } = await import("@/app/api/admin/credentials/route");
  const { POST: logout } = await import("@/app/api/admin/logout/route");
  const apiRequest = (token: string, body: unknown = {}, origin = "https://gym.test") => new NextRequest("https://gym.test/api/admin/credentials", {
    method: "POST", headers: { host: "gym.test", origin, cookie: `sg_admin=${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  process.env.ADMIN_USERNAME = "test-admin";
  process.env.ADMIN_PASSWORD_HASH = await hashAdminPassword("initial-test-password");
  await query("TRUNCATE admin_account CASCADE");
  try {
    const first = await loginAdmin("test-admin", "initial-test-password");
    assert.ok(first);
    assert.equal((await updateCredentials(apiRequest(first.token, {}, "https://evil.test"))).status, 403);
    assert.equal((await updateCredentials(apiRequest("invalid"))).status, 401);
    assert.equal((await updateCredentials(apiRequest(first.token, { newPassword: "updated-test-password", confirmPassword: "different" }))).status, 400);
    const response = NextResponse.json({});
    attachAdminCookie(response, first.token);
    assert.match(response.headers.get("set-cookie")!, /Max-Age=2592000/i);
    assert.match(response.headers.get("set-cookie")!, /HttpOnly/i);
    const request = new NextRequest("https://gym.test/api/admin/data", { headers: { cookie: `sg_admin=${first.token}`, host: "gym.test", origin: "https://gym.test" } });
    assert.equal((await getAdminSession(request))?.username, "test-admin");
    assert.equal(isSameOrigin(request), true);
    assert.equal(isSameOrigin(new NextRequest("https://gym.test", { headers: { host: "gym.test", origin: "https://evil.test" } })), false);
    assert.equal(await readAdminSession(first.token.slice(1)), null);
    assert.equal(await loginAdmin("wrong-user", "initial-test-password"), null);
    const second = await loginAdmin("test-admin", "initial-test-password");
    assert.ok(second);
    assert.deepEqual(await changeAdminCredentials(first.token, "wrong-password", "new-admin", "updated-test-password"), { error: "WRONG_PASSWORD" });
    assert.ok(await readAdminSession(second.token));
    assert.deepEqual(await changeAdminCredentials(first.token, "initial-test-password", "new-admin", "short"), { error: "INVALID_INPUT" });
    const changed = await changeAdminCredentials(first.token, "initial-test-password", "new-admin", "updated-test-password");
    assert.ok("token" in changed && changed.token);
    assert.equal(await readAdminSession(first.token), null);
    assert.equal(await readAdminSession(second.token), null);
    assert.equal((await readAdminSession(changed.token))?.username, "new-admin");
    assert.equal(await loginAdmin("test-admin", "initial-test-password"), null);
    const replacement = await loginAdmin("new-admin", "updated-test-password");
    assert.ok(replacement, "environment bootstrap must not overwrite updated credentials");
    assert.equal((await logout(apiRequest(replacement.token))).status, 200);
    assert.equal(await readAdminSession(replacement.token), null);
    const renamedResponse = await updateCredentials(apiRequest(changed.token, { currentPassword: "updated-test-password", username: "renamed-admin", newPassword: "", confirmPassword: "" }));
    assert.equal(renamedResponse.status, 200);
    const renamed = { token: renamedResponse.cookies.get("sg_admin")!.value };
    assert.ok(renamed.token);
    assert.equal(await readAdminSession(changed.token), null);
    assert.ok(await loginAdmin("renamed-admin", "updated-test-password"));
    await query("UPDATE admin_sessions SET expires_at=NOW()-INTERVAL '1 second'");
    assert.equal(await readAdminSession(renamed.token), null);
    assert.deepEqual(await changeAdminCredentials(renamed.token, "updated-test-password", "other-admin", ""), { error: "UNAUTHORIZED" });
    const { rows } = await query<{ token_hash: string }>("SELECT token_hash FROM admin_sessions");
    assert.ok(rows.every((row) => ![first.token, second.token, renamed.token].includes(row.token_hash)));
    await revokeAdminSession(renamed.token);
  } finally {
    await query("TRUNCATE admin_account CASCADE");
    await getPool().end();
  }
});
