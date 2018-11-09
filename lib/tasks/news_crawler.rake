# coding: utf-8
# frozen_string_literal: true

task crawl_news: :environment do
  puts "Start crawling"
  entries = NewsEntry.crawl_latest
  puts "Crawled #{entries.count} entries"
end
