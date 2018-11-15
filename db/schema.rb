# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2018_11_15_091020) do

  create_table "admins", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_admins_on_name", unique: true
  end

  create_table "albums", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "phonetic_name"
    t.string "furigana"
    t.bigint "artist_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["artist_id"], name: "index_albums_on_artist_id"
    t.index ["furigana"], name: "index_albums_on_furigana"
    t.index ["name"], name: "index_albums_on_name"
    t.index ["phonetic_name"], name: "index_albums_on_phonetic_name"
  end

  create_table "artists", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "phonetic_name"
    t.string "furigana"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["furigana"], name: "index_artists_on_furigana"
    t.index ["name"], name: "index_artists_on_name"
    t.index ["phonetic_name"], name: "index_artists_on_phonetic_name"
  end

  create_table "feature_items", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.bigint "feature_id"
    t.integer "item_id"
    t.string "item_type"
    t.integer "number"
    t.string "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["feature_id"], name: "index_feature_items_on_feature_id"
  end

  create_table "features", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "number"
    t.string "name"
    t.string "description"
    t.string "external_link"
    t.string "external_thumbnail"
    t.string "category"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "news_entries", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.integer "news_id"
    t.string "title"
    t.string "url"
    t.timestamp "published_at"
    t.text "content"
    t.string "thumbnail"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["news_id"], name: "index_news_entries_on_news_id", unique: true
    t.index ["published_at"], name: "index_news_entries_on_published_at"
  end

  create_table "owners", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "records", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "phonetic_name"
    t.string "furigana"
    t.string "location"
    t.integer "number"
    t.string "comment"
    t.bigint "artist_id"
    t.bigint "owner_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["artist_id"], name: "index_records_on_artist_id"
    t.index ["furigana"], name: "index_records_on_furigana"
    t.index ["name"], name: "index_records_on_name"
    t.index ["owner_id"], name: "index_records_on_owner_id"
    t.index ["phonetic_name"], name: "index_records_on_phonetic_name"
  end

  create_table "tracks", options: "ENGINE=InnoDB DEFAULT CHARSET=utf8", force: :cascade do |t|
    t.string "name"
    t.string "phonetic_name"
    t.string "furigana"
    t.integer "number"
    t.bigint "artist_id"
    t.bigint "album_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["album_id"], name: "index_tracks_on_album_id"
    t.index ["artist_id"], name: "index_tracks_on_artist_id"
    t.index ["furigana"], name: "index_tracks_on_furigana"
    t.index ["name"], name: "index_tracks_on_name"
    t.index ["phonetic_name"], name: "index_tracks_on_phonetic_name"
  end

  add_foreign_key "albums", "artists"
  add_foreign_key "feature_items", "features"
  add_foreign_key "records", "artists"
  add_foreign_key "records", "owners"
  add_foreign_key "tracks", "albums"
  add_foreign_key "tracks", "artists"
end
