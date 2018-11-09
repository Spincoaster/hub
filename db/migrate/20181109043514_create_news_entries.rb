class CreateNewsEntries < ActiveRecord::Migration[5.2]
  def change
    create_table :news_entries do |t|
      t.integer :news_id
      t.string :title
      t.string :url
      t.timestamp :published_at
      t.text :content
      t.string :thumbnail

      t.timestamps

      t.index :news_id, unique: true
      t.index :published_at
    end
  end
end
