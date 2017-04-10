default: run


prepare:
	swift package generate-xcodeproj

task:
	swift build
	./.build/debug/Task
run:
	vapor build
	vapor run serve
migrate: dropdb createdb run

createdb:
	createdb recordhub
dropdb:
	dropdb recordhub
