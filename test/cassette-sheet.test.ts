import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCassetteSheet } from "../src/lib/cassette-sheet";
import { recordListItemKey } from "../src/lib/record-list-keys";

const header = ["場所", "番号", "所有者", "タイトル", "アーティスト", "A面１曲目", "B面１曲目", "コメント"];
const item = ["J", "1", "Owner", "Album", "Artist", "A song", "B song", "Comment"];

test("reads cassette-specific columns and tolerates missing optional values", () => {
  const result = parseCassetteSheet([header, item, ["K", "1", "", "Other", "Artist"], []]);
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].sideAFirstTrack, "A song");
  assert.equal(result.items[0].sideBFirstTrack, "B song");
  assert.equal(result.items[0].comment, "Comment");
  assert.equal(result.items[1].sideAFirstTrack, null);
  assert.deepEqual(result.skippedRows, []);
});

test("reports unfinished and invalid rows without treating blank rows as incomplete", () => {
  const result = parseCassetteSheet([header, item, ["C", "107", "Owner"], ["J", "", "Owner", "Album", "Artist"], [], ["J", "2a", "Owner", "Album", "Artist"], ["J", "2147483648", "Owner", "Album", "Artist"]]);
  assert.deepEqual(result.skippedRows, [3, 4, 6, 7]);
  assert.equal(result.items.length, 1);
});

test("rejects duplicate location/number even if titles differ", () => {
  assert.throws(() => parseCassetteSheet([header, item, ["J", "01", "Other", "Other album", "Artist"]]), /重複/);
});

test("rejects empty and unexpectedly structured sheets before deletion can occur", () => {
  assert.throws(() => parseCassetteSheet([]), /列構成/);
  assert.throws(() => parseCassetteSheet([header]), /0件/);
  assert.throws(() => parseCassetteSheet([["番号", "場所", ...header.slice(2)], item]), /列構成/);
});

test("titles may repeat at different physical locations and numbers", () => {
  assert.equal(parseCassetteSheet([header, item, ["J", "2", ...item.slice(2)]]).items.length, 2);
});

test("cassette likes do not collide with records or tracks with the same id", () => {
  assert.equal(new Set(["Record", "Hi-Res", "Cassette"].map((type) => recordListItemKey(1, type as "Record" | "Hi-Res" | "Cassette"))).size, 3);
});
