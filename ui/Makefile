DATA_TS := ../data/ts
UI_JS := js
UI_TS := ts

UI_FILES := $(shell find $(UI_TS) -name "*.ts")
OUT_FILES := $(patsubst $(UI_TS)/%.ts,$(UI_JS)/%.js,$(UI_FILES))

.PHONY: all
all: $(UI_JS)/dagoba.js $(UI_JS)/export.js $(OUT_FILES)

$(UI_JS)/dagoba.js: $(DATA_TS)/dagoba.ts
	deno transpile $(DATA_TS)/dagoba.ts -o $(UI_JS)/dagoba.js
	
$(UI_JS)/export.js: $(DATA_TS)/export.ts
	deno transpile $(DATA_TS)/dagoba.ts -o $(UI_JS)/dagoba.js

$(UI_TS)/%.ts: $(UI_JS)/%.js
	deno transpile $< -o $@
