require 'net/http'
require 'csv'

class Track < ApplicationRecord
  include NameSearchable
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

  def self.crawl(file_id, api_key)
    url = "https://www.googleapis.com/drive/v3/files/#{file_id}?alt=media&key=#{api_key}&mimeType=text/plain"
    csv = Net::HTTP.get(URI.parse(url))
    count = 0
    total = 0
    index = 0
    CSV.parse(csv) do |row|
      index += 1
      next if index == 1
      number, title, album_name, artist_name, comment, genre, date, copyright = row
      next if [title, album_name, artist_name].any?(&:blank?)

      [number, title, album_name, artist_name, comment, genre, date, copyright].each do |v|
        v&.force_encoding("UTF-8")
      end

      artist = Artist.where(name: artist_name).first_or_create
      artist.furigana = artist_name.furigana
      artist.phonetic_name = artist_name.phonetic
      artist.save!

      album = Album.where(name: album_name, artist: artist).first_or_create
      album.furigana = album_name.furigana
      album.phonetic_name = album_name.phonetic
      album.save!

      track = Track.where(name: title, album: album, artist: artist).first_or_create do
        count += 1
      end

      track.furigana = name.furigana
      track.phonetic_name = name.phonetic
      track.number = number
      track.save!

      puts "#{title}|#{album_name}|#{artist_name} is saved"
      total += 1
    end
    {
      count: count,
      total: total
    }
  end
end
