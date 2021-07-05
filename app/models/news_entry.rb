require 'net/http'

class NewsEntry < ApplicationRecord

  def self.fetch_thumbnail(media_id)
    url = "#{ENV.fetch('NEWS_URL')}/wp-json/wp/v2/media/#{media_id}"
    json = Net::HTTP.get(URI.parse(url))
    result = JSON.parse(json)
    result.dig("media_details", "sizes", "medium", "source_url")
  end

  def self.crawl_latest
    url = "#{ENV.fetch('NEWS_URL')}/wp-json/wp/v2/news"
    json = Net::HTTP.get(URI.parse(url))
    results = JSON.parse(json)
    count = 0
    results.each do |h|
      entry = NewsEntry.where(news_id: h["id"]).first_or_create do
        count += 1
      end
      entry.title = h.dig("title", "rendered")
      entry.url = h["link"]
      entry.published_at = Time.zone.parse(h["date"])
      entry.content = h.dig("content", "rendered")
      entry.thumbnail = fetch_thumbnail(h["featured_media"])
      entry.save!
    end
    {
      count: count
    }
  end
end
