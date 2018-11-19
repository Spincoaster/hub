# coding: utf-8
# frozen_string_literal: true
require "slack"

task crawl_news: :environment do
  begin
    #  notify_slack "Start crawling news entries..."
    result = NewsEntry.crawl_latest
    if result[:count] > 0
      notify_slack "Crawled #{entries.count} entries"
    end
  rescue => error
    notify_slack error.message
  end
end
