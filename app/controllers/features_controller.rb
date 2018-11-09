class FeaturesController < ApplicationController
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
end
