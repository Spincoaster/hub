module CsvRespondable
  extend ActiveSupport::Concern

  BOM = "\uFEFF"

  def response_as_csv(records, model_class, options={})
    filename = "#{model_class.table_name}.csv"

    records.present?

    self.response.headers['Content-Type'] ||= "text/csv; charset=UTF-8"
    self.response.headers['Content-Disposition'] = "attachment;filename=#{ERB::Util.url_encode(filename)}"
    self.response.headers['Content-Transfer-Encoding'] = 'binary'

    self.response_body = Enumerator.new do |data|
      data << BOM

      data << model_class.to_csv_header(options)

      records.each do |record|
        data << record.to_csv_row(options)
      end
    end
  end
end
