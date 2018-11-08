class OwnersController < ApplicationController
  include InitialLetterPagination

  before_action :set_initial_letter_pages

  def index
    @owners = Owner.all
    if params["has_prefix"].present?
      @owners = @owners.search_with_prefix(params["has_prefix"])
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end
end
