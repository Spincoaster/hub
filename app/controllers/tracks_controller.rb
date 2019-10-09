class TracksController < ApplicationController
  include InitialLetterPagination

  before_action :set_initial_letter_pages

  def index
    @tracks = Track.all
                .includes([:album, :artist])
                .order("artists.name asc")
    if params["has_prefix"].present?
      @tracks = @tracks.search_with_prefix(params["has_prefix"])
    end
    if params["artist_id"].present?
      @tracks = @tracks.where(artist_id: params["artist_id"]).order(artist_id: :asc)
    end
    if params["album_id"].present?
      @tracks = @tracks.where(album_id: params["album_id"]).order(number: :asc)
    else
      @tracks = @tracks.order("tracks.name asc")
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end
end
