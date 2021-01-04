class OwnersController < ApplicationController
  include InitialLetterPagination

  before_action :require_admin, except: [:index]
  before_action :set_initial_letter_pages

  def index
    @owners = Owner.all
    if params["has_prefix"].present?
      @owners = @owners.search_with_prefix(params["has_prefix"])
    end
  end

  def new
    @owner = Owner.new
  end

  def create
    @owner = Owner.new(owner_params)
    if @owner.save
      redirect_to owners_path, notice: 'Created'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @owner = Owner.find(params[:id])
  end

  def update
    @owner = Owner.find(params[:id])
    if @owner.update(owner_params)
      redirect_to owners_path, notice: 'Updated'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @owner = Owner.find(params[:id])
    if @owner.destroy
      redirect_to owners_path, notice: 'Destroyed'
    else
      render :show, status: :unprocessable_entity
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end

  private
    def owner_params
      params.require(:owner).permit(
        :name
      )
    end
end
