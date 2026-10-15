import assert from "node:assert/strict";
import { test } from "node:test";
import { LABEL_DEFAULTS, resolveLabels } from "../src/lib/label-defaults";

test("pre-cassette database keeps new label keys and custom database values", () => {
  const rows = Object.entries(LABEL_DEFAULTS)
    .filter(([key]) => !/cassette/i.test(key))
    .map(([key, value]) => ({ key, value }));
  rows.push({ key: "NAV.allRecords", value: "Custom records label" });
  const labels = resolveLabels(rows);
  assert.equal(labels.get("SEARCH.cassettesLabel"), "[ Cassettes ]");
  assert.equal(labels.get("POPUP.cassetteSideA"), "A面1曲目 / Side A, Track 1: ");
  assert.equal(labels.get("NAV.allRecords"), "Custom records label");
  for (const key of Object.keys(LABEL_DEFAULTS)) assert.ok(labels.has(key), key);
});

test("database can override new labels, preserve empty strings, and add keys", () => {
  const labels = resolveLabels([
    { key: "SEARCH.cassettesLabel", value: "Custom cassette label" },
    { key: "POPUP.cassetteRequestEn", value: "" },
    { key: "SEARCH.extra", value: "Extra" },
  ]);
  assert.equal(labels.get("SEARCH.cassettesLabel"), "Custom cassette label");
  assert.equal(labels.get("POPUP.cassetteRequestEn"), "");
  assert.equal(labels.get("SEARCH.extra"), "Extra");
});

test("empty database produces all defaults", () => {
  assert.deepEqual(Object.fromEntries(resolveLabels([])), LABEL_DEFAULTS);
});
