default: run


prepare:
	swift package generate-xcodeproj

records:
	vapor build
	vapor run records
tracks:
	vapor build
	vapor run tracks
run:
	vapor build
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub
