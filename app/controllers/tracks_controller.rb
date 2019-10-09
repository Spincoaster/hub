class TracksController < ApplicationController
  include InitialLetterPagination

  before_action :set_initial_letter_pages

  def index
    @tracks = Track.all.includes([:album, :artist])
    if params["has_prefix"].present?
      @tracks = @tracks.search_with_prefix(params["has_prefix"]).order(phonetic_name: :asc)
    end
    if params["album_id"].present?
      @tracks = @tracks.where(album_id: params["album_id"]).order(phonetic_name: :asc)
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end
end
