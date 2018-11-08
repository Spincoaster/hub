class TopController < ApplicationController
  before_action :set_news_entries
  def index
  end

  def set_news_entries
    @news_entries = []
  end
end
