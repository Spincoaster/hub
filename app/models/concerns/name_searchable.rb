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
    scope :has_prefix , ->(v) {
      query = nil
      letters = NameSearchable::prefix_letters(v)
      letters.chars do |c|
        if query.nil?
          query = where("name LIKE ?", "#{c}%")
                    .or(where("furigana LIKE ?", "#{c}%"))
        else
          query = query
                    .or(where("name LIKE ?", "#{c}%"))
                    .or(where("furigana LIKE ?", "#{c}%"))
        end
      end
      query
    }
  end

  def self.prefix_letters(n)
    LETTERS[n] || n
  end
end
