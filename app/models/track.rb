class Track < ApplicationRecord
  include NameSearchable
  belongs_to :artist
  belongs_to :album

  scope :search, ->(q) {
    t = joins(:artist, :album)
    t.where("tracks.name LIKE ?", "%#{q}%")
      .or(t.where("tracks.furigana LIKE ?", "%#{q}%"))
      .or(t.where("artists.name LIKE ?", "%#{q}%"))
      .or(t.where("artists.furigana LIKE ?", "%#{q}%"))
      .or(t.where("albums.name LIKE ?", "%#{q}%"))
      .or(t.where("albums.furigana LIKE ?", "%#{q}%"))
  }
end
