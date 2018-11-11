class FeatureItemsController < ApplicationController
  before_action :require_admin
  def create
    @feature = Feature.find(feature_item_params[:feature_id])
    respond_to do |format|
      @feature_item = FeatureItem.new(feature_item_params)
      if @feature_item.save
        format.html { redirect_to feature_edit_path(@feature), notice: "Feature item was created" }
        format.json { render json: @feature_item.as_json }
      else
        format.html { redirect_to feature_edit_path(@feature) }
        format.json { render json: @feature_item.as_error_json, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @feature_item = FeatureItem.find(params[:id])
    respond_to do |format|
      if @feature_item.destroy
        format.html { redirect_back fallback_location: features_path, notice: "Feature item was created" }
        format.json { render json: {} }
      else
        format.html { redirect_back(fallback_location: features_path) }
        format.json { render json: @feature_item.as_error_json, status: :unprocessable_entity }
      end
    end
  end

  private

  def feature_item_params
    params.require(:feature_item).permit(:feature_id,
                                         :item_id,
                                         :item_type,
                                         :number,
                                         :comment)
  end

end
