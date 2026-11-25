DATA_TS := ../data/ts
UI_JS := js
UI_JSX := js/components
UI_TS := ts
UI_TSX := ts/components

UI_TS_CODE := $(shell find $(UI_TS) -name "*.ts")
UI_COMPONENTS := $(shell find $(UI_TSX) -name "*.tsx")
OUT_CODE := $(patsubst $(UI_TS)/%.ts,$(UI_JS)/%.js,$(UI_TS_CODE))
OUT_COMPONENTS := $(patsubst $(UI_TSX)/%.tsx,$(UI_JSX)/%.js,$(UI_COMPONENTS))

.PHONY: transpile
transpile: $(UI_JS)/dagoba.js $(UI_JS)/export.js $(OUT_CODE) $(OUT_COMPONENTS)

$(UI_JS)/dagoba.js: $(DATA_TS)/dagoba.ts
	deno transpile $< -o $@

$(UI_JS)/export.js: $(DATA_TS)/export.ts
	deno transpile $< -o $@

$(UI_JS)/%.js: $(UI_TS)/%.ts
	deno transpile $< -o $@

$(UI_JSX)/%.js: $(UI_TSX)/%.tsx
	deno transpile $< -o $@
