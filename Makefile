.PHONY: build run preview

build:
	npm test -- --run
	npm run build

run:
	npm run dev

preview:
	npm run preview
