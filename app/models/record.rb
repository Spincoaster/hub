class Record < ApplicationRecord
  include NameSearchable
  belongs_to :artist
  belongs_to :owner

  scope :search, ->(q) {
    t = joins(:artist, :owner)
    t.where("records.name LIKE ?", "%#{q}%")
      .or(t.where("records.furigana LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
      .or(t.where("owners.name LIKE ?", "%#{q}%"))
  }
end
