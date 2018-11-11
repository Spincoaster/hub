class Admin < ApplicationRecord
  validates :name,
            presence: true,
            length: { maximum: 50 },
            uniqueness: { case_sensitive: false }

  has_secure_password
end
