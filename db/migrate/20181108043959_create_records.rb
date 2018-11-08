class CreateRecords < ActiveRecord::Migration[5.2]
  def change
    create_table :records do |t|
      t.string :name
      t.string :phonetic_name
      t.string :furigana
      t.string :location
      t.integer :number
      t.string :comment
      t.references :artist, foreign_key: true
      t.references :owner, foreign_key: true

      t.timestamps
    end
  end
end
