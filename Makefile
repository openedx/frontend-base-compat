precommit:
	npm run lint
	npm audit

requirements:
	npm ci

clean:
	rm -rf dist

build:
	tsc --project tsconfig.build.json
	tsc-alias -p tsconfig.build.json
