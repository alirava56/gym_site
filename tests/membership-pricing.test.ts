import assert from "node:assert/strict";
import test from "node:test";
import { getMembershipPackage, getMembershipPackageId, getMembershipPrices, type MembershipKind, type MembershipSessions } from "@/shared/membership-pricing";
import { resolveRegistrationPlan } from "@/server/domain/gym";

// Expected final prices are independently transcribed from the two supplied photos.
const expected: Record<MembershipKind, Record<MembershipSessions, number[]>> = {
  single: {
    30: [3000000, 5800000, 8500000, 11000000, 16000000, 26000000, 30000000],
    16: [2750000, 5300000, 7750000, 10000000, 14500000, 23500000, 27000000],
    12: [2500000, 4800000, 7000000, 9000000, 13000000, 21000000, 24000000],
  },
  family: {
    30: [2800000, 5500000, 8000000, 10000000, 15000000, 25000000, 28000000],
    16: [2550000, 5000000, 7200000, 9000000, 13500000, 22500000, 25000000],
    12: [2300000, 4500000, 6500000, 8000000, 12000000, 20000000, 22000000],
  },
};

test("all 42 package totals match the supplied membership tables", () => {
  for (const kind of ["single", "family"] as const) {
    for (const sessions of [30, 16, 12] as const) {
      assert.deepEqual(getMembershipPrices(kind, sessions).map((row) => row.finalPrice), expected[kind][sessions], `${kind}, ${sessions} sessions`);
    }
  }
});

test("the family three-month 16-session base price preserves the source table", () => {
  const row = getMembershipPrices("family", 16)[2];
  assert.equal(row.basePrice, 8200000);
  assert.equal(row.discount, 1000000);
  assert.equal(row.finalPrice, 7200000);
});

test("freeze allowances match all three session groups in both tables", () => {
  for (const kind of ["single", "family"] as const) {
    assert.deepEqual(getMembershipPrices(kind, 30).map((row) => row.freezeDays), [0, 7, 14, 21, 28, 35, 42]);
    assert.deepEqual(getMembershipPrices(kind, 16).map((row) => row.freezeDays), [0, 4, 8, 12, 16, 20, 24]);
    assert.deepEqual(getMembershipPrices(kind, 12).map((row) => row.freezeDays), [0, 3, 6, 9, 12, 15, 18]);
  }
});

test("every selectable package preserves kind, sessions, duration and price through registration", () => {
  const ids = new Set<string>();
  for (const kind of ["single", "family"] as const) {
    for (const sessions of [30, 16, 12] as const) {
      for (const row of getMembershipPrices(kind, sessions)) {
        const id = getMembershipPackageId(kind, sessions, row.months);
        ids.add(id);
        const selection = getMembershipPackage(id);
        assert.ok(selection);
        assert.equal(selection.kind, kind);
        assert.equal(selection.sessions, sessions);
        assert.equal(selection.months, row.months);
        assert.equal(selection.priceRaw, row.finalPrice);
        assert.equal(resolveRegistrationPlan(id)?.price, selection.price);
      }
    }
  }
  assert.equal(ids.size, 42);
  assert.equal(getMembershipPackage("family-16-3")?.priceRaw, 7200000);
  assert.equal(getMembershipPackage("single-16-3")?.priceRaw, 7750000);
});

test("registration rejects fabricated package IDs and keeps legacy memberships readable", () => {
  for (const value of [null, {}, 12, "", "family-16-5", "family-17-3", "single-30-0", "single-30-01", "single-30-1-extra", "family-12-12\n", "__proto__", "constructor"]) {
    assert.equal(resolveRegistrationPlan(value), null);
  }
  assert.equal(resolveRegistrationPlan("12session")?.priceRaw, 2500000);
  assert.equal(resolveRegistrationPlan("16session")?.priceRaw, 2750000);
  assert.equal(resolveRegistrationPlan("30session")?.priceRaw, 3000000);
});
