require 'net/http'
require 'csv'
require 'google_drive'

class Track < ApplicationRecord
  include NameSearchable
  include Csvable
  belongs_to :artist
  belongs_to :album

  attr_accessor :artist_query
  attr_accessor :album_query

  scope :search, ->(q) {
    t = joins(:artist, :album)
    t.where("tracks.name LIKE ?", "%#{q}%")
      .or(t.where("tracks.furigana LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
      .or(t.where("albums.name LIKE ?", "%#{q}%"))
      .or(t.where("albums.furigana LIKE ?", "%#{q}%"))
  }

  def self.crawl
    tracks_ws = google_drive_wordsheet(
      ENV.fetch('GOOGLE_DRIVE_TRACKS_SPREADSHEET_ID'),
      "artists"
    )

    artist_count = 0
    ws2hashes(tracks_ws).each do |hash|
      artist = Artist.find_or_create_by(id: hash["id"])
      artist.update(
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
      )
      artist_count += 1 if artist.changed?
    end

    album_count = 0

    albums_ws = google_drive_wordsheet(
      ENV.fetch('GOOGLE_DRIVE_TRACKS_SPREADSHEET_ID'),
      "albums"
    )
    ws2hashes(albums_ws).each do |hash|
      album = Album.find_or_create_by(id: hash["id"])
      album.update(
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
        artist_id: hash["artist_id"]
      )
      album_count += 1 if album.changed?
    end

    track_count = 0
    tracks_ws = google_drive_wordsheet(
      ENV.fetch('GOOGLE_DRIVE_TRACKS_SPREADSHEET_ID'),
      "tracks"
    )
    ws2hashes(tracks_ws).each do |hash|
      track = Track.find_or_create_by(id: hash["id"])
      track.update(
        number: hash["number"],
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
        artist_id: hash["artist_id"],
        album_id: hash["album_id"]
      )
      track_count += 1 if track.changed?
    end

    return {
      artist_count: artist_count,
      album_count: album_count,
      track_count: track_count
    }
  end
end
