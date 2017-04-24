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
