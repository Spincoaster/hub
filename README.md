# hub

## Development

- mecab and mecab-ipadic-neologd
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

- Command list:
  - `bin/rails s`: Run server
  - `bin/rails crawl_news`: Crawl and import news to db
  - `bin/crawl_records`: Crawl and import records to db
  - `bin/crawl_tracsk`:  Crawl and import tracks to db
  - `bin/upload_tracks_csv`: Export tracks list to csv file and upload it google drive (Run with local machine)
