class FeatureItem < ApplicationRecord
  belongs_to :feature
  belongs_to :item, polymorphic: true

  def track?
    item_type == Track.name
  end

  def record?
    item_type == Record.name
  end
end
