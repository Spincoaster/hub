class Artist < ApplicationRecord
  include NameSearchable
  has_many :records
  has_many :albums
  has_many :tracks
end
