class CreateFeatureItems < ActiveRecord::Migration[5.2]
  def change
    create_table :feature_items do |t|
      t.references :feature, foreign_key: true
      t.integer :item_id
      t.string :item_type
      t.integer :number
      t.string :comment

      t.timestamps
    end
  end
end
