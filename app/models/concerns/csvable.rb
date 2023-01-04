require 'csv'

module Csvable
  extend ActiveSupport::Concern

  included do
  end

  class_methods do
    def csv_columns
      columns.map(&:name).select { |column| %w(created_at updated_at).exclude? column }
    end

    def as_csv_header(options={})
      csv_columns
    end

    def to_csv_header(options)
      as_csv_header(options).to_csv
    end
  end

  def as_csv_row(options={})
    self.class.csv_columns.map do |column|
      if self[column].is_a? Time
        self[column].i18n_l(format: :csv)
      else
        self[column]
      end
    end
  end

  def to_csv_row(options)
    as_csv_row(options).to_csv
  end
end
