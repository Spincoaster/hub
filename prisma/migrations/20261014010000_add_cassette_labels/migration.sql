-- Keep labels editable through the existing admin label editor.
INSERT INTO "labels" ("key", "value", "created_at", "updated_at") VALUES
  ('NAV.popularCassettes', 'Popular Cassettes', NOW(), NOW()),
  ('SEARCH.noPopularCassettes', 'No liked cassettes yet.', NOW(), NOW()),
  ('NAV.allCassettes', 'All Cassette List', NOW(), NOW()),
  ('TOP_PAGE.viewAllCassettes', 'View All Cassette', NOW(), NOW()),
  ('POPUP.cassetteRequestEn', 'To request this cassette, please show this screen to our staff. Please let us know whether you would like Side A or Side B.', NOW(), NOW()),
  ('POPUP.cassetteRequestJa', 'このカセットをリクエストする場合は、この画面をスタッフにご提示ください。あわせて、A面・B面のどちらをご希望かお伝えください。', NOW(), NOW()),
  ('POPUP.cassetteSideA', 'A面1曲目 / Side A, Track 1: ', NOW(), NOW()),
  ('POPUP.cassetteSideB', 'B面1曲目 / Side B, Track 1: ', NOW(), NOW()),
  ('SEARCH.cassette', 'Cassette', NOW(), NOW()),
  ('SEARCH.cassettesLabel', '[ Cassettes ]', NOW(), NOW()),
  ('SEARCH.noCassettes', 'No cassettes found.', NOW(), NOW())
ON CONFLICT ("key") DO NOTHING;
