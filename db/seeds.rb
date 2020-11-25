# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

Artist.find_or_create_by(
  name: "storkes",
  phonetic_name: "strokes",
  furigana: "すとろーくす",
)

Album.find_or_create_by(
  name: "Is this it",
  phonetic_name: "is this it",
  furigana: "いずでぃすいっと",
)

Track.find_or_create_by(
  name: "Last night",
  phonetic_name: "last night",
  furigana: "らすとないと",
)

Admin.find_or_create_by(name: 'admin') do |a|
  a.password = 'admin',
  a.password_confirmation = 'admin'
end
