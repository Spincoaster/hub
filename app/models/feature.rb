class Feature < ApplicationRecord
  has_many :feature_items
  has_many :records, through: :feature_items, source: :item, source_type: Record.name
  has_many :tracks, through: :feature_items, source: :item, source_type: Track.name

  validates :name, presence: true
end
