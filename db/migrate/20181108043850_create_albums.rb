class CreateAlbums < ActiveRecord::Migration[5.2]
  def change
    create_table :albums do |t|
      t.string :name
      t.string :phonetic_name
      t.string :furigana
      t.references :artist, foreign_key: true

      t.timestamps
    end
  end
end
