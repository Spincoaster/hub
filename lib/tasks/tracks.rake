require "slack"

task crawl_tracks: :environment do
  begin
    result = Track.crawl
    notify_slack "Crawled #{result[:artist_count]} artists" if result[:artist_count] > 0
    notify_slack "Crawled #{result[:album_count]} albums" if result[:album_count] > 0
    notify_slack "Crawled #{result[:track_count]} tracks" if result[:track_count] > 0
  rescue => error
    notify_slack error.message
  end
end
