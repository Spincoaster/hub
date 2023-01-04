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

  def self.google_drive_session(client_id, client_secret, refresh_token)
    credentials = Google::Auth::UserRefreshCredentials.new(
      client_id: client_id,
      client_secret: client_secret,
      scope: %w(https://www.googleapis.com/auth/drive https://spreadsheets.google.com/feeds/),
      redirect_uri: 'http://example.com/redirect'
    )
    credentials.refresh_token = refresh_token
    credentials.fetch_access_token!
    GoogleDrive::Session.from_credentials(credentials)
  end

  def self.crawl
    session = google_drive_session(
      ENV.fetch('GOOGLE_DRIVE_CLIENT_ID'),
      ENV.fetch('GOOGLE_DRIVE_CLIENT_SECRET'),
      ENV.fetch('GOOGLE_DRIVE_REFRESH_TOKEN')
    )
    sp = session.spreadsheet_by_key(ENV.fetch('GOOGLE_DRIVE_TRACKS_SPREADSHEET_ID'))

    ws2hashes(sp.worksheet_by_title("artists")).each do |hash|
      artist = Artist.find_or_create_by(id: hash["id"])
      artist.update(
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
      )
    end

    ws2hashes(sp.worksheet_by_title("albums")).each do |hash|
      album = Album.find_or_create_by(id: hash["id"])
      album.update(
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
        artist_id: hash["artist_id"]
      )
    end

    ws2hashes(sp.worksheet_by_title("tracks")).each do |hash|
      track = Track.find_or_create_by(id: hash["id"])
      track.update(
        number: hash["number"],
        name: hash["name"],
        phonetic_name: hash["phonetic_name"],
        furigana: hash["furigana"],
        artist_id: hash["artist_id"],
        album_id: hash["album_id"]
      )
    end
  end

  def self.ws2hashes(ws)
    return [] if ws.nil?
    keys = 1.step.take_while { |i|  ws[1, i] != ""}
             .map { |i| ws[1, i].underscore }
    2.step.take_while { |j|  ws[j, 1] != ""}.map do |j|
      (0...keys.count).each_with_object({}) do |i, memo|
        value = ws[j, i + 1]
        case keys[i]
        when /id$/
          value = value == "" ? nil : value.to_i
        end
        value = nil if value == ""
        memo.merge!(keys[i] => value)
      end
    end
  end
end
