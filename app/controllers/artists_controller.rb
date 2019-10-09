class ArtistsController < ApplicationController
  include InitialLetterPagination

  before_action :set_initial_letter_pages

  def index
    @artists = Artist.all
    if params["has_prefix"].present?
      @artists = Artist.search_with_prefix(params["has_prefix"]).order(name: :asc)
    end
  end

  def show
    @artist = Artist.includes([:records, :albums, :tracks]).find(params[:id])
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end
end
