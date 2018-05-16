default: run


prepare:
	swift package generate-xcodeproj

records:
	swift build -Xlinker -L/usr/local/lib/
	vapor run records

tracks: internal external
internal:
	swift build -Xlinker -L/usr/local/lib/
	vapor run tracks internal
external:
	swift build -Xlinker -L/usr/local/lib/
	vapor run tracks external
gen_internal_track_list:
	cd /Volumes/HAP_Internal
	find . > `ghq list kumabook/recordhub -p`/internal.txt
	cd `ghq list kumabook/recordhub -p`
gen_external_track_list:
	cd /Volumes/HAP_External && \
	find . > `ghq list kumabook/recordhub -p`/external.txt && \
	cd `ghq list kumabook/recordhub -p`
crawl:
	swift build -Xlinker -L/usr/local/lib/
	vapor run crawl_news

run:
	swift build -Xlinker -L/usr/local/lib/
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub

import: dropdb createdb
	rm -f latest.dump
	heroku pg:backups:capture
	heroku pg:backups:download
# you need to create role of heroku database and create postgres role as superuser
	pg_restore --verbose latest.dump  -d recordhub
export:
	pg_dump -Fc --no-acl --no-owner  recordhub > recordhub.dump
	aws s3 cp recordhub.dump s3://recordhub/ --acl public-read --profile=recordhub
	heroku pg:backups:restore 'https://s3-ap-northeast-1.amazonaws.com/recordhub/recordhub.dump' DATABASE_URL --confirm ${APP}
	aws s3 rm s3://recordhub/recordhub.dump --profile=recordhub
update_records: import records export
add_new_tracks: import gen_external_track_list external export
