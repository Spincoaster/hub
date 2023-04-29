class AddBarToRecords < ActiveRecord::Migration[5.2]
  def change
    add_column :records, :bar, :integer
    add_index :records, :bar
  end
end
