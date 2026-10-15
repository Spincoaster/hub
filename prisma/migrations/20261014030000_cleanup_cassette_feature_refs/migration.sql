-- Remove old dangling cassette references while preserving other media with the same numeric IDs.
DELETE FROM "feature_items" AS item
WHERE item."item_type" = 'Cassette'
  AND NOT EXISTS (SELECT 1 FROM "cassettes" AS cassette WHERE cassette."id" = item."item_id");
