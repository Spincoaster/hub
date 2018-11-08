class Track < ApplicationRecord
  belongs_to :artist
  belongs_to :album
end
