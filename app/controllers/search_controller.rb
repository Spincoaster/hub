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
end
