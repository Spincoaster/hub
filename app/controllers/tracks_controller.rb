class TracksController < ApplicationController
  include InitialLetterPagination
  before_action :require_admin, except: :index

  before_action :set_initial_letter_pages

  def index
    @tracks = Track.limit(500)
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
    end
  end

  def new
    @track = Track.new
  end

  def create
    @track = Track.new(track_params)
    if @track.save
      redirect_to artists_path, 'Created'
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
      redirect_to tracks_path, notice: 'Destroyed'
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
