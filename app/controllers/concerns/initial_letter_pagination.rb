# coding: utf-8

InitialLetterPage = Struct.new(:label, :active?)

module InitialLetterPagination
  extend ActiveSupport::Concern

  def initial_letter_pages
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZあかさたなはまやらわ＃"
    current_letter = params["has_prefix"] || ""
    current_letter.upcase!
    letters.chars.map do |c|
      InitialLetterPage.new(c, current_letter.upcase == c)
    end
  end
end
