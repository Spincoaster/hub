require "slack"

task crawl_tracks: :environment do
  begin
    #  notify_slack "Start crawling tracks..."
    result = Track.crawl
    if result[:count] > 0
      notify_slack "Crawled #{result[:total]} tracks. Add #{result[:count]} new tracks"
    end
  rescue => error
    notify_slack error.message
  end
end
