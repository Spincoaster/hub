default: run


prepare:
	swift package generate-xcodeproj

records:
	swift build -Xlinker -L/usr/local/lib/
	vapor run records
tracks:
	swift build -Xlinker -L/usr/local/lib/
	vapor run tracks
run:
	swift build -Xlinker -L/usr/local/lib/
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub
export:
	pg_dump -Fc --no-acl --no-owner  recordhub > recordhub.dump
	aws s3 cp recordhub.dump s3://recordhub/ --acl public-read --profile=recordhub
	heroku pg:backups:restore 'https://s3-ap-northeast-1.amazonaws.com/recordhub/recordhub.dump' DATABASE_URL
	aws s3 rm s3://recordhub/recordhub.dump --profile=recordhub
