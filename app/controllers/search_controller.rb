class SearchController < ApplicationController
  def index
    q = params["query"]
    @records = Record.search(q)
    @tracks = Track.search(q)
  end
end
