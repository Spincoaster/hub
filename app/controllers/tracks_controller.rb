class TracksController < ApplicationController
  include InitialLetterPagination
  include CsvRespondable

  before_action :require_admin, except: :index

  before_action :set_initial_letter_pages

  def index
    @tracks = Track.includes([:album, :artist])
                   .order("artists.name asc")
    if params["has_prefix"].present?
      @tracks = @tracks.search_with_prefix(params["has_prefix"])
    end
    if params["artist_id"].present?
      @tracks = @tracks.where(artist_id: params["artist_id"]).order(artist_id: :asc)
    end
    if params["album_id"].present?
      @tracks = @tracks.where(album_id: params["album_id"]).order(number: :asc)
    end
    respond_to do |format|
      format.html {
        @tracks = @tracks.limit(300)
      }
      format.csv { response_as_csv(@tracks, Track) }
    end
  end

  def new
    @track = Track.new
  end

  def create
    @track = Track.new(track_params)
    if @track.save
      redirect_to artists_path, notice: 'Created'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @track = Track.find(params[:id])
    @track.artist_query = @track.artist.name
    @track.album_query = @track.album.name
  end

  def update
    @track = Track.find(params[:id])
    if @track.update(track_params)
      redirect_to edit_track_path(@track), notice: 'Updated'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @track = Track.find(params[:id])
    if @track.destroy
      respond_to do |format|
        format.js {
          render layout: false
        }
        format.html {
          redirect_back fallback_location: tracks_path, notice: 'Destroyed'
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
    def track_params
      params.require(:track).permit(
        :name,
        :phonetic_name,
        :furigana,
        :artist_id,
        :album_id
      )
    end
end
