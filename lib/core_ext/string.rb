class String
  def phonetic
    alphabetized.downcase
  end

  def alphabetized
    Romaji.kana2romaji(furigana)
  end

  def furigana
    result = ""
    Natto::MeCab.new.parse(downcase) do |node|
      break if node.is_eos?
      features = node.feature.split ","
      result += features.count < 9 ? node.surface : features[7]
    end
    result
  end

  def to_hiragana
    Romaji.kata2hira(self)
  end
end
