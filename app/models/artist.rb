class Artist < ApplicationRecord
  include NameSearchable
  has_many :records
  has_many :albums
  has_many :tracks

  scope :search, ->(q) {
    where("name LIKE ?", "%#{q}%")
      .or(where("furigana LIKE ?", "%#{q}%"))
  }
end
