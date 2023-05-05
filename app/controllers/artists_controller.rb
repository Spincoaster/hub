class ArtistsController < ApplicationController
  include InitialLetterPagination
  include CsvRespondable

  before_action :require_admin, except: [:index, :show]

  before_action :set_initial_letter_pages

  def ebisu_artist_ids
    Record.where(bar: 'ebisu').distinct_column(:artist_id)
  end

  def index
    @artists = Artist.order(name: :asc)
    if @bar == 'ebisu'
      @artists = @artists.where(id: ebisu_artist_ids)
    elsif @bar == 'shinjuku'
      exclude_ids = Set.new(ebisu_artist_ids)
      exclude_ids -= Set.new(Track.where(artist_id: exclude_ids).distinct_column(:artist_id))
      exclude_ids -= Set.new(Record.where(bar: 'shinjuku').where(artist_id: exclude_ids).distinct_column(:artist_id))
      @artists = @artists.where.not(id: exclude_ids)
    end
    if params["has_prefix"].present?
      @artists = @artists.search_with_prefix(params["has_prefix"])
    end
    respond_to do |format|
      format.html {
        @artists = @artists.limit(300)
      }
      format.csv { response_as_csv(@artists, Artist) }
    end
  end

  def show
    @artist = Artist.find(params[:id])
    @records = Record.where(artist_id: @artist, bar: @bar)
    if @bar == 'shinjuku'
      @tracks = Track.where(artist_id: @artist)
      @albums = Album.where(artist_id: @artist)
    else
      @tracks = []
      @albums = []
    end
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
      respond_to do |format|
        format.js {
          render layout: false
        }
        format.html {
          redirect_back fallback_location: artists_path, notice: 'Destroyed'
        }
      end
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
