class AddIndexesForSearch < ActiveRecord::Migration[5.2]
  def change
    [:artists, :albums, :tracks, :records].each do |table_name|
      add_index(table_name, :name)
      add_index(table_name, :phonetic_name)
      add_index(table_name, :furigana)
    end
  end
end
