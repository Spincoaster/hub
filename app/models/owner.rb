class Owner < ApplicationRecord
  include NameSearchable
  has_many :records, dependent: :destroy

  scope :search_with_prefix , ->(v) {
    query = nil
    letters = NameSearchable::prefix_letters(v)
    letters.chars do |c|
      if query.nil?
        query = where("name LIKE ?", "#{c}%")
      else
        query = query.or(where("name LIKE ?", "#{c}%"))
      end
    end
    query
  }
end
