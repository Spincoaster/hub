class Owner < ApplicationRecord
  include NameSearchable
  has_many :records, dependent: :destroy
end
