class ArtistsController < ApplicationController
  include InitialLetterPagination

  before_action :require_admin, except: [:index, :show]

  before_action :set_initial_letter_pages

  def index
    @artists = Artist.limit(300)
    if params["has_prefix"].present?
      @artists = Artist.search_with_prefix(params["has_prefix"]).order(name: :asc)
    end
  end

  def show
    @artist = Artist.includes([:records, :albums, :tracks]).find(params[:id])
  end

  def new
    @artist = Artist.new
  end

  def create
    @artist = Artist.new(artist_params)
    if @artist.save
      redirect_to artists_path, notice: 'Created'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @artist = Artist.find(params[:id])
  end

  def update
    @artist = Artist.find(params[:id])
    if @artist.update(artist_params)
      redirect_to artists_path, notice: 'Updated'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @artist = Artist.find(params[:id])
    if @artist.destroy
      redirect_to artists_path, notice: 'Destroyed'
    else
      render :show, status: :unprocessable_entity
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end

    private
      def artist_params
        params.require(:artist).permit(
          :name,
          :phonetic_name,
          :furigana,
        )
    end
end
