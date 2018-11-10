task crawl_records: :environment do
  puts "Start crawling records..."
  file_id = ENV.fetch("RECORDS_FILE_ID")
  api_key = ENV.fetch("GOOGLE_API_KEY")
  result = Record.crawl(file_id, api_key)
  puts "Crawled #{result[:total]} records. Add #{result[:count]} new records"
end
