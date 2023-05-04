# encoding: utf-8
require 'net/http'
require 'csv'

class Record < ApplicationRecord
  include NameSearchable
  belongs_to :artist, optional: true
  belongs_to :owner

  enum bar: { shinjuku: 0, ebisu: 1 }

  attr_accessor :artist_query

  scope :search, ->(query) {
    q = query.to_hiragana
    t = joins(:artist, :owner)
    t.where("records.name LIKE ?", "%#{q}%")
      .or(t.where("records.furigana LIKE ?", "%#{q}%"))
      .or(t.where("records.phonetic_name LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
      .or(t.where("owners.name LIKE ?", "%#{q}%"))
  }

  def self.crawl(bar, is_diff=true)

    sheet_title =
      case bar
      when 'shinjuku'
        if is_diff
          '新宿連携用'
        else
          'レコードリスト'
        end
      when 'ebisu'
        if is_diff
          '恵比寿連携用'
        else
          '恵比寿レコードリスト'
        end
      else
        return
      end

    ws = google_drive_wordsheet(
      ENV.fetch('GOOGLE_DRIVE_RECORDS_SPREADSHEET_ID'),
      sheet_title
    )

    count = 0
    total = 0

    ws2hashes(ws).each do |hash|
      owner_name = hash['所有者']
      location = hash['場所']
      number = hash['番号']
      title = hash['タイトル']
      artist_name = hash['アーティスト']
      comment = hash['コメント']

      next if title.nil?

      owner = Owner.where(name: owner_name).first_or_create

      artist = Artist.where(name: artist_name).first_or_create
      artist.furigana = artist_name.furigana
      artist.phonetic_name = artist_name.phonetic
      artist.save!

      record = Record.where(name: title, owner: owner, artist: artist, bar: bar).first_or_create do
        count += 1
      end

      record.furigana = title.furigana
      record.phonetic_name = title.phonetic
      record.location = location
      record.number = number
      record.comment = comment
      record.bar = bar
      record.save!

      puts "#{title}|#{artist_name}|#{owner_name} is saved"
      total += 1
    end

    { count: count, total: total }
  end
end
