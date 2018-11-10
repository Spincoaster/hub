task crawl_tracks: :environment do
  puts "Start crawling tracks..."
  file_id = ENV.fetch("TRACKS_FILE_ID")
  api_key = ENV.fetch("GOOGLE_API_KEY")
  result = Track.crawl(file_id, api_key)
  puts "Crawled #{result[:total]} tracks. Add #{result[:count]} new tracks"
end
