class AlbumsController < ApplicationController
  include InitialLetterPagination

  before_action :require_admin

  def new
    @album = Album.new
  end

  def create
    @album = Album.new(album_params)
    if @album.save
      redirect_to albums_path, 'Created'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @album = Album.find(params[:id])
    @album.artist_query = @album.artist.name
  end

  def update
    @album = Album.find(params[:id])
    if @album.update(album_params)
      redirect_to albums_path, notice: 'Updated'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @album = Album.find(params[:id])
    if @album.destroy
      redirect_to albums_path, notice: 'Destroyed'
    else
      render :show, status: :unprocessable_entity
    end
  end


    private
      def album_params
        params.require(:album).permit(
          :name,
          :phonetic_name,
          :furigana,
          :artist_id,
        )
    end
end
