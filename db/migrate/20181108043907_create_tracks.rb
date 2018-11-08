class CreateTracks < ActiveRecord::Migration[5.2]
  def change
    create_table :tracks do |t|
      t.string :name
      t.string :phonetic_name
      t.string :furigana
      t.integer :number
      t.references :artist, foreign_key: true
      t.references :album, foreign_key: true

      t.timestamps
    end
  end
end
