#
# Beez Project: Makefile
#

PROJECTNAME="beez"
DESC="beez"
DIST="dist"
RELEASE="release"
REPORT="report"

__tar=$(shell which tar)
__tar_package_prefix=$(__tar)

__r_js=node_modules/requirejs/bin/r.js
__jshint=node_modules/jshint/bin/jshint
__jsdoc=node_modules/jsdoc/jsdoc
__plato=node_modules/plato/bin/plato

R_JS_CONFIG=build.js
DIST_FILE=dist/beez/index.js
NONE_RELEASE_FILE=release/beez.js
OPTIMIZE_RELEASE_FILE=release/beez.min.js


all: clean init deps setver jshint release last
release: release-none release-uglify

init:
	@echo ""
	@echo "####################"
	@echo "# -- target: init"

	npm install .
	mkdir -p $(RELEASE)
	mkdir -p $(REPORT)

clean:
	@echo ""
	@echo "####################"
	@echo "# -- target: clean"

	rm -rf $(DIST)


setver:
	@echo ""
	@echo "####################"
	@echo "# -- target: setver"

	./setver

deps:
	@echo ""
	@echo "####################"
	@echo "# -- target: depsbuild"

	#git submodule foreach 'git checkout master; git pull --all'
	#git submodule foreach 'git checkout master; git fetch --prune; git pull --all'
	#git submodule sync
	#git submodule update
	#git checkout master
	#git pull --all

	cd libs/beez-core; [ ! -d node_modules ] && npm install .;  make
	#cd libs/beez-ua; [ ! -d node_modules ] && npm install .; ./setver && make
	cd libs/beez-utils; [ ! -d node_modules ] && npm install .; make
	cd libs/beez-i18n; [ ! -d node_modules ] && npm install .; make
	cd libs/beez-mvcr; [ ! -d node_modules ] && npm install .; make

jsdoc:
	@echo ""
	@echo "####################"
	@echo "# -- target: jsdoc"

	$(__jsdoc) -c .jsdoc3.json -d docs -p -r -l s/beez libs/beez-core/s/beez-core libs/beez-mvcr/s/beez-mvcr libs/beez-ua/s/beez-ua libs/beez-utils/s/beez-utils libs/beez-i18n/s/beez-i18n

jshint:
	@echo ""
	@echo "####################"
	@echo "# -- target: jshint"
	$(__jshint) --config .jshintrc s

report:
	@echo ""
	@echo "####################"
	@echo "# -- target: report"

	$(__plato) -d ./report -r ./s libs/beez-*/s

release-none:
	@echo ""
	@echo "####################"
	@echo "# -- target: build-none"
	$(__r_js) -o $(R_JS_CONFIG) optimize=none
	cp -f $(DIST_FILE) $(NONE_RELEASE_FILE)

release-uglify:
	@echo ""
	@echo "####################"
	@echo "# -- target: build-uglify"

	$(__r_js) -o $(R_JS_CONFIG) optimize=uglify2
	cp -f $(DIST_FILE) $(OPTIMIZE_RELEASE_FILE)

last:
	@echo ""
	@echo "####################"
	@echo "# Successful!!!!"
	@echo "####################"
	@echo "release output"
	@echo " - $(NONE_RELEASE_FILE)"
	@echo " - $(OPTIMIZE_RELEASE_FILE)"
	@echo ""
	@echo ""

.PHONY: all release init clean setver deps jsdoc jshint report release-none release-uglify last
