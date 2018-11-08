class Track < ApplicationRecord
  include NameSearchable
  belongs_to :artist
  belongs_to :album
end
