# coding: utf-8
module NameSearchable
  extend ActiveSupport::Concern

  LETTERS = {
    "あ" => "あいうえお",
    "か" => "かきくけこ",
    "さ" => "さしすせそ",
    "た" => "たちつてと",
    "な" => "なにぬねの",
    "は" => "はひふへほ",
    "ま" => "まみむめも",
    "や" => "やゆよ",
    "ら" => "らりるれろ",
    "わ" => "わをん",
    "＃" => "01234567890!$",
  }

  included do
    scope :search_with_prefix , ->(v) {
      query = nil
      j = model == Artist ? all : joins(:artist)
      letters = NameSearchable::prefix_letters(v)
      letters.chars do |c|
        if query.nil?
          query = j.where("artists.name LIKE ?", "#{c}%")
                    .or(j.where("artists.furigana LIKE ?", "#{c}%"))
        else
          query = query
                    .or(j.where("artists.name LIKE ?", "#{c}%"))
                    .or(j.where("artists.furigana LIKE ?", "#{c}%"))
        end
      end
      query
    }
  end

  def self.prefix_letters(n)
    LETTERS[n] || n
  end
end
