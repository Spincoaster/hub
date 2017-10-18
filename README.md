# record hub

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Development

- vapor
  ```
  brew tap vapor/homebrew-tap
  brew update
  brew install vapor
  ```
- postgredql
  ```
  brew install postgres
  ```
- mecab
  ```
  brew install mecab mecab-ipadic xz
  ghq get neologd/mecab-ipadic-neologd
  cd `ghq list neologd/mecab-ipadic-neologd -p`
  ./bin/install-mecab-ipadic-neologd -n
  ```

  ```
  vi /usr/local/etc/mecabrc
  # edit below
  # dicdir = /usr/local/lib/mecab/dic/mecab-ipadic-neologd
  ```
- flac
  - We use `metaflac` command so install from [xiph/flac](https://github.com/xiph/flac)
- heroku cli
  ```
  brew install heroku/brew/heroku
  ```
