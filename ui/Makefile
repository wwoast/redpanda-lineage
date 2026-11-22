DATA_TS := ../data/ts
UI_JS := js
UI_TS := ts

all:
	deno transpile $(DATA_TS)/dagoba.ts -o $(UI_JS)/dagoba.js
	deno transpile $(DATA_TS)/export.ts -o $(UI_JS)/export.js
	deno transpile $(UI_TS)/environment.ts -o $(UI_JS)/environment.js
	deno transpile $(UI_TS)/gallery.ts -o $(UI_JS)/gallery.js
	deno transpile $(UI_TS)/geolocate.ts -o $(UI_JS)/geolocate.js
	deno transpile $(UI_TS)/icons.ts -o $(UI_JS)/icons.js
	deno transpile $(UI_TS)/init.ts -o $(UI_JS)/init.js
	deno transpile $(UI_TS)/language.ts -o $(UI_JS)/language.js
	deno transpile $(UI_TS)/layout.ts -o $(UI_JS)/layout.js
	deno transpile $(UI_TS)/lookup.ts -o $(UI_JS)/lookup.js
	deno transpile $(UI_TS)/message.ts -o $(UI_JS)/message.js
	deno transpile $(UI_TS)/options.ts -o $(UI_JS)/options.js
	deno transpile $(UI_TS)/page.ts -o $(UI_JS)/page.js
	deno transpile $(UI_TS)/pandas.ts -o $(UI_JS)/pandas.js
	deno transpile $(UI_TS)/parse.ts -o $(UI_JS)/parse.js
	deno transpile $(UI_TS)/query.ts -o $(UI_JS)/query.js
	deno transpile $(UI_TS)/scrollTop.ts -o $(UI_JS)/scrollTop.js
	deno transpile $(UI_TS)/show.ts -o $(UI_JS)/show.js
	deno transpile $(UI_TS)/touch.ts -o $(UI_JS)/touch.js
