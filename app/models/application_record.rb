class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  def as_error_json
    {
      errors: errors,
      reason: errors.full_messages.join(",")
    }
  end
end
