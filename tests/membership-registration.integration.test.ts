import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";

test("PostgreSQL preserves the selected package across save, reload and replacement", {
  skip: process.env.GYM_MEMBERSHIP_DB_TEST !== "1",
}, async () => {
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd());
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname), "This test only runs against a local database");
  const { query, getPool } = await import("@/server/database/pool");
  const { createRegistrationRequest, getOwnerRegistration, cancelOwnerRegistration } = await import("@/server/database/registration-requests");
  const { getTehranNow } = await import("@/server/domain/gym");
  const ownerHash = randomBytes(32).toString("hex");
  let apiRequestId: string | undefined;
  const input = { fullName: "آزمون مسیر عضویت", phone: "09120000000", visitDate: getTehranNow().date, ownerHash };
  try {
    const family = await createRegistrationRequest({ ...input, planId: "family-16-3" });
    assert.equal(family.planId, "family-16-3");
    assert.equal(family.price, "۷٬۲۰۰٬۰۰۰");
    assert.match(family.planName, /فامیلی/);
    assert.match(family.planName, /۱۶ جلسه در ماه/);
    assert.equal(family.duration, "سه‌ماهه");
    assert.ok(family.referenceCode);
    assert.deepEqual(await getOwnerRegistration(ownerHash), family);

    const single = await createRegistrationRequest({ ...input, planId: "single-12-12" });
    assert.equal(single.price, "۲۴٬۰۰۰٬۰۰۰");
    assert.equal((await getOwnerRegistration(ownerHash))?.planId, "single-12-12");
    const history = await query<{ plan_id: string; status: string }>("SELECT plan_id,status FROM registration_requests WHERE owner_hash=$1 ORDER BY created_at", [ownerHash]);
    assert.deepEqual(history.rows, [{ plan_id: "family-16-3", status: "cancelled" }, { plan_id: "single-12-12", status: "new" }]);
    assert.equal(await cancelOwnerRegistration(ownerHash), true);
    assert.equal(await getOwnerRegistration(ownerHash), null);

    const { NextRequest } = await import("next/server");
    const { POST } = await import("@/app/api/subscription/route");
    const { GET } = await import("@/app/api/data/route");
    const response = await POST(new NextRequest("http://localhost:3001/api/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, planId: "family-30-6", price: "1", ownerHash: "ignored-client-owner" }),
    }));
    assert.equal(response.status, 201);
    const result = await response.json();
    apiRequestId = result.subscription.referenceCode;
    assert.equal(result.subscription.planId, "family-30-6");
    const { listAdminRegistrations } = await import("@/server/database/registration-requests");
    assert.ok((await listAdminRegistrations()).some((item) => item.referenceCode === apiRequestId && item.fullName === input.fullName), "Registration must appear in admin data");
    assert.equal(result.subscription.price, "۱۵٬۰۰۰٬۰۰۰");
    const ownerCookie = response.headers.get("set-cookie")?.split(";")[0];
    assert.ok(ownerCookie);
    const reload = await GET(new NextRequest("http://localhost:3001/api/data", { headers: { cookie: ownerCookie } }));
    assert.equal(reload.status, 200);
    assert.equal((await reload.json()).subscription.referenceCode, apiRequestId);
  } finally {
    // Clean up only this test's randomly owned records; never truncate shared tables.
    await query("DELETE FROM registration_requests WHERE owner_hash=$1", [ownerHash]);
    if (apiRequestId) await query("DELETE FROM registration_requests WHERE id::text=$1 AND full_name=$2", [apiRequestId, input.fullName]);
    await getPool().end();
  }
});
