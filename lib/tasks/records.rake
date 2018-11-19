require "slack"

task crawl_records: :environment do
  begin
    #  notify_slack "Start crawling records..."
    file_id = ENV.fetch("RECORDS_FILE_ID")
    api_key = ENV.fetch("GOOGLE_API_KEY")
    result = Record.crawl(file_id, api_key)
    if result[:count] > 0
      notify_slack "Crawled #{result[:total]} records. Add #{result[:count]} new records"
    end
  rescue => error
    notify_slack error.message
  end
end
