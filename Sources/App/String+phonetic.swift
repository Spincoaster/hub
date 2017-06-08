#if os(OSX)
import MeCab
#endif

extension String {
    public func phonetic() -> String {
        let lowercased   = self.lowercased()
        let alphabetized = MeCabHelper.alphabetize(string: lowercased)
        return alphabetized ?? lowercased
    }
    public func furigana() -> String {
        let lowercased   = self.lowercased()
        return MeCabHelper.furigana(string: lowercased)?.toHiragana() ?? ""
    }
    func toHiragana() -> String {
        var str = ""
        for c in unicodeScalars {
            if c.value >= 0x30A1 && c.value <= 0x30F6 {
                str += String(describing: UnicodeScalar(c.value - 96)!)
            } else {
                str += String(c)
            }
        }
        return str
    }
}


class MeCabHelper {
    #if os(OSX)
    static var shared: Mecab? = try! Mecab()
    #endif
    static func furigana(string: String) -> String? {
        #if os(OSX)
            guard let shared = shared, let nodes = try? shared.tokenize(string: string) else { return nil }
            return nodes.map { node -> String in
                guard !node.isBosEos else { return "" }
                return node.features.count < 8 ? node.surface : node.features[8]
                }.joined()
        #else
            return nil
        #endif
    }
    static func alphabetize(string: String) -> String? {
        #if os(OSX)
            guard let shared = shared, let nodes = try? shared.tokenize(string: string) else { return nil }
            return nodes.map { node -> String in
                guard !node.isBosEos else { return "" }
                return katakana2roman(string: node.features.count < 8 ? node.surface : node.features[8])
            }.joined()
        #else
            return nil
        #endif
    }
    static func isAlpha(string: String) -> Bool {
        for char in string.unicodeScalars {
            if !char.isASCII {
                return false
            }
        }
        return true
    }
    static func katakana2roman(string: String) -> String {
        if isAlpha(string: string) {
            return string
        }
        var romanString = ""
        var offset = 0
        let count = string.characters.count
        while (offset < count) {
            let index = string.index(string.startIndex, offsetBy: offset)
            if offset + 2 < count {
                let c = string[index..<string.index(index, offsetBy: 2)]
                if let a = katakana2romanDic[c] {
                    romanString += a
                    offset += 2
                    continue
                }
            }
            let c = string[index..<string.index(index, offsetBy: 1)]
            if let a = katakana2romanDic[c] {
                romanString += a
            } else {
                romanString += c
            }
            offset += 1
        }
        return romanString
    }
    static var katakana2romanDic: [String:String] = [
        "ア": "a" , "イ":  "i" , "ウ": "u"  , "エ": "e" , "オ": "o" ,
        "カ": "ka", "キ": "ki" , "ク": "ku" , "ケ": "ke", "コ": "ko",
        "サ": "sa", "シ": "shi", "ス": "su" , "セ": "se", "ソ": "so",
        "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
        "ナ": "na", "ニ": "ni" , "ヌ": "nu" , "ネ": "ne", "ノ": "no",
        "ハ": "ha", "ヒ": "hi" , "フ": "fu" , "へ": "he", "ホ": "ho",
        "マ": "ma", "ミ": "mi" , "ム": "mu" , "メ": "me", "モ": "mo",
        "ヤ": "ya",              "ユ": "yu" ,             "ヨ": "yo",
        "ラ": "ra", "リ": "ri" , "ル": "ru" , "レ": "re", "ロ": "ro",
        "ワ": "wa", "ヲ": "wo" , "ン": "nn" ,
        "ガ": "ga", "ギ": "gi" , "グ": "gu" , "ゲ": "ge", "ゴ": "go",
        "ザ": "za", "ジ": "zi" , "ズ": "zu" , "ゼ": "ze", "ゾ": "zo",
        "ダ": "da", "ヂ": "di" , "ヅ": "du" , "デ": "de", "ド": "do",
        "バ": "ba", "ビ": "bi" , "ブ": "bu" , "ベ": "be", "ボ": "bo",
        "パ": "pa", "ピ": "pi" , "プ": "pu" , "ペ": "pe", "ポ": "po",
        "キャ": "kya", "キュ": "kyu", "キョ": "kyo",
        "シャ": "sya", "シュ": "syu", "ショ": "syo",
        "チャ": "tya", "チィ": "tyi", "チュ": "tyu", "チェ": "tye", "チョ": "tyo",
        "ニャ": "nya", "ニィ": "nyi", "ニュ": "nyu", "ニェ": "nye", "ニョ": "nyo",
        "ヒャ": "hya", "ヒィ": "hyi", "ヒュ": "hyu", "ヒェ": "hye", "ヒョ": "hyo",
        "ミャ": "mya", "ミィ": "myi", "ミュ": "myu", "ミェ": "mye", "ミョ": "myo",
        "リャ": "rya", "リィ": "ryi", "リュ": "ryu", "リェ": "rye", "リョ": "ryo",
        "ギャ": "gya", "ギィ": "gyi", "ギュ": "gyu", "ギェ": "gye", "ギョ": "gyo",
        "ジャ": "ja" , "ジィ": "ji" , "ジュ": "ju" , "ジェ": "je" , "ジョ": "jo" ,
        "ヂャ": "dya", "ヂィ": "dyi", "ヂュ": "dyu", "ヂェ": "dye", "ヂョ": "dyo",
        "ビャ": "bya", "ビィ": "byi", "ビュ": "byu", "ビェ": "bye", "ビョ": "byo",
        "ピャ": "pya", "ピィ": "pyi", "ピュ": "pyu", "ピェ": "pye", "ピョ": "pyo",
        "ファ": "fa" , "フィ": "fi" ,                "フェ": "fe" , "フォ": "fo" ,
        "フャ": "fya",                "フュ": "fyu",                "フョ": "fyo",
        "ァ"  : "xa" , "ィ"  : "xi" , "ゥ"  : "xu" , "ェ"  : "xe" , "ォ"  : "xo" ,
        "ャ"  : "xya", "ュ"  : "xyu", "ョ"  : "xyo",
        "ッ"  : "xtsu",
        "ウィ": "wi" , "ウェ": "we",
        "ヴァ": "va" , "ヴィ": "vi",  "ヴ"  : "vu",  "ヴェ": "ve",  "ヴォ": "vo"
    ]
}
