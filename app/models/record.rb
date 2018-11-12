require 'net/http'
require 'csv'

class Record < ApplicationRecord
  include NameSearchable
  belongs_to :artist
  belongs_to :owner

  scope :search, ->(query) {
    q = query.to_hiragana
    t = joins(:artist, :owner)
    t.where("records.name LIKE ?", "%#{q}%")
      .or(t.where("records.furigana LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
      .or(t.where("owners.name LIKE ?", "%#{q}%"))
  }

  def self.crawl(file_id, api_key)
    url = "https://www.googleapis.com/drive/v3/files/#{file_id}/export?key=#{api_key}&mimeType=text/csv"
    csv = Net::HTTP.get(URI.parse(url))
    count = 0
    total = 0
    index = 0
    CSV.parse(csv) do |row|
      index += 1
      next if index == 1
      location, number, owner_name, name, artist_name, comment = row
      next if [location, name, owner_name, artist_name].any?(&:blank?)

      [location, number, owner_name, name, artist_name, comment].each do |v|
        v&.force_encoding("UTF-8")
      end

      owner = Owner.where(name: owner_name).first_or_create

      artist = Artist.where(name: artist_name).first_or_create
      artist.furigana = artist_name.furigana
      artist.phonetic_name = artist_name.phonetic
      artist.save!

      record = Record.where(name: name, owner: owner, artist: artist).first_or_create do
        count += 1
      end

      record.furigana = name.furigana
      record.phonetic_name = name.phonetic
      record.location = location
      record.number = number
      record.comment = comment
      record.save!

      puts "#{name}|#{artist_name}|#{owner_name} is saved"
      total += 1
    end
    {
      count: count,
      total: total
    }
  end
end
