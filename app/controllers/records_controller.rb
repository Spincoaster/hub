class RecordsController < ApplicationController
  include InitialLetterPagination

  before_action :set_initial_letter_pages

  def index
    @records = Record.all.includes([:owner, :artist])
    if params["has_prefix"].present?
      @records = @records.search_with_prefix(params["has_prefix"])
    end
    if params["owner_id"].present?
      @records = @records.where(owner_id: params["owner_id"])
    end
  end

  def set_initial_letter_pages
    @initial_letter_pages = initial_letter_pages
  end
end