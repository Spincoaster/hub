class Record < ApplicationRecord
  include NameSearchable
  belongs_to :artist
  belongs_to :owner
end
