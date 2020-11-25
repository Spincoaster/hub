class SearchController < ApplicationController
  def index
    q = params["query"]
    @records = Record.includes([:owner, :artist]).search(q)
    @tracks = Track.search(q).includes([:album, :artist])
    respond_to do |format|
      format.html
      format.json {
        render json: {
                 records: @records.as_json(include: [:owner, :artist]),
                 tracks: @tracks.as_json(include: [:album, :artist])
               }
      }
    end
  end

  def artists
    q = params["query"]
    @artists = Artist.search(q).limit(20)
    respond_to do |format|
      format.html
      format.json {
        render json: @artists.as_json
      }
    end
  end

  def albums
    q = params["query"]
    @albums = Album.includes([:artist]).search(q).limit(20)
    respond_to do |format|
      format.html
      format.json {
        render json: @albums.as_json(include: [:artist])
      }
    end
  end
end
