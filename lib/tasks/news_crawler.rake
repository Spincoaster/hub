# coding: utf-8
# frozen_string_literal: true
require "slack"

task crawl_news: :environment do
#  notify_slack "Start crawling news entries..."
  result = NewsEntry.crawl_latest
  if result[:count] > 0
    notify_slack "Crawled #{entries.count} entries"
  end
end
