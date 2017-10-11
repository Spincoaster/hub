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
gen_track_list:
	cd /Volumes/HAP_Internal
	find . > `ghq list kumabook/recordhub -p`/internal.txt
	cd /Volumes/HAP_External
	find . > `ghq list kumabook/recordhub -p`/external.txt
	cd `ghq list kumabook/recordhub -p`

run:
	swift build -Xlinker -L/usr/local/lib/
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub

import: gen_track_list dropdb createdb records tracks
export:
	pg_dump -Fc --no-acl --no-owner  recordhub > recordhub.dump
	aws s3 cp recordhub.dump s3://recordhub/ --acl public-read --profile=recordhub
	heroku pg:backups:restore 'https://s3-ap-northeast-1.amazonaws.com/recordhub/recordhub.dump' DATABASE_URL
	aws s3 rm s3://recordhub/recordhub.dump --profile=recordhub
