class TopController < ApplicationController
  before_action :set_news_entries
  def index
  end

  def set_news_entries
    @news_entries = NewsEntry.order(published_at: :desc).limit(5)
  end
end
