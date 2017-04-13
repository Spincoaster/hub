default: run


prepare:
	swift package generate-xcodeproj

import_records:
	swift build
	./.build/debug/ImportRecords
run:
	vapor build
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub
