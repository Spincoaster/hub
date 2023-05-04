class RecordsController < ApplicationController
  include InitialLetterPagination

  before_action :require_admin, except: [:index]
  before_action :set_initial_letter_pages

  def index
    @records = Record.limit(500)
                 .includes([:owner, :artist])
                 .joins(:artist)
                 .order("artists.name asc")
    @records = @records.where(bar: @bar) if @bar.present?
    if params["has_prefix"].present?
      @records = @records.search_with_prefix(params["has_prefix"])
    end
    if params["owner_id"].present?
      @records = @records.where(owner_id: params["owner_id"])
    end
  end

  def new
    @record = Record.new
    @owners = Owner.all
  end

  def create
    @record = Record.new(record_params)
    if @record.save
      redirect_to records_path, notice: 'Created'
    else
      @owners = Owner.all
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @record = Record.find(params[:id])
    @record.artist_query = @record.artist.name
    @owners = Owner.all
  end

  def update
    @record = Record.find(params[:id])
    if @record.update(record_params)
      redirect_to records_path, notice: 'Updated'
    else
      @owners = Owner.all
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @record = Record.find(params[:id])
    if @record.destroy
      respond_to do |format|
        format.js {
          render layout: false
        }
        format.html {
          redirect_back fallback_location: records_path, notice: 'Destroyed'
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
    def record_params
      params.require(:record).permit(
        :name,
        :phonetic_name,
        :furigana,
        :location,
        :number,
        :comment,
        :artist_id,
        :owner_id
      )
    end
end
