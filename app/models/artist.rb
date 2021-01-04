class Artist < ApplicationRecord
  include NameSearchable
  has_many :records
  has_many :albums, dependent: :destroy
  has_many :tracks, dependent: :destroy

  scope :search, ->(q) {
    where("name LIKE ?", "%#{q}%")
      .or(where("furigana LIKE ?", "%#{q}%"))
  }
end
