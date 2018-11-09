class CreateFeatures < ActiveRecord::Migration[5.2]
  def change
    create_table :features do |t|
      t.integer :number
      t.string :name
      t.string :description
      t.string :external_link
      t.string :external_thumbnail
      t.string :category

      t.timestamps
    end
  end
end
