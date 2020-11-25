class Album < ApplicationRecord
  belongs_to :artist

  scope :search, ->(q) {
    t = joins(:artist)
    t.where("albums.name LIKE ?", "%#{q}%")
      .or(t.where("albums.furigana LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
  }
end
