require "slack"

task crawl_records: :environment do
  begin
    #  notify_slack "Start crawling records..."
    result = Record.crawl(bar: "ebisu")
    if result[:count] > 0
      notify_slack "Crawled #{result[:total]} records. Add #{result[:count]} new records"
    end

    result = Record.crawl(bar: "shinjuku")
    if result[:count] > 0
      notify_slack "Crawled #{result[:total]} records. Add #{result[:count]} new records"
    end
  rescue => error
    notify_slack error.message
  end
end
