class FeaturesController < ApplicationController
  before_action :require_admin, except: [:index, :show]
  before_action :set_feature, except: [:index, :create]
  before_action :set_items, only: [:show, :edit]

  def index
    @features = Feature.all
    @categories = @features.map { |f| f.category }.uniq
    @groups = @categories.map do |c|
      {
        category: c,
        features: @features.select {|f| f.category == c }
      }
    end
  end

  def show
  end

  def edit
  end

  def create
    respond_to do |format|
      @feature = Feature.new(feature_params)
      if @feature.save
        format.html { redirect_to features_path, notice: "Feature was created" }
        format.json { render json: @feature.as_json }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @feature.as_error_json, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @feature.update(feature_params)
        format.html { redirect_to edit_feature_path(@feature), notice: "Feature was updated" }
        format.json { render json: @feature.as_json }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @feature.as_error_json, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    respond_to do |format|
      if @feature.destroy
        format.html { redirect_back fallback_location: features_path, notice: "Feature was deleted" }
        format.json { render json: {} }
      else
        format.html { redirect_to features_path }
        format.json { render json: @feature.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def feature_params
    params.permit(:name,
                  :number,
                  :description,
                  :external_link,
                  :external_thumbnail,
                  :category)
  end

  def set_feature
    @feature = Feature.includes(:feature_items).find(params["id"])
  end

  def set_items
    @items = @feature.feature_items.map do |item|
      if item.track?
        @feature.tracks.select { |t| t.id == item.item_id }.first
      elsif item.record?
        @feature.records.select { |r| r.id == item.item_id }.first
      end
    end
  end
end
