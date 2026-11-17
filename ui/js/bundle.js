// ts/environment.ts
var env = {
  current: void 0,
  language: "en",
  lastSearch: "#home",
  output_mode: "entities",
  paging: {
    callback: {
      arguments: [],
      function: void 0,
      frame_id: void 0
    },
    /** If a query has enough results for multiple pages, display the button */
    display_button: false,
    media_count: 10,
    results_count: 15,
    /** Paging seed, set to when the page was last loaded */
    seed: Date.now(),
    /** Shown counter, for page refreshes */
    shown_pages: 1
  },
  /** Credit for photos being shown */
  preserve_case: false,
  /** If a URI indicates a specific photo, indicate which one here */
  specific_photo: void 0
};
var environment_default = env;

// ../data/ts/dagoba.ts
var Graph = class {
  autoid = 1;
  edges = [];
  vertices = [];
  vertexIndex = {};
  constructor(V, E) {
    if (Array.isArray(V)) this.addVertices(V);
    if (Array.isArray(E)) this.addEdges(E);
  }
  /** accepts an edge-like object, with properties */
  addEdge(input) {
    const edge = {
      ...input,
      ...{
        _in: this.findVertexById(input._in),
        _out: this.findVertexById(input._out)
      }
    };
    if (!(edge._in && edge._out)) {
      return false;
    }
    edge._out._out.push(edge);
    edge._in._in.push(edge);
    this.edges.push(edge);
  }
  addEdges(edges) {
    edges.forEach((edge) => this.addEdge(edge));
  }
  /** accepts a vertex-like object, with properties */
  addVertex(vertex) {
    if (!vertex._id) vertex._id = (++this.autoid).toString();
    else if (this.findVertexById(vertex._id)) return error(`A vertex with id ${vertex._id} already exists`);
    vertex._out = [];
    vertex._in = [];
    this.vertices.push(vertex);
    this.vertexIndex[`${vertex._id}`] = vertex;
    return vertex._id;
  }
  addVertices(vertices) {
    vertices.forEach((vertex) => this.addVertex(vertex));
  }
  findInEdges(vertex) {
    return vertex._in;
  }
  findOutEdges(vertex) {
    return vertex._out;
  }
  findVertexById(vertex_id) {
    return this.vertexIndex[vertex_id];
  }
  /** our general vertex finding function */
  findVertices(args) {
    if (typeof args[0] == "object") return this.searchVertices(args[0]);
    else if (args.length == 0) return this.vertices.slice();
    else return this.findVerticesByIds(args);
  }
  findVerticesByIds(ids) {
    if (ids.length == 1) {
      const maybe_vertex = this.findVertexById(ids[0]);
      return maybe_vertex ? [
        maybe_vertex
      ] : [];
    }
    return ids.map((id) => this.findVertexById(id)).filter(Boolean);
  }
  removeEdge(edge) {
    remove(edge._in._in, edge);
    remove(edge._out._out, edge);
    remove(this.edges, edge);
  }
  removeVertex(vertex) {
    vertex._in.slice().forEach((edge) => this.removeEdge(edge));
    vertex._out.slice().forEach((edge) => this.removeEdge(edge));
    remove(this.vertices, vertex);
    delete this.vertexIndex[vertex._id];
  }
  /** find vertices that match obj's key-value pairs */
  searchVertices(filter) {
    return this.vertices.filter((vertex) => objectFilter(vertex, filter));
  }
  /** serialization */
  toString() {
    return jsonify(this);
  }
  /** A query initializer: g.v() -> query */
  v(...args) {
    const query = new Query(this);
    query.add("vertex", args);
    return query;
  }
};
var Query = class {
  graph;
  gremlins = [];
  program = [];
  state = [];
  /** factory (only called by a graph's query initializers) */
  constructor(graph) {
    this.graph = graph;
    return this;
  }
  add = (pipetype, args) => {
    const step = [
      pipetype,
      args
    ];
    this.program.push(step);
    return this;
  };
  run = () => {
    this.program = transform(this.program);
    const max = this.program.length - 1;
    let maybe_gremlin = false;
    let results2 = [];
    let done = -1;
    let pc = max;
    let step, state2, pipetype;
    while (done < max) {
      step = this.program[pc];
      state2 = this.state[pc] = this.state[pc] || {};
      pipetype = getPipetype(step[0]);
      maybe_gremlin = pipetype(this.graph, step[1], maybe_gremlin, state2);
      if (maybe_gremlin == "pull") {
        maybe_gremlin = false;
        if (pc - 1 > done) {
          pc--;
          continue;
        } else {
          done = pc;
        }
      }
      if (maybe_gremlin == "done") {
        maybe_gremlin = false;
        done = pc;
      }
      pc++;
      if (pc > max) {
        if (maybe_gremlin) results2.push(maybe_gremlin);
        maybe_gremlin = false;
        pc--;
      }
    }
    results2 = results2.map((gremlin) => gremlin.result != null ? gremlin.result : gremlin.vertex);
    return results2;
  };
};
var Pipetypes = {};
function addPipetype(name, fun) {
  Pipetypes[name] = fun;
  Query.prototype[name] = function(...args) {
    return this.add(name, args);
  };
}
function fauxPipetype(_graph, _args, maybe_gremlin, _state) {
  return maybe_gremlin || "pull";
}
function getPipetype(name) {
  const pipetype = Pipetypes[name];
  if (!pipetype) error(`Unrecognized pipe type: ${name}`);
  return pipetype || fauxPipetype;
}
addPipetype("vertex", function(graph, args, gremlin, state2) {
  if (!state2.vertices) state2.vertices = graph.findVertices(args);
  if (!state2.vertices.length) return "done";
  const vertex = state2.vertices.pop();
  return makeGremlin(vertex, gremlin.state);
});
function simpleTraversal(dir) {
  function get_edges(graph, dir2, vertex, filter) {
    const find_method = dir2 === "out" ? "findOutEdges" : "findInEdges";
    const other_side = dir2 === "out" ? "_in" : "_out";
    return graph[find_method](vertex).filter(filterEdges(filter)).map((edge) => edge[other_side]);
  }
  return function(graph, args, gremlin, state2) {
    if (!gremlin && (!state2.edges || !state2.edges.length)) return "pull";
    if (!state2.edges || !state2.edges.length) {
      state2.gremlin = gremlin;
      state2.edges = get_edges(graph, dir, gremlin.vertex, args[0]);
      if (dir === "both") state2.edges = state2.edges.concat(get_edges(graph, "out", gremlin.vertex, args[0]));
    }
    if (!state2.edges.length) return "pull";
    const vertex = state2.edges.pop();
    return gotoVertex(state2.gremlin, vertex);
  };
}
addPipetype("in", simpleTraversal("in"));
addPipetype("out", simpleTraversal("out"));
addPipetype("both", simpleTraversal("both"));
addPipetype("property", function(_graph, args, gremlin, _state) {
  if (!gremlin) return "pull";
  gremlin.result = gremlin.vertex ? gremlin.vertex[args[0]] : null;
  return gremlin.result == null ? false : gremlin;
});
addPipetype("unique", function(_graph, _args, gremlin, state2) {
  if (!gremlin) return "pull";
  if (state2[gremlin.vertex._id]) return "pull";
  state2[gremlin.vertex._id] = true;
  return gremlin;
});
addPipetype("filter", function(_graph, args, gremlin, _state) {
  if (!gremlin) return "pull";
  if (typeof args[0] == "object") return objectFilter(gremlin.vertex, args[0]) ? gremlin : "pull";
  if (typeof args[0] != "function") {
    error("Filter arg is not a function: " + args[0]);
    return gremlin;
  }
  if (!args[0](gremlin.vertex, gremlin)) return "pull";
  return gremlin;
});
addPipetype("take", function(_graph, args, gremlin, state2) {
  state2.taken = state2.taken || 0;
  if (state2.taken == args[0]) {
    state2.taken = 0;
    return "done";
  }
  if (!gremlin) return "pull";
  state2.taken++;
  return gremlin;
});
addPipetype("as", function(_graph, args, gremlin, _state) {
  if (!gremlin) return "pull";
  gremlin.state.as = gremlin.state.as || {};
  gremlin.state.as[args[0]] = gremlin.vertex;
  return gremlin;
});
addPipetype("back", function(_graph, args, gremlin, _state) {
  if (!gremlin) return "pull";
  return gotoVertex(gremlin, gremlin.state.as[args[0]]);
});
addPipetype("except", function(_graph, args, gremlin, _state) {
  if (!gremlin) return "pull";
  if (gremlin.vertex == gremlin.state.as[args[0]]) return "pull";
  return gremlin;
});
addPipetype("merge", function(_graph, args, gremlin, state2) {
  if (!state2.vertices && !gremlin) return "pull";
  if (!state2.vertices || !state2.vertices.length) {
    const obj = (gremlin.state || {}).as || {};
    state2.vertices = args.map((id) => obj[id]).filter(Boolean);
  }
  if (!state2.vertices.length) return "pull";
  const vertex = state2.vertices.pop();
  return makeGremlin(vertex, gremlin.state);
});
var Transformers = [];
function transform(program) {
  return Transformers.reduce(function(acc, transformer) {
    return transformer.fun(acc);
  }, program);
}
function cleanEdge(key, value) {
  return key == "_in" || key == "_out" ? value._id : value;
}
function cleanVertex(key, value) {
  return key == "_in" || key == "_out" ? void 0 : value;
}
function error(msg) {
  console.log(msg);
  return false;
}
function filterEdges(filter) {
  return function(edge) {
    if (!filter) return true;
    if (typeof filter == "string") return edge._label == filter;
    if (Array.isArray(filter)) return filter.includes(edge._label);
    return objectFilter(edge, filter);
  };
}
function gotoVertex(gremlin, vertex) {
  return makeGremlin(vertex, gremlin.state);
}
function jsonify(graph) {
  return '{"V":' + JSON.stringify(graph.vertices, cleanVertex) + ',"E":' + JSON.stringify(graph.edges, cleanEdge) + "}";
}
function makeGremlin(vertex, state2) {
  return {
    vertex,
    state: state2 || {}
  };
}
function objectFilter(thing, filter) {
  for (const key in filter) if (thing[key] !== filter[key]) return false;
  return true;
}
function remove(list, item) {
  return list.splice(list.indexOf(item), 1);
}
var dagoba_default = Graph;

// ../data/ts/export.ts
function distinct(list) {
  return list.filter((value, index, self) => self.indexOf(value) === index);
}
function num(prefixId) {
  const suffix = prefixId.includes(".") ? prefixId.split(".").pop() ?? "" : prefixId;
  const numericId = parseInt(suffix);
  if (isNaN(numericId)) throw new Error(`TODO: ${prefixId} value or suffix is not numeric`);
  return numericId;
}

// ts/lookup.ts
var Flags = {
  "Argentina": "\u{1F1E6}\u{1F1F7}",
  "Australia": "\u{1F1E6}\u{1F1FA}",
  "Austria": "\u{1F1E6}\u{1F1F9}",
  "Belgium": "\u{1F1E7}\u{1F1EA}",
  "Bhutan": "\u{1F1E7}\u{1F1F9}",
  "Brazil": "\u{1F1E7}\u{1F1F7}",
  "Canada": "\u{1F1E8}\u{1F1E6}",
  "Chile": "\u{1F1E8}\u{1F1F1}",
  "China": "\u{1F1E8}\u{1F1F3}",
  "Croatia": "\u{1F1ED}\u{1F1F7}",
  "Czechia": "\u{1F1E8}\u{1F1FF}",
  "Default": "\u{1F43C}",
  "Denmark": "\u{1F1E9}\u{1F1F0}",
  "France": "\u{1F1EB}\u{1F1F7}",
  "Germany": "\u{1F1E9}\u{1F1EA}",
  "Hong Kong": "\u{1F1ED}\u{1F1F0}",
  "Hungary": "\u{1F1ED}\u{1F1FA}",
  "Ireland": "\u{1F1EE}\u{1F1EA}",
  "India": "\u{1F1EE}\u{1F1F3}",
  "Indonesia": "\u{1F1EE}\u{1F1E9}",
  "Isle of Man": "\u{1F1EE}\u{1F1F2}",
  "Italy": "\u{1F1EE}\u{1F1F9}",
  "Japan": "\u{1F1EF}\u{1F1F5}",
  "Laos": "\u{1F1F1}\u{1F1E6}",
  "Mexico": "\u{1F1F2}\u{1F1FD}",
  "Nepal": "\u{1F1F3}\u{1F1F5}",
  "Netherlands": "\u{1F1F3}\u{1F1F1}",
  "New Zealand": "\u{1F1F3}\u{1F1FF}",
  "Poland": "\u{1F1F5}\u{1F1F1}",
  "Portugal": "\u{1F1F5}\u{1F1F9}",
  "Russia": "\u{1F1F7}\u{1F1FA}",
  "Singapore": "\u{1F1F8}\u{1F1EC}",
  "Slovakia": "\u{1F1F8}\u{1F1F0}",
  "South Korea": "\u{1F1F0}\u{1F1F7}",
  "Spain": "\u{1F1EA}\u{1F1F8}",
  "Sweden": "\u{1F1F8}\u{1F1EA}",
  "Taiwan": "\u{1F1F9}\u{1F1FC}",
  "Thailand": "\u{1F1F9}\u{1F1ED}",
  "UK": "\u{1F1EC}\u{1F1E7}",
  "USA": "\u{1F1FA}\u{1F1F8}"
};
var unknownName = {
  "en": "Unknown",
  "es": "Desconocido",
  "ja": "\u672A\u8A73",
  "ko": "\uC54C \uC218 \uC5C6\uC74C",
  "ne": "\u0905\u091C\u094D\u091E\u093E\u0924",
  "pt": "Desconhecido(a)",
  "zh": "\u4E0D\u660E"
};
var DateLocale = {
  "mm_dd": {
    "en": "mm_dd",
    "es": "dd_mm",
    "ja": "mm_dd",
    "ko": "mm_dd",
    "ne": "mm_dd",
    "pt": "dd_mm",
    "zh": "mm_dd"
  },
  "yy_mm": {
    "en": "mm_yyyy",
    "es": "mm_yyyy",
    "ja": "yyyy_mm",
    "ko": "yyyy_mm",
    "ne": "yyyy_mm",
    "pt": "mm_yyyy",
    "zh": "yyyy_mm"
  },
  "yy_mm_dd": {
    "en": "mm_dd_yyyy",
    "es": "dd_mm_yyyy",
    "ja": "yyyy_mm_dd",
    "ko": "yyyy_mm_dd",
    "ne": "yyyy_mm_dd",
    "pt": "dd_mm_yyyy",
    "zh": "yyyy_mm_dd"
  }
};
var Defaults = {
  age: {
    "en": {
      "year": "year",
      "years": "years",
      "month": "month",
      "months": "months",
      "day": "day",
      "days": "days"
    },
    "es": {
      "year": "a\xF1o",
      "years": "a\xF1os",
      "month": "mes",
      "months": "meses",
      "day": "d\xEDa",
      "days": "d\xEDas"
    },
    "ja": {
      "year": "\u6B73",
      "years": "\u6B73",
      "month": "\u6708",
      "months": "\u6708",
      "day": "\u65E5",
      "days": "\u65E5"
    },
    "ko": {
      "year": "\uC138",
      "years": "\uC138",
      "month": "\uAC1C\uC6D4",
      "months": "\uAC1C\uC6D4",
      "day": "\uC77C",
      "days": "\uC77C"
    },
    "ne": {
      "year": "\u092C\u0930\u094D\u0937",
      "years": "\u092C\u0930\u094D\u0937",
      "month": "\u092E\u0939\u093F\u0928\u093E",
      "months": "\u092E\u0939\u093F\u0928\u093E",
      "day": "\u0926\u093F\u0928",
      "days": "\u0926\u093F\u0928\u0939\u0930\u0941"
    },
    "pt": {
      "year": "ano",
      "years": "anos",
      "month": "m\xEAs",
      "months": "meses",
      "day": "dia",
      "days": "dias"
    },
    "zh": {
      "year": "\u5E74",
      "years": "\u5E74",
      "month": "\u6708",
      "months": "\u6708",
      "day": "\u5929",
      "days": "\u5929"
    }
  },
  animal: {
    "_id": "panda.0",
    "_in": [],
    "_out": [],
    "birthday": "1970/1/1",
    "birthplace": "zoo.0",
    "children": [],
    "commitdate": "1970/1/1",
    "death": "1970/1/1",
    "gender": "unknown",
    "language.order": [
      "en",
      "ja"
    ],
    "litter": [],
    "locations": [],
    "name": {
      "en": "Panda Not Found",
      "es": "Panda no encontrado",
      "ja": "\u30D1\u30F3\u30C0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F",
      "ko": "\uD310\uB2E4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
      "ne": "\u0928\u093F\u0917\u0932\u094D\u092F\u093E \u092A\u094B\u0928\u093F\u092F\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928",
      "pt": "Panda n\xE3o encontrado",
      "zh": "TOWRITE"
    },
    "nicknames": {
      "en": [
        "No Nicknames Recorded"
      ],
      "es": [
        "No se registraron apodos"
      ],
      "ja": [
        "\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0\u306F\u8A18\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093"
      ],
      "ko": [
        "\uB4F1\uB85D\uB41C \uBCC4\uBA85\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"
      ],
      "ne": [
        "\u0909\u092A\u0928\u093E\u092E\u0939\u0930\u0942 \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928"
      ],
      "pt": [
        "Nenhum apelido registrado"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    "oldnames": {
      "en": [
        "No Alternate Names Recorded"
      ],
      "es": [
        "No se registraron nombres alternativos"
      ],
      "ja": [
        "\u4EE3\u308F\u308A\u306E\u30B9\u30DA\u30EB\u306F\u8A18\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093"
      ],
      "ko": [
        "\uB4F1\uB85D\uB41C \uB2E4\uB978 \uC774\uB984\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"
      ],
      "ne": [
        "\u0905\u0930\u0941 \u0928\u093E\u092E\u0939\u0930\u0941 \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928"
      ],
      "pt": [
        "Nenhum nome alternativo registrado"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    "othernames": {
      "en": [
        "No Alternate Names Recorded"
      ],
      "es": [
        "No se registraron nombres alternativos"
      ],
      "ja": [
        "\u4EE3\u308F\u308A\u306E\u30B9\u30DA\u30EB\u306F\u8A18\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093"
      ],
      "ko": [
        "\uB4F1\uB85D\uB41C \uB2E4\uB978 \uC774\uB984\uC774 \uC5C6\uC2B5\uB2C8\uB2E4"
      ],
      "ne": [
        "\u0905\u0930\u0941 \u0928\u093E\u092E\u0939\u0930\u0941 \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928"
      ],
      "pt": [
        "Nenhum nome alternativo registrado"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    "photos": [],
    "species": "-1",
    "studbook.id": "-1",
    "type": "panda",
    "video": "images/no-panda-portrait.jpg",
    "zoo": 0
  },
  /** Missing or undescribed authors / photo credits */
  authors: {
    "anonymous": {
      "en": "anonymous",
      "es": "an\xF3nimo",
      "ja": "\u533F\u540D",
      "ko": "\uC775\uBA85",
      "ne": "\u092C\u0947\u0928\u093E\u092E\u0940",
      "pt": "an\xF4nimo",
      "zh": "\u533F\u540D"
    },
    "uncredited": {
      "en": "uncredited",
      "es": "sin acreditar",
      "ja": "\u4FE1\u7528\u3055\u308C\u3066\u3044\u306A\u3044",
      "ko": "\uACF5\uB85C \uBBF8\uAE30\uC7AC",
      "ne": "\u0905\u092A\u094D\u0930\u0924\u094D\u092F\u093E\u0936\u093F\u0924",
      "pt": "n\xE3o creditado",
      "zh": "\u6C92\u6709\u4FE1\u7528"
    }
  },
  date: {
    "en": "MM/DD/YYYY",
    "es": "DD/MM/YYYY",
    "ja": "YYYY\u5E74MM\u6708DD\u65E5",
    "ko": "YYYY\uB144MM\uC6D4DD\uC77C",
    "ne": "YYYY-MM-DD",
    "pt": "DD/MM/YYYY",
    "zh": "YYYY-MM-DD"
  },
  date_season: {
    "en": "SEASON YYYY",
    "es": "SEASON YYYY",
    "ja": "SEASON YYYY",
    "ko": "SEASON YYYY",
    "ne": "SEASON YYYY",
    "pt": "SEASON YYYY",
    "zh": "SEASON YYYY"
  },
  earliest: {
    "year": 1970
  },
  gender: {
    "Female": {
      "en": "female",
      "es": "hembra",
      "ja": "\u30E1\u30B9",
      "ko": "\uC5EC",
      "ne": "\u092E\u0939\u093F\u0932\u093E",
      "pt": "f\xEAmea",
      "zh": "\u5973"
    },
    "Male": {
      "en": "male",
      "es": "macho",
      "ja": "\u30AA\u30B9",
      "ko": "\uB0A8",
      "ne": "\u0928\u0930",
      "pt": "macho",
      "zh": "\u7537"
    }
  },
  /** 
   * Used for determining what languages are selectable. Don't add new
   * languages to this set until we're ready with panda data in that language.
   * We look for ISO-639-1 codes in the navigator.languages value, and map it
   * to a language definition used within this project's code. The ordering
   * here determines the appearance of the buttons in the language menu.
   */
  languages: [
    "en",
    "ja",
    "zh",
    "ne",
    "pt",
    "es",
    "ko"
  ],
  /** Used for missing mothers and fathers, where capitalization is needed */
  no_name: unknownName,
  photo: {
    "author": unknownName,
    "commitdate": "1970/1/1",
    "coordinates": {},
    "source": "https://redpandafinder.com",
    "tags": [],
    "url": "images/no-panda-portrait.jpg"
  },
  /** Character ranges */
  ranges: {
    "en": [
      /[\u0020-\u007f]/,
      /[\u00a0-\u00ff]/,
      /[\u0100-\u017f]/,
      /[\u0180-\u024f]/
      // Latin Supplement B
    ],
    "ja": [
      /[\u3000-\u303f]/,
      /[\u3040-\u309f]/,
      /[\u30a0-\u30ff]/,
      /[\uff00-\uffef]/,
      /[\u4e00-\u9faf]/
      // CJK unified Kanji set
    ],
    "ko": [
      /[\uAC00-\uD7AF]/,
      /[\u1100-\u11FF]/,
      /[\u3130-\u318F]/,
      /[\u3200-\u33FF]/
    ],
    "ne": [
      /[\u0900-\u0954]/
      // Devanghari unicode range
    ]
  },
  /** Used for slip-ins in Panda dossiers for brothers/sisters/moms */
  relations: {
    "aunt": {
      "en": "aunt",
      "es": "t\xEDa",
      "ja": "\u53D4\u6BCD",
      "ko": "\uC774\uBAA8",
      "ne": "\u0915\u093E\u0915\u0940",
      "pt": "tia",
      "zh": "\u59D1\u5ABD"
    },
    "brother": {
      "en": "brother",
      "es": "hermano",
      "ja": "\u5144",
      "ko": "\uD615\uC81C",
      "ne": "\u092D\u093E\u0908",
      "pt": "irm\xE3o",
      "zh": "\u5144"
    },
    "children": {
      "en": "children",
      "es": "ni\xF1os",
      "ja": "\u5B50\u4F9B",
      "ko": "\uC790\uB140",
      "ne": "\u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941",
      "pt": "filhos(as)",
      "zh": "\u5B69\u5B50"
    },
    "cousin": {
      "en": "cousin",
      "es": "primo",
      "ja": "\u3044\u3068\u3053",
      "ko": "\uC0AC\uCD0C",
      "ne": "\u092D\u093E\u0928\u094D\u091C\u093E",
      "pt": "primo(a)",
      "zh": "\u8868\u59D0"
    },
    "father": {
      "en": "father",
      "es": "padre",
      "ja": "\u7236",
      "ko": "\uC544\uBE60",
      "ne": "\u092C\u0941\u092C\u093E",
      "pt": "pai",
      "zh": "\u7236"
    },
    "grandfather": {
      "en": "grandfather",
      "es": "abuelo",
      "ja": "\u304A\u3058\u3044\u3061\u3083\u3093",
      "ko": "\uD560\uC544\uBC84\uC9C0",
      "ne": "\u0939\u091C\u0941\u0930\u092C\u0941\u092C\u093E",
      "pt": "av\xF4",
      "zh": "\u7956\u7236"
    },
    "grandmother": {
      "en": "grandmother",
      "es": "abuela",
      "ja": "\u304A\u3070\u3042\u3061\u3083\u3093",
      "ko": "\uD560\uBA38\uB2C8",
      "ne": "\u0939\u091C\u0941\u0930\u0906\u092E\u093E",
      "pt": "av\xF3",
      "zh": "\u7956\u6BCD"
    },
    "litter": {
      "en": "litter",
      "es": "camada",
      "ja": "\u53CC\u5B50",
      /* "同腹仔" */
      "ko": "\uC30D\uB465\uC774",
      "ne": "\u0930\u094B\u091F\u0940",
      "pt": "ninhada",
      "zh": "\u8F7F\u5B50"
    },
    "mother": {
      "en": "mother",
      "es": "madre",
      "ja": "\u6BCD",
      "ko": "\uC5C4\uB9C8",
      "ne": "\u0906\u092E\u093E",
      "pt": "m\xE3e",
      "zh": "\u6BCD"
    },
    "nephew": {
      "en": "nephew",
      "es": "sobrino",
      "ja": "\u7525",
      "ko": "\uC870\uCE74(\uB0A8)",
      "ne": "\u092D\u0924\u093F\u091C\u093E",
      "pt": "sobrinho",
      "zh": "\u5916\u7525"
    },
    "niece": {
      "en": "niece",
      "es": "sobrina",
      "ja": "\u59EA",
      "ko": "\uC870\uCE74(\uC5EC)",
      "ne": "\u092D\u093E\u0928\u094D\u091C\u0940",
      "pt": "sobrinha",
      "zh": "\u4F84\u5973"
    },
    "parents": {
      "en": "parents",
      "es": "padres",
      "ja": "\u4E21\u89AA",
      "ko": "\uBD80\uBAA8",
      "ne": "\u0905\u092D\u093F\u092D\u093E\u0935\u0915",
      "pt": "pais",
      "zh": "\u7236\u6BCD"
    },
    "sister": {
      "en": "sister",
      "es": "hermana",
      "ja": "\u59C9",
      "ko": "\uC790\uB9E4",
      "ne": "\u092C\u0939\u093F\u0928\u0940",
      "pt": "irm\xE3",
      "zh": "\u59B9\u59B9"
    },
    "siblings": {
      "en": "siblings",
      "es": "hermanos",
      "ja": "\u5144\u5F1F",
      "ko": "\uD615\uC81C\xB7\uC790\uB9E4",
      "ne": "\u092D\u093E\u0907\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942",
      "pt": "irm\xE3os(\xE3s)",
      "zh": "\u5144\u5F1F\u59D0\u59B9"
    },
    "uncle": {
      "en": "uncle",
      "es": "t\xEDo",
      "ja": "\u53D4\u7236",
      "ko": "\uC0BC\uCD0C",
      "ne": "\u0915\u093E\u0915\u093E",
      "pt": "tio",
      "zh": "\u53D4\u53D4"
    }
  },
  species: {
    "en": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "es": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "ja": [
      "\u897F\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0",
      "\u30B7\u30BB\u30F3\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0",
      "\u672A\u8A73\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0"
    ],
    "ko": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "ne": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "pt": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ],
    "zh": [
      "Ailurus fulgens fulgens",
      "Ailurus fulgens styani",
      "Ailurus fulgens"
    ]
  },
  unknown: {
    "en": "unknown",
    "es": "desconocido",
    "ja": "\u672A\u8A73",
    "ko": "\uC54C \uC218 \uC5C6\uC74C",
    "ne": "\u0905\u091C\u094D\u091E\u093E\u0924",
    "pt": "desconhecido",
    "zh": "\u4E0D\u660E"
  },
  /** Slightly different default zoo listing, for wild-born animals */
  wild: {
    "_id": "wild.0",
    "_in": [],
    "_out": [],
    "address": {
      "en": "Captured or Rescued Wild Animal",
      "es": "Animal Salvaje Capturado o Rescatado",
      "ja": "TOWRITE",
      "ko": "\uD3EC\uD68D\uB418\uAC70\uB098 \uAD6C\uC870\uB41C \uC57C\uC0DD \uB3D9\uBB3C",
      "ne": "\u091C\u0902\u0917\u0932\u0940 \u091C\u0928\u093E\u0935\u0930 \u0915\u092C\u094D\u091C\u093E \u0935\u093E \u092C\u091A\u093E\u0935",
      "pt": "Animal selvagem capturado ou resgatado",
      "zh": "TOWRITE"
    },
    "commitdate": "1970/1/1",
    "language.order": [
      "en",
      "ja"
    ],
    "location": {
      "en": "No City, District, or State Info Listed",
      "es": "No Se Incluye Informaci\xF3n de Ciudad, Distrito o Estado",
      "ja": "\u5E02\u533A\u753A\u6751\u306E\u60C5\u5831\u304C\u8868\u793A\u3055\u308C\u3066\u3044\u306A\u3044",
      "ko": "\uB3C4\uC2DC, \uC9C0\uC5ED \uB610\uB294 \uC8FC \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      "ne": "\u0915\u0941\u0928\u0948 \u0938\u094D\u0925\u093E\u0928 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u091B\u0948\u0928",
      "pt": "Nenhuma informa\xE7\xE3o de cidade, distrito ou estado listada",
      "zh": "TOWRITE"
    },
    "name": {
      "en": "Zoo Not Found",
      "es": "Zoo No Encontrado",
      "ja": "\u52D5\u7269\u5712\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093",
      "ko": "\uB3D9\uBB3C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
      "ne": "\u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928",
      "pt": "Zool\xF3gico n\xE3o encontrado",
      "zh": "TOWRITE"
    },
    "photos": [],
    "type": "wild",
    "video": "images/no-zoo.jpg",
    "website": "https://www.worldwildlife.org/"
  },
  zoo: {
    "_id": "zoo.0",
    "_in": [],
    "_out": [],
    "address": {
      "en": "No Google Maps Address Recorded",
      "es": "No Se Registr\xF3 Ninguna Direcci\xF3n de Google Maps",
      "ja": "Google\u30DE\u30C3\u30D7\u306E\u30A2\u30C9\u30EC\u30B9\u304C\u8A18\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093",
      "ko": "Google \uC9C0\uB3C4 \uC8FC\uC18C\uAC00 \uAE30\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4",
      "ne": "\u0915\u0941\u0928\u0948 \u0920\u0947\u0917\u093E\u0928\u093E \u0938\u0942\u091A\u0940\u092C\u0926\u094D\u0927 \u091B\u0948\u0928",
      "pt": "Nenhum endere\xE7o do Google Maps registrado",
      "zh": "TOWRITE"
    },
    "closed": "1970/1/1",
    "commitdate": "1970/1/1",
    "flag": Flags["Nepal"],
    "language.order": [
      "en",
      "ja"
    ],
    "latitude": "0.0000",
    "location": {
      "en": "No City, District, or State Info Listed",
      "es": "No Se Incluye Informaci\xF3n de Ciudad, Distrito o Estado",
      "ja": "\u5E02\u533A\u753A\u6751\u306E\u60C5\u5831\u304C\u8868\u793A\u3055\u308C\u3066\u3044\u306A\u3044",
      "ko": "\uB3C4\uC2DC, \uC9C0\uC5ED \uB610\uB294 \uC8FC \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      "ne": "\u0915\u0941\u0928\u0948 \u0938\u094D\u0925\u093E\u0928 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u091B\u0948\u0928",
      "pt": "Nenhuma informa\xE7\xE3o de cidade, distrito ou estado listada",
      "zh": "TOWRITE"
    },
    "longitude": "0.0000",
    "map": "https://maps.google.com/",
    "name": {
      "en": "Zoo Not Found",
      "es": "Zoo No Encontrado",
      "ja": "\u52D5\u7269\u5712\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093",
      "ko": "\uB3D9\uBB3C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
      "ne": "\u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928",
      "pt": "Zool\xF3gico n\xE3o encontrado",
      "zh": "TOWRITE"
    },
    "othernames": {
      "en": [
        "Zoo Not Found"
      ],
      "es": [
        "Zoo No Encontrado"
      ],
      "ja": [
        "\u52D5\u7269\u5712\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"
      ],
      "ko": [
        "\uB3D9\uBB3C\uC6D0\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4"
      ],
      "ne": [
        "\u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928"
      ],
      "pt": [
        "Zool\xF3gico n\xE3o encontrado"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    "photos": [],
    "type": "zoo",
    "video": "images/no-zoo.jpg",
    "website": "https://www.worldwildlife.org/"
  }
};
var Emoji = {
  "alert": "\u{1F6A8}",
  "animal": "\u{1F43C}",
  "alien": "\u{1F47D}",
  "apple": "\u{1F34E}",
  "arrow": "\u27A1",
  "author": "\u270D\uFE0F",
  "autumn": "\u{1F342}",
  "baby": "\u{1F476}\u{1F3FB}",
  "bamboo": "\u{1F38D}",
  "bed": "\u{1F6CC}",
  "bento": "\u{1F371}",
  "birthday": "\u{1F382}",
  "blink": "\u{1F611}",
  "born": "\u{1F47C}",
  "born_at": "\u{1F423}",
  "bowl": "\u{1F35C}",
  "boy": "\u{1F466}\u{1F3FB}",
  "bridge": "\u{1F309}",
  "brothers": "\u{1F466}\u{1F466}",
  "butterfly": "\u{1F98B}",
  "camera": "\u{1F4F7}",
  "camping": "\u{1F3D5}\uFE0F",
  "carry": "\u{1F361}",
  "cherry_blossom": "\u{1F338}",
  "caterpillar": "\u{1F41B}",
  "climb": "\u{1F9D7}",
  "closed": "\u{1F512}",
  "close_up": "\u{1F601}",
  "couple": "\u{1F491}",
  "cyclone": "\u{1F300}",
  "died": "\u{1F308}",
  "dig": "\u26CF\uFE0F",
  "dish": "\u{1F37D}\uFE0F",
  "door": "\u{1F6AA}",
  "ear": "\u{1F442}",
  "edit": "\u{1F4DD}",
  "eye": "\u{1F441}\uFE0F",
  "father": "\u{1F468}\u{1F3FB}",
  "female": "\u2640\uFE0F",
  "fireworks": "\u{1F386}",
  "flower": "\u{1F33C}",
  "football": "\u26BD",
  "gift": "\u{1F34E}",
  "giftwrap": "\u{1F381}",
  "girl": "\u{1F467}\u{1F3FB}",
  "globe_americas": "\u{1F30E}",
  "globe_asia": "\u{1F30F}",
  "grandpa": "\u{1F474}",
  "greens": "\u{1F33F}",
  "grumpy": "\u{1F620}",
  "hearts": "\u{1F495}",
  "home": "\u{1F3E1}",
  "itch": "\u{1F41C}",
  "jizo": "\u{1F5FF}",
  "kiss": "\u{1F48B}",
  "lightbulb": "\u{1F4A1}",
  "link": "\u{1F989}",
  "lips": "\u{1F444}",
  "logo": "\u{1F42F}\u{1F43B}",
  "male": "\u2642\uFE0F",
  "map": "\u{1F5FA}\uFE0F",
  "media": "\u{1F5BC}",
  "megagift": "\u{1F33F}\u{1F34E}",
  "money": "\u{1F4B8}",
  "monocle": "\u{1F9D0}",
  "moon": "\u{1F319}",
  "mother": "\u{1F469}\u{1F3FB}",
  "muzzle": "\u{1F434}",
  "nerd": "\u{1F913}",
  "no_emoji": "\u26AA",
  "no_more": "\u{1F6AB}",
  "nose": "\u{1F443}",
  "options": "\u2699\uFE0F",
  "paging": "\u23EC",
  "panda": "\u{1F43C}",
  "paws": "\u{1F43E}",
  "playing": "\u{1F0CF}",
  "poop": "\u{1F4A9}",
  "portrait": "\u{1F5BC}\uFE0F",
  "pray": "\u{1F64F}",
  "profile": "\u{1F49F}",
  "pumpkin": "\u{1F383}",
  "question": "\u2753",
  "range_current": "\u23F3",
  "range_previous": "\u231B",
  "random": "\u{1F3B2}",
  "raincloud": "\u{1F327}\uFE0F",
  "recordbook": "\u{1F4D6}",
  "refresh": "\u{1F504}",
  "reiwa": "\u{1F3F5}\uFE0F",
  "scale": "\u2696\uFE0F",
  "search": "\u{1F50D}",
  "see_and_say": "\u200D\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F",
  "shower": "\u{1F6BF}",
  "siblings": "\u{1F467}\u{1F466}",
  "sisters": "\u{1F467}\u{1F467}",
  "sleeping": "\u{1F634}",
  "slobber": "\u{1F924}",
  "smile": "\u{1F604}",
  "snake": "\u{1F40D}",
  "snow": "\u2744\uFE0F",
  "spider": "\u{1F577}",
  "star_dad": "\u{1F468}\u200D\u{1F3A4}",
  "star_mom": "\u{1F469}\u200D\u{1F3A4}",
  "star": "\u{1F31F}",
  "story": "\u{1F38D}",
  "target": "\u{1F3AF}",
  "teddybear": "\u{1F9F8}",
  "tooth": "\u{1F9B7}",
  "top": "\u2B06",
  "tongue": "\u{1F445}",
  "tornado": "\u{1F32A}\uFE0F",
  "travel": "\u2708\uFE0F",
  "treasure": "\u{1F48E}",
  "tree": "\u{1F333}",
  "truck": "\u{1F69A}",
  "upside_down": "\u{1F643}",
  "weary": "\u{1F629}",
  "website": "\u{1F310}",
  "weight": "\u{1F3CB}\uFE0F",
  "whiskers": "\u{1F42D}",
  "window": "\u{1F5BC}",
  "wink": "\u{1F609}",
  "wip": "\u{1F6A7}",
  "worry": "\u{1F622}",
  "yawn": "\u{1F62A}",
  "zoo": "\u{1F981}"
};
var Fallback = {
  "order": [
    "en",
    "ja"
  ]
};
var Gui = {
  "about": {
    "en": "About",
    "es": "Acerca\xA0de",
    "ja": "\u6982\u8981",
    "ko": "\uC18C\uAC1C",
    "ne": "\u092C\u093E\u0930\u0947\u092E\u093E",
    "pt": "Sobre",
    "zh": "\u5173\u4E8E"
  },
  "autumn": {
    "en": "Autumn",
    "es": "Oto\xF1o",
    "ja": "\u79CB",
    "ko": "\uAC00\uC744",
    "ne": "\u0936\u0930\u0926 \u0924\u0941",
    "pt": "Outono",
    "zh": "\u79CB"
  },
  "babies": {
    "en": "Babies",
    "es": "Beb\xE9s",
    "ja": "\u4E73\u5E7C\u5150",
    "ko": "\uC544\uAE30 \uB808\uC11C\uD310\uB2E4\uB4E4",
    "ne": "\u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941",
    "pt": "Beb\xEAs",
    "zh": "\u5A74\u513F"
  },
  "children": {
    "en": "Children",
    "es": "Ni\xF1os",
    "ja": Defaults.relations.children["ja"],
    "ko": "\uC0C8\uB07C \uB808\uC11C\uD310\uB2E4\uB4E4",
    "ne": "\u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941",
    "pt": "Filhos(as)",
    "zh": Defaults.relations.children["zh"]
  },
  "contribute": {
    "en": "Submit a Photo",
    "es": "Enviar una foto",
    "ja": "\u5199\u771F\u3092\u63D0\u51FA\u3059\u308B",
    "ko": "\uC0AC\uC9C4 \uC81C\uCD9C",
    "ne": "\u092B\u094B\u091F\u094B \u092A\u0947\u0936 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D",
    "pt": "Enviar uma foto",
    "zh": "\u4E0A\u4F20\u7167\u7247"
  },
  // Fallback to the English contribution page
  "contribute_link": {
    "en": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "es": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "ja": "https://docs.google.com/forms/d/1wEhwNieyonPNSk6q8fflUT3e4kyAsIlAFmeib1tW4Jk",
    "ko": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "ne": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "pt": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0",
    "zh": "https://docs.google.com/forms/d/1kKBv92o09wFIBFcvooYLm2cG8XksGcVQQSiu9SpHGf0"
  },
  "copied": {
    "en": "Copied QR code link",
    "es": "Enlace copiado",
    "ja": "\u30EA\u30F3\u30AF\u5148\u3092\u30B3\u30D4\u30FC",
    "ko": "QR \uCF54\uB4DC \uB9C1\uD06C \uBCF5\uC0AC",
    "ne": "QR \u0915\u094B\u0921 \u0932\u093F\u0919\u094D\u0915 \u092A\u094D\u0930\u0924\u093F\u0932\u093F\u092A\u093F \u0917\u0930\u093F\u092F\u094B",
    "pt": "Link copiado",
    "zh": "\u590D\u5236\u4E8C\u7EF4\u7801\u94FE\u63A5"
  },
  "fall": {
    "en": "Autumn",
    "es": "Oto\xF1o",
    "ja": "\u79CB",
    "ko": "\uAC00\uC744",
    "ne": "\u0936\u0930\u0926 \u0924\u0941",
    "pt": "Outono",
    "zh": "\u79CB"
  },
  "family": {
    "en": "Family",
    "es": "Familia",
    "ja": "\u30D5\u30A1\u30DF\u30EA",
    "ko": "\uAC00\uC871",
    "ne": "\u092A\u0930\u093F\u0935\u093E\u0930",
    "pt": "Fam\xEDlia",
    "zh": "\u5BB6\u65CF"
  },
  "father": {
    "en": "Father",
    "es": "Padre",
    "ja": "\u7236",
    "ko": "\uC544\uBE60",
    "ne": "\u092C\u0941\u092C\u093E",
    "pt": "Pai",
    "zh": "\u7236\u4EB2"
  },
  "flag": {
    "en": Flags["USA"],
    "es": Flags["Spain"],
    "ja": Flags["Japan"],
    "ko": Flags["South Korea"],
    "ne": Flags["Nepal"],
    "pt": Flags["Portugal"],
    "zh": Flags["China"]
  },
  "footerLink_rpf": {
    "en": "Red Panda Lineage",
    "es": "Red Panda Lineage",
    "ja": "Red Panda Lineage",
    "ko": "\uB808\uC11C\uD310\uB2E4\uC758 \uAC00\uACC4\uB3C4",
    "ne": "Red Panda Lineage",
    "pt": "Red Panda Lineage",
    "zh": "\u5C0F\u718A\u732B\u65CF\u8C31\u9879\u76EE"
  },
  "footerLink_rpn": {
    "en": "Red Panda Network",
    "es": "Red Panda Network",
    "ja": "Red Panda Network",
    "ko": "Red Panda Network",
    "ne": "Red Panda Network",
    "pt": "Red Panda Network",
    "zh": "Red Panda Network"
  },
  "footerLink_washimumu": {
    "en": "washimumu",
    "es": "washimumu",
    "ja": "washimumu",
    "ko": "washimumu",
    "ne": "washimumu",
    "pt": "washimumu",
    "zh": "washimumu"
  },
  "footerLink_wumpwoast": {
    "en": "wumpwoast",
    "es": "wumpwoast",
    "ja": "wumpwoast",
    "ko": "wumpwoast",
    "ne": "wumpwoast",
    "pt": "wumpwoast",
    "zh": "wumpwoast"
  },
  "home": {
    "en": "Home",
    "es": "Home",
    "ja": "\u30DB\u30FC\u30E0",
    "ko": "\uD648\uC73C\uB85C",
    "ne": "\u0939\u094B\u092E\u092A\u0947\u091C",
    "pt": "In\xEDcio",
    "zh": "\u4E3B\u9875"
  },
  "instagramLinks_body": {
    "en": "Without all the dedicated and loving Instagram red panda fans I know, this site would not exist. Thank you so much!",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "Sem todos os dedicados e ador\xE1veis f\xE3s de pandas-vermelhos do Instagram que conhe\xE7o, este site n\xE3o existiria. Agrade\xE7o muito!",
    "zh": ""
  },
  "instagramLinks_button": {
    "en": "Instagram",
    "es": "Instagram",
    "ja": "\u30A4\u30F3\u30B9\u30BF\u30B0\u30E9\u30E0",
    "ko": "\uC778\uC2A4\uD0C0\uADF8\uB7A8",
    "ne": "Instagram",
    "pt": "Instagram",
    "zh": "IG"
  },
  "instagramLinks_header": {
    "en": "Red Pandas on Instagram",
    "es": "Pandas rojos en Instagram",
    "ja": "Instagram \u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0",
    "ko": "\uC778\uC2A4\uD0C0\uADF8\uB7A8",
    "ne": "Instagram \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E",
    "pt": "Pandas-vermelhos no Instagram",
    "zh": "Instagram \u5C0F\u718A\u732B"
  },
  "loading": {
    "en": "Loading...",
    "es": "Cargando",
    "ja": "\u30ED\u30FC\u30C7\u30A3\u30F3\u30B0",
    "ko": "\uB85C\uB529 \uC911...",
    "ne": "\u0932\u094B\u0921",
    "pt": "Carregando...",
    "zh": "\u52A0\u8F7D\u4E2D..."
  },
  "litter": {
    "en": "Litter",
    "es": "Camada",
    "ja": Defaults.relations.litter["ja"],
    "ko": "\uC30D\uB465\uC774",
    "ne": "\u0930\u094B\u091F\u0940",
    "pt": "Ninhada",
    "zh": Defaults.relations.litter["zh"]
  },
  "links": {
    "en": "Links",
    "es": "Enlaces",
    "ja": "\u30EA\u30F3\u30AF",
    "ko": "\uB9C1\uD06C",
    "ne": "\u0932\u093F\u0902\u0915",
    "pt": "Links",
    "zh": "\u94FE\u63A5"
  },
  "me": {
    "en": "Me",
    "es": "Me",
    "ja": "\u79C1",
    "ko": "\uB098",
    "ne": "\u092E",
    "pt": "Eu",
    "zh": "\u6211"
  },
  "media": {
    "en": "Media",
    "es": "Imagenes",
    "ja": "\u30E1\u30C7\u30A3\u30A2",
    "ko": "\uBBF8\uB514\uC5B4",
    "ne": "\u092E\u093F\u0921\u093F\u092F\u093E",
    "pt": "Imagens",
    "zh": "\u5A92\u4F53"
  },
  "mother": {
    "en": "Mother",
    "es": "Madre",
    "ja": "\u6BCD",
    "ko": "\uC5C4\uB9C8",
    "ne": "\u0906\u092E\u093E",
    "pt": "M\xE3e",
    "zh": "\u6BCD\u4EB2"
  },
  "nicknames": {
    "en": "Nicknames",
    "es": "Apodos",
    "ja": "\u30CB\u30C3\u30AF\u30CD\u30FC\u30E0",
    "ko": "\uBCC4\uBA85",
    "ne": "\u0909\u092A\u0928\u093E\u092E\u0939\u0930\u0942",
    "pt": "Apelidos",
    "zh": "\u6635\u79F0"
  },
  "options": {
    "en": "Options",
    "es": "Opciones",
    "ja": "\u30AA\u30D7\u30B7\u30E7\u30F3",
    "ko": "\uC635\uC158",
    "ne": "\u0935\u093F\u0915\u0932\u094D\u092A\u0939\u0930\u0942",
    "pt": "Op\xE7\xF5es",
    "zh": "\u9009\u9879"
  },
  "opt_hide_dead_pandas": {
    "en": "Hide panda memorials",
    "es": "Ocultar monumentos conmemorativos de pandas",
    "ja": "\u30D1\u30F3\u30C0\u8A18\u5FF5\u7891\u3092\u96A0\u3059",
    "ko": "\uD310\uB2E4 \uCD94\uBAA8 \uAC8C\uC2DC\uBB3C \uC228\uAE30\uAE30",
    "ne": "\u092A\u093E\u0902\u0921\u093E \u0938\u094D\u092E\u093E\u0930\u0915\u0939\u0930\u0942 \u0932\u0941\u0915\u093E\u0909\u0928\u0941\u0939\u094B\u0938\u094D",
    "pt": "Ocultar memoriais do panda",
    "zh": "\u9690\u85CF\u718A\u732B\u7EAA\u5FF5\u9986"
  },
  "othernames": {
    "en": "Other Names",
    "es": "Otros nombres",
    "ja": "\u4ED6\u306E\u540D\u524D",
    "ko": "\uB2E4\uB978 \uC774\uB984",
    "ne": "\u0905\u0930\u0941 \u0928\u093E\u092E\u0939\u0930\u0941",
    "pt": "Outros nomes",
    "zh": "\u5176\u4ED6\u540D\u79F0"
  },
  "paging": {
    "en": "More",
    "es": "Ver M\xE1s",
    "ja": "\u3082\u3063\u3068",
    "ko": "\uB354 \uBCF4\uAE30",
    "ne": "\u0905\u0927\u093F\u0915",
    "pt": "Mais",
    "zh": "\u66F4\u591A"
  },
  "parents": {
    "en": "Parents",
    "es": "Padres",
    "ja": Defaults.relations.parents["ja"],
    "ko": "\uBD80\uBAA8",
    "ne": "\u0905\u092D\u093F\u092D\u093E\u0935\u0915",
    "pt": "Pais",
    "zh": Defaults.relations.parents["zh"]
  },
  "profile": {
    "en": "Profile",
    "es": "Perfil",
    "ja": "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
    "ko": "\uD504\uB85C\uD544",
    "ne": "\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932",
    "pt": "Perfil",
    "zh": "\u6863\u6848"
  },
  "quadruplet": {
    "en": "Quadruplet",
    "es": "Cuatrillizo",
    "ja": "\u56DB\u3064\u5B50",
    "ko": "\uC0AC\uCD0C",
    "ne": "\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932",
    "pt": "Quadrig\xEAmeos",
    "zh": "\u56DB\u80DE\u80CE"
  },
  "random": {
    "en": "Random",
    "es": "Aleatorio",
    "ja": "\u9069\u5F53",
    "ko": "\uB79C\uB364",
    "ne": "\u0905\u0928\u093F\u092F\u092E\u093F\u0924",
    "pt": "Aleat\xF3rio",
    "zh": "\u968F\u673A"
  },
  "redPandaCommunity_body": {
    "en": "",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "redPandaCommunity_button": {
    "en": "Community",
    "es": "Comunidad",
    "ja": "\u5171\u540C\u4F53",
    "ko": "\uCEE4\uBBA4\uB2C8\uD2F0",
    "ne": "\u0938\u092E\u0941\u0926\u093E\u092F",
    "pt": "Comunidade",
    "zh": "\u793E\u533A"
  },
  "redPandaCommunity_header": {
    "en": "Red Panda Community",
    "es": "Comunidad del Panda Rojo",
    "ja": "\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0\u306E\u5171\u540C\u4F53",
    "ko": "\uB808\uC11C\uD310\uB2E4 \uCEE4\uBBA4\uB2C8\uD2F0",
    "ne": "\u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u0938\u092E\u0941\u0926\u093E\u092F",
    "pt": "Comunidade do Panda-Vermelho",
    "zh": "\u5C0F\u718A\u732B\u793E\u533A"
  },
  "refresh": {
    "en": "Refresh",
    "es": "Refrescar",
    "ja": "\u30EA\u30ED\u30FC\u30C9",
    "ko": "\uC0C8\uB85C\uACE0\uCE68",
    "ne": "\u0924\u093E\u091C\u093E \u0917\u0930\u094D\u0928\u0941",
    "pt": "Atualizar",
    "zh": "\u5237\u65B0"
  },
  "search": {
    "en": "Search...",
    "es": "Buscar...",
    "ja": "\u30B5\u30FC\u30C1...",
    "ko": "\uAC80\uC0C9...",
    "ne": "\u0916\u094B\u091C\u094D\u0928\u0941",
    "pt": "Pesquisar...",
    "zh": "\u641C\u7D22..."
  },
  "seen_date": {
    "en": "Seen <INSERTDATE>",
    "es": "Visto <INSERTDATE>",
    "ja": "TOWRITE <INSERTDATE>",
    "ko": "\uBCF8 \uB0A0 <INSERTDATE>",
    "ne": "TOWRITE <INSERTDATE>",
    "pt": "Visto em <INSERTDATE>",
    "zh": "\u76EE\u51FB\u65E5\u671F <INSERTDATE>"
  },
  "siblings": {
    "en": "Siblings",
    "es": "Hermanos",
    "ja": Defaults.relations.siblings["ja"],
    "ko": "\uD615\uC81C\xB7\uC790\uB9E4",
    "ne": "\u092D\u093E\u0907\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942",
    "pt": "Irm\xE3o(\xE3s)",
    "zh": Defaults.relations.siblings["zh"]
  },
  "since_date": {
    "en": "Since <INSERTDATE>",
    "es": "Ya que <INSERTDATE>",
    "ja": "<INSERTDATE>\u304B\u3089",
    "ko": "<INSERTDATE>\uBD80\uD130",
    "ne": "<INSERTDATE>\u0926\u0947\u0916\u093F",
    "pt": "Desde <INSERTDATE>",
    "zh": "\u81EA <INSERTDATE>"
  },
  "specialThanksLinks_body": {
    "en": "",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "specialThanksLinks_button": {
    "en": "Special Thanks",
    "es": "Agradecimientos",
    "ja": "\u611F\u4F69",
    "ko": "Special Thanks",
    "ne": "\u0935\u093F\u0936\u0947\u0937 \u0927\u0928\u094D\u092F\u0935\u093E\u0926",
    "pt": "Agradecimentos",
    "zh": "\u9E23\u8C22"
  },
  "specialThanksLinks_header": {
    "en": "Special Thanks",
    "es": "Agradecimientos Especiales",
    "ja": "\u611F\u4F69",
    "ko": "Special Thanks",
    "ne": "\u0935\u093F\u0936\u0947\u0937 \u0927\u0928\u094D\u092F\u0935\u093E\u0926",
    "pt": "Agradecimentos Especiais",
    "zh": "\u9E23\u8C22"
  },
  "spring": {
    "en": "Spring",
    "es": "Primavera",
    "ja": "\u6625",
    "ko": "\uBD04",
    "ne": "\u0935\u0938\u0928\u094D\u0924",
    "pt": "Primavera",
    "zh": "\u6625"
  },
  "summer": {
    "en": "Summer",
    "es": "Verano",
    "ja": "\u590F",
    "ko": "\uC5EC\uB984",
    "ne": "\u0917\u0930\u094D\u092E\u0940",
    "pt": "Ver\xE3o",
    "zh": "\u590F"
  },
  "title": {
    "en": "Red Panda Finder",
    "es": "Buscador de Panda Rojo",
    "ja": "\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0\u306E\u30D5\u30A1\u30A4\u30F3\u30C0\u30FC",
    "ko": "\uB808\uC11C\uD310\uB2E4 \uCC3E\uAE30",
    "ne": "\u0928\u093F\u0917\u0932\u094D\u092F\u093E \u092A\u094B\u0928\u093F\u092F\u093E \u092E\u093F\u0924\u094D\u0930",
    "pt": "Buscador de Pandas-Vermelhos",
    "zh": "\u67E5\u627E\u5C0F\u718A\u732B"
  },
  "top": {
    "en": "Top",
    "es": "Arriba",
    "ja": "\u4E0A",
    "ko": "\uC704\uB85C",
    "ne": "\u092E\u093E\u0925\u093F",
    "pt": "Para\xA0cima",
    "zh": "\u9876\u90E8"
  },
  "tree": {
    "en": "Tree",
    "es": "\xC1rbol",
    "ja": "\u6728",
    "ko": "\uB098\uBB34",
    "ne": "\u0930\u0942\u0916",
    "pt": "\xC1rvore",
    "zh": "\u6811"
  },
  "twin": {
    "en": "Twin",
    "es": "Mellizo",
    "ja": "\u53CC\u5B50",
    "ko": "\uC30D\uB465\uC774",
    "ne": "\u091C\u0941\u092E\u094D\u0932\u094D\u092F\u093E\u0939\u093E",
    "pt": "G\xEAmeo",
    "zh": "\u53CC\u80DE\u80CE"
  },
  "triplet": {
    "en": "Triplet",
    "es": "Trillizo",
    "ja": "\u4E09\u3064\u5B50",
    "ko": "\uC0BC\uB465\uC774",
    "ne": "\u0924\u0940\u0928\u0935\u091F\u093E",
    "pt": "Trig\xEAmeo",
    "zh": "\u4E09\u80DE\u80CE"
  },
  "winter": {
    "en": "Winter",
    "es": "Invierno",
    "ja": "\u51AC",
    "ko": "\uACA8\uC6B8",
    "ne": "\u091C\u093E\u0921\u094B",
    "pt": "Inverno",
    "zh": "\u51AC"
  },
  "zooLinks_body": {
    "en": "While many zoos are represented in this dataset, some of them are hotspots for seeing Red Pandas.",
    "es": "",
    "ja": "",
    "ko": "",
    "ne": "",
    "pt": "",
    "zh": ""
  },
  "zooLinks_button": {
    "en": "Zoos",
    "es": "Zool\xF3gicos",
    "ja": "\u52D5\u7269\u5712",
    "ko": "\uB3D9\uBB3C\uC6D0",
    "ne": "\u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E",
    "pt": "Zool\xF3gicos",
    "zh": "\u52A8\u7269\u56ED"
  },
  "zooLinks_header": {
    "en": "Major Red Panda Zoos",
    "es": "Principales Zool\xF3gicos de Pandas Rojos",
    "ja": "\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0\u306E\u52D5\u7269\u5712",
    "ko": "\uB808\uC11C\uD310\uB2E4\uC758 \uC8FC\uC694 \uB3D9\uBB3C\uC6D0",
    "ne": "\u092A\u094D\u0930\u092E\u0941\u0916 \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E",
    "pt": "Principais zool\xF3gicos com pandas-vermelhos",
    "zh": "\u5C0F\u718A\u732B\u52A8\u7269\u56ED"
  }
};
var LangNames = {
  "en": {
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "ko": "Korean",
    "fr": "French",
    "ja": "Japanese",
    "ne": "Nepalese",
    "pl": "Polish",
    "pt": "Portuguese",
    "ru": "Russian",
    "sv": "Swedish",
    "zh": "Chinese"
  },
  "es": {
    "de": "Alem\xE1n",
    "en": "Ingles",
    "es": "Espa\xF1ol",
    "fr": "Franc\xE9s",
    "ja": "Japon\xE9s",
    "ko": "Coreano",
    "ne": "Nepal\xE9s",
    "pl": "Polaco",
    "pt": "Portugu\xE9s",
    "ru": "Ruso",
    "sv": "Sueco",
    "zh": "Chino"
  },
  "ja": {
    "de": "\u30C9\u30A4\u30C4\u8A9E",
    "en": "\u82F1\u8A9E",
    "es": "\u30B9\u30DA\u30A4\u30F3\u8A9E",
    "fr": "\u30D5\u30E9\u30F3\u30B9\u8A9E",
    "ja": "\u65E5\u672C\u8A9E",
    "ko": "\u97D3\u56FD\u8A9E",
    "ne": "\u30CD\u30D1\u30FC\u30EB\u8A9E",
    "pl": "\u30DD\u30FC\u30E9\u30F3\u30C9\u8A9E",
    "pt": "\u30DD\u30EB\u30C8\u30AC\u30EB\u8A9E",
    "ru": "\u30ED\u30B7\u30A2\u8A9E",
    "sv": "\u30B9\u30A6\u30A7\u30FC\u30C7\u30F3",
    "zh": "\u4E2D\u56FD\u8A9E"
  },
  "ko": {
    "de": "\uB3C5\uC77C\uC5B4",
    "en": "\uC601\uC5B4",
    "es": "\uC2A4\uD398\uC778\uC5B4",
    "fr": "\uD504\uB791\uC2A4\uC5B4",
    "ja": "\uC77C\uBCF8\uC5B4",
    "ko": "\uD55C\uAD6D\uC5B4",
    "ne": "\uB124\uD314\uC5B4",
    "pl": "\uD3F4\uB780\uB4DC\uC5B4",
    "pt": "\uD3EC\uB974\uD22C\uAC08\uC5B4",
    "ru": "\uB7EC\uC2DC\uC544\uC5B4",
    "sv": "\uC2A4\uC6E8\uB374",
    "zh": "\uC911\uAD6D\uC5B4"
  },
  "ne": {
    "de": "\u091C\u0930\u094D\u092E\u0928",
    "en": "\u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940",
    "es": "\u0938\u094D\u092A\u0928\u093F\u0936",
    "fr": "\u092B\u094D\u0930\u0947\u0928\u094D\u091A",
    "ja": "\u091C\u093E\u092A\u093E\u0928\u0940",
    "ko": "\u0915\u094B\u0930\u093F\u092F\u0928",
    "ne": "\u0928\u0947\u092A\u093E\u0932\u0940",
    "pl": "\u092A\u094B\u0932\u093F\u0936",
    "pt": "\u092A\u094B\u0930\u094D\u0924\u0941\u0917\u093E\u0932\u0940",
    "ru": "\u0930\u0938\u093F\u092F\u0928",
    "sv": "\u0938\u094D\u0935\u0940\u0921\u093F\u0936",
    "zh": "\u091A\u093F\u0928\u093F\u092F\u093E\u0901"
  },
  "pt": {
    "de": "Alem\xE3o",
    "en": "Ingl\xEAs",
    "es": "Espanhol",
    "fr": "Franc\xEAs",
    "ja": "Japon\xEAs",
    "ko": "Coreano",
    "ne": "Nepal\xEAs",
    "pl": "Polon\xEAs",
    "pt": "Portugu\xEAs",
    "ru": "Russo",
    "sv": "Sueco",
    "zh": "Chin\xEAs"
  },
  "ru": {
    "de": "\u043D\u0435\u043C\u0435\u0446\u043A\u0438\u0439",
    "en": "\u0430\u043D\u0433\u043B\u0438\u0439\u0441\u043A\u0438\u0439",
    "es": "\u0438\u0441\u043F\u0430\u043D\u0441\u043A\u0438\u0439",
    "fr": "\u0444\u0440\u0430\u043D\u0446\u0443\u0437\u043A\u0438\u0439",
    "ja": "\u044F\u043F\u043E\u043D\u0441\u043A\u0438\u0439",
    "ko": "\u043A\u043E\u0440\u0435\u0439\u0441\u043A\u0438\u0439",
    "ne": "\u043D\u0435\u043F\u0430\u043B\u044C\u0441\u043A\u0438\u0439",
    "pl": "\u043F\u043E\u043B\u044C\u0441\u043A\u0438\u0439",
    "pt": "\u043F\u043E\u0440\u0442\u0443\u0433\u0430\u0301\u043B\u044C\u0441\u043A\u0438\u0439",
    "ru": "\u0440\u0443\u0441\u0441\u043A\u0438\u0439",
    "sv": "\u0448\u0432\u0435\u0434\u0441\u043A\u0438\u0439",
    "zh": "\u043A\u0438\u0442\u0430\u0439\u0441\u043A\u0438\u0439"
  },
  "sv": {
    "de": "Tyska",
    "en": "Engelska",
    "es": "Spanska",
    "fr": "Franska",
    "ja": "Japanska",
    "ko": "Koreanska",
    "ne": "Nepali",
    "pl": "Polska",
    "pt": "Portugisiska",
    "ru": "Ryska",
    "sv": "Svenska",
    "zh": "Kinesiskt"
  },
  "zh": {
    "de": "\u5FB7\u8BED",
    "en": "\u82F1\u8BED",
    "es": "\u897F\u73ED\u7259\u8BED",
    "fr": "\u6CD5\u8BED",
    "ja": "\u65E5\u8BED",
    "ko": "\u671D\u9BAE\u8BED",
    "ne": "\u5C3C\u6CCA\u5C14\u8BED",
    "pl": "\u6CE2\u5170\u8BED",
    "pt": "\u8461\u8404\u7259\u8BED",
    "ru": "\u4FC4\u8BED",
    "sv": "\u745E\u5178",
    "zh": "\u6C49\u8BED"
  }
};
var Polyglots = {
  "baby": {
    "emoji": [
      Emoji.baby
    ],
    "en": [
      "baby",
      "babies",
      "Baby",
      "Aka-chan",
      "Akachan"
    ],
    "es": [
      "beb\xE9",
      "bebe",
      "beb\xE9s",
      "bebes"
    ],
    "ja": [
      "\u8D64",
      "\u8D64\u3061\u3083\u3093"
    ],
    "ko": [
      "\uC544\uAE30"
    ],
    "ne": [
      "\u092C\u091A\u094D\u091A\u093E"
    ],
    "pt": [
      "beb\xEA",
      "beb\xEAs",
      "beb\xE9",
      "beb\xE9s"
    ],
    "zh": [
      "\u5B9D\u5B9D",
      "\u5A74\u513F",
      "\u5A74\u513F\u4EEC"
    ]
  }
};
var Tags = {
  "air tasting": {
    "emoji": [
      Emoji.tongue + Emoji.butterfly
    ],
    "en": [
      "air tasting",
      "air taste"
    ],
    "es": [
      "saboreando el aire"
    ],
    "ja": [
      "\u820C\u30D2\u30E9\u30D2\u30E9"
    ],
    "ko": [
      "\uACF5\uAE30 \uB9DB\uBCF4\uAE30"
    ],
    "ne": [
      "\u0939\u093E\u0935\u093E \u091A\u093E\u0916\u094D\u0928\u0947"
    ],
    "pt": [
      "degustando o ar",
      "gosto do ar"
    ],
    "zh": [
      "\u5C1D\u5C1D\u7A7A\u6C14"
    ]
  },
  "apple time": {
    "emoji": [
      Emoji.apple
    ],
    "en": [
      "apple time",
      "apple"
    ],
    "es": [
      "hora de la manazana",
      "manzana"
    ],
    "ja": [
      "\u308A\u3093\u3054\u30BF\u30A4\u30E0",
      "\u308A\u3093\u3054"
    ],
    "ko": [
      "\uC0AC\uACFC \uB0E0\uB0E0",
      "\uC0AC\uACFC"
    ],
    "ne": [
      "\u0938\u094D\u092F\u093E\u0909 \u0938\u092E\u092F",
      "\u0938\u094D\u092F\u093E\u0909"
    ],
    "pt": [
      "ma\xE7\xE3",
      "hora da ma\xE7\xE3"
    ],
    "zh": [
      "\u82F9\u679C\u65F6\u95F4",
      "\u82F9\u679C"
    ]
  },
  "autumn": {
    "emoji": [
      Emoji.autumn
    ],
    "en": [
      "autumn",
      "fall"
    ],
    "es": [
      "oto\xF1o"
    ],
    "ja": [
      "\u79CB"
    ],
    "ko": [
      "\uAC00\uC744"
    ],
    "ne": [
      "\u0936\u0930\u0926 \u0924\u0941"
    ],
    "pt": [
      "outono"
    ],
    "zh": [
      "\u79CB\u5929"
    ]
  },
  "bamboo": {
    "emoji": [
      Emoji.bamboo
    ],
    "en": [
      "bamboo"
    ],
    "es": [
      "bamb\xFA",
      "bambu"
    ],
    "ja": [
      "\u7B39",
      "\u7AF9"
    ],
    "ko": [
      "\uB300\uB098\uBB34",
      "\uB300\uB098\uBB34"
    ],
    "ne": [
      "\u092C\u093E\u0901\u0938"
    ],
    "pt": [
      "bambu"
    ],
    "zh": [
      "\u7AF9\u5B50",
      "\u7AF9"
    ]
  },
  "bear worm": {
    "emoji": [
      Emoji.caterpillar
    ],
    "en": [
      "bear worm",
      "bear-worm"
    ],
    "es": [
      "gusan-oso",
      "gusanoso"
    ],
    "ja": [
      "\u306E\u3073\u306E\u3073"
    ],
    "ko": [
      "\uCCA0\uD478\uB355"
    ],
    "ne": [
      "\u0915\u0940\u0930\u093E \u092D\u093E\u0932\u0941"
    ],
    "pt": [
      "relaxado"
    ],
    "zh": [
      "\u8815\u52A8"
    ]
  },
  "bite": {
    "emoji": [
      Emoji.tooth
    ],
    "en": [
      "bite"
    ],
    "es": [
      "morder"
    ],
    "ja": [
      "\u4E00\u53E3"
    ],
    "ko": [
      "\uAE68\uBB3C\uAE30"
    ],
    "ne": [
      "\u0915\u093E\u091F\u094D\u0928\u0941"
    ],
    "pt": [
      "mordida"
    ],
    "zh": [
      "\u54AC",
      "\u5403"
    ]
  },
  "blink": {
    "emoji": [
      Emoji.blink
    ],
    "en": [
      "blink",
      "blinking"
    ],
    "es": [
      "parpadear",
      "parpadeo"
    ],
    "ja": [
      "\u307E\u3070\u305F\u304D"
    ],
    "ko": [
      "\uB208 \uAE5C\uBE61\uC784"
    ],
    "ne": [
      "\u091D\u093F\u092E\u094D\u0915\u093E\u0907"
    ],
    "pt": [
      "pestanejando",
      "pestanejo"
    ],
    "zh": [
      "\u7728\u773C"
    ]
  },
  "bridge": {
    "emoji": [
      Emoji.bridge
    ],
    "en": [
      "bridge"
    ],
    "es": [
      "puente"
    ],
    "ja": [
      "\u540A\u308A\u6A4B\u30FB\u6E21\u3057\u6728",
      "\u67B6\u3051\u6A4B"
    ],
    "ko": [
      "\uB2E4\uB9AC"
    ],
    "ne": [
      "\u092A\u0941\u0932"
    ],
    "pt": [
      "ponte"
    ],
    "zh": [
      "\u540A\u6865",
      "\u6865"
    ]
  },
  "brothers": {
    "emoji": [
      Emoji.brothers
    ],
    "en": [
      "brothers",
      "bros"
    ],
    "es": [
      "hermanos"
    ],
    "ja": [
      "\u7537\u5144\u5F1F"
    ],
    "ko": [
      "\uD615\uC81C"
    ],
    "ne": [
      "\u092D\u093E\u0907\u0939\u0930\u0941"
    ],
    "pt": [
      "irm\xE3os"
    ],
    "zh": [
      "\u5144\u5F1F"
    ]
  },
  "carry": {
    "emoji": [
      Emoji.carry
    ],
    "en": [
      "carry",
      "holding"
    ],
    "es": [
      "llevando",
      "sosteniendo"
    ],
    "ja": [
      "\u7B39\u904B\u3073",
      "\u679D\u904B\u3073",
      "\u904B\u3076"
    ],
    "ko": [
      "\uBC30\uC1A1"
    ],
    "ne": [
      "\u092C\u094B\u0915\u094D\u0928\u0941",
      "\u0938\u092E\u093E\u0924\u094D\u0928\u0941"
    ],
    "pt": [
      "levando",
      "carregando",
      "segurando"
    ],
    "zh": [
      "\u8FD0",
      "\u62FF"
    ]
  },
  "cherry blossoms": {
    "emoji": [
      Emoji.cherry_blossom
    ],
    "en": [
      "cherry blossoms",
      "cherry blossom"
    ],
    "es": [
      "flor de cerezo",
      "flores de cerezo"
    ],
    "ja": [
      "\u685C"
    ],
    "ko": [
      "\uBC9A\uAF43"
    ],
    "ne": [
      "\u091A\u0947\u0930\u0940 \u0916\u093F\u0932"
    ],
    "pt": [
      "flor de cerejeira",
      "flores de cerejeira",
      "flor de cereja",
      "flores de cereja"
    ],
    "zh": [
      "\u6A31\u82B1"
    ]
  },
  "climb": {
    "emoji": [
      Emoji.climb
    ],
    "en": [
      "climb",
      "climbing"
    ],
    "es": [
      "trepando",
      "escalando"
    ],
    "ja": [
      "\u6728\u767B\u308A",
      "\u767B\u308B"
    ],
    "ko": [
      "\uB4F1\uC0B0"
    ],
    "ne": [
      "\u091A\u0922\u093E\u0908"
    ],
    "pt": [
      "escalando",
      "subindo"
    ],
    "zh": [
      "\u722C"
    ]
  },
  "close-up": {
    "emoji": [
      Emoji.close_up
    ],
    "en": [
      "close-up",
      "closeup",
      "close"
    ],
    "es": [
      "de cerca",
      "cerca"
    ],
    "ja": [
      "\u9589\u3058\u308B"
    ],
    "ko": [
      "\uAC00\uAE4C\uC774 \uBCF4\uAE30"
    ],
    "ne": [
      "\u0915\u094D\u0932\u094B\u091C-\u0905\u092A",
      "\u0928\u091C\u093F\u0915"
    ],
    "pt": [
      "fechar-se",
      "perto"
    ],
    "zh": [
      "\u7279\u5199"
    ]
  },
  "couple": {
    "emoji": [
      Emoji.couple
    ],
    "en": [
      "couple",
      "partners"
    ],
    "es": [
      "pareja"
    ],
    "ja": [
      "\u30AB\u30C3\u30D7\u30EB",
      "\u592B\u5A66",
      "\u3075\u3046\u3075"
    ],
    "ko": [
      "\uCEE4\uD50C",
      "\uBD80\uBD80"
    ],
    "ne": [
      "\u091C\u094B\u0921\u0940"
    ],
    "pt": [
      "casal",
      "par"
    ],
    "zh": [
      "\u592B\u5987",
      "\u60C5\u4FA3"
    ]
  },
  "destruction": {
    "emoji": [
      Emoji.tornado
    ],
    "en": [
      "chaos",
      "destruction",
      "mess"
    ],
    "es": [
      "caos",
      "destrucci\xF3n",
      "destruccion",
      "desorden"
    ],
    "ja": [
      "\u7834\u58CA"
    ],
    "ko": [
      "\uB09C\uC7A5\uD310",
      "\uC5C9\uB9DD\uC9C4\uCC3D"
    ],
    "ne": [
      "\u0935\u093F\u0928\u093E\u0936"
    ],
    "pt": [
      "caos",
      "destrui\xE7\xE3o",
      "bagun\xE7a"
    ],
    "zh": [
      "\u7834\u574F"
    ]
  },
  "dig": {
    "emoji": [
      Emoji.dig
    ],
    "en": [
      "dig",
      "digging",
      "digs"
    ],
    "es": [
      "cavando",
      "excavando"
    ],
    "ja": [
      "\u7A74\u6398\u308A"
    ],
    "ko": [
      "\uAD6C\uBA4D \uD30C\uAE30",
      "\uB545\uC744 \uD30C\uB2E4"
    ],
    "ne": [
      "\u0916\u0928\u094D\u0928\u0941\u0939\u094B\u0938\u094D"
    ],
    "pt": [
      "cavando",
      "escavando"
    ],
    "zh": [
      "\u6316"
    ]
  },
  "dish": {
    "emoji": [
      Emoji.dish
    ],
    "en": [
      "dish",
      "plate"
    ],
    "es": [
      "plato"
    ],
    "ja": [
      "\u3054\u306F\u3093"
    ],
    "ko": [
      "\uC811\uC2DC"
    ],
    "ne": [
      "\u0925\u093E\u0932"
    ],
    "pt": [
      "prato"
    ],
    "zh": [
      "\u76D8\u5B50"
    ]
  },
  "door": {
    "emoji": [
      Emoji.door
    ],
    "en": [
      "door"
    ],
    "es": [
      "puerta"
    ],
    "ja": [
      "\u6249",
      "\u6238"
    ],
    "ko": [
      "\uBB38"
    ],
    "ne": [
      "\u0922\u094B\u0915\u093E"
    ],
    "pt": [
      "porta"
    ],
    "zh": [
      "\u95E8"
    ]
  },
  "ear": {
    "emoji": [
      Emoji.ear
    ],
    "en": [
      "ear",
      "ears"
    ],
    "es": [
      "oreja",
      "orejas"
    ],
    "ja": [
      "\u8033"
    ],
    "ko": [
      "\uADC0"
    ],
    "ne": [
      "\u0915\u093E\u0928"
    ],
    "pt": [
      "orelha",
      "orelhas"
    ],
    "zh": [
      "\u8033"
    ]
  },
  "eye": {
    "emoji": [
      Emoji.eye
    ],
    "en": [
      "eye",
      "eyes"
    ],
    "es": [
      "ojo",
      "ojos"
    ],
    "ja": [
      "\u76EE"
    ],
    "ko": [
      "\uB208"
    ],
    "ne": [
      "\u0915\u093E\u0928"
    ],
    "pt": [
      "olho",
      "olhos"
    ],
    "zh": [
      "\u773C\u775B",
      "\u773C"
    ]
  },
  "flowers": {
    "emoji": [
      Emoji.flower
    ],
    "en": [
      "flower",
      "flowers"
    ],
    "es": [
      "flor",
      "flores"
    ],
    "ja": [
      "\u82B1"
    ],
    "ko": [
      "\uAF43"
    ],
    "ne": [
      "\u092B\u0942\u0932",
      "\u092B\u0942\u0932\u0939\u0930\u0942"
    ],
    "pt": [
      "flor",
      "flores"
    ],
    "zh": [
      "\u82B1"
    ]
  },
  "grooming": {
    "emoji": [
      Emoji.shower
    ],
    "en": [
      "groom",
      "grooming",
      "cleaning"
    ],
    "es": [
      "limpi\xE1ndose",
      "limpiandose",
      "lami\xE9ndose",
      "lamiendose",
      "lav\xE1ndose",
      "lavandose"
    ],
    "ja": [
      "\u6BDB\u3065\u304F\u308D\u3044"
    ],
    "ko": [
      "\uBAB8 \uB2E8\uC7A5"
    ],
    "ne": [
      "\u092B\u0942\u0932\u0939\u0930\u0942"
    ],
    "pt": [
      "limpando-se"
    ],
    "zh": [
      "\u68B3\u6BDB"
    ]
  },
  "grumpy": {
    "emoji": [
      Emoji.grumpy
    ],
    "en": [
      "grumpy",
      "grouchy"
    ],
    "es": [
      "gru\xF1ona",
      "gru\xF1\xF3n",
      "grunona",
      "grunon"
    ],
    "ja": [
      "\u3054\u6A5F\u5ACC\u30CA\u30CA\u30E1"
    ],
    "ko": [
      "\uC2EC\uC220\uAD82\uC740",
      "\uD22C\uB35C\uAC70\uB9AC\uB294",
      "\uAE30\uBD84\uC774 \uB098\uC05C"
    ],
    "ne": [
      "\u0928\u0930\u093E\u092E\u094D\u0930\u094B"
    ],
    "pt": [
      "rabugento",
      "mal-humorado"
    ],
    "zh": [
      "\u7262\u9A9A\u6EE1\u8179"
    ]
  },
  "hammock": {
    "emoji": [
      Emoji.camping
    ],
    "en": [
      "hammock"
    ],
    "es": [
      "hamaca"
    ],
    "ja": [
      "\u30CF\u30F3\u30E2\u30C3\u30AF"
    ],
    "ko": [
      "\uD574\uBA39",
      "\uADF8\uBB3C \uCE68\uB300"
    ],
    "ne": [
      "\u0939\u094D\u092F\u093E\u092E\u0949\u0915"
    ],
    "pt": [
      "rede de dormir"
    ],
    "zh": [
      "\u540A\u5E8A"
    ]
  },
  "home": {
    "emoji": [
      Emoji.home
    ],
    "en": [
      "home"
    ],
    "es": [
      "casa",
      "en casa"
    ],
    "ja": [
      "\u304A\u5BB6"
    ],
    "ko": [
      "\uC9D1"
    ],
    "ne": [
      "\u0918\u0930"
    ],
    "pt": [
      "casa",
      "lar"
    ],
    "zh": [
      "\u5BB6"
    ]
  },
  "in love": {
    "emoji": [
      Emoji.hearts
    ],
    "en": [
      "in love",
      "love"
    ],
    "es": [
      "enamorado"
    ],
    "ja": [
      "\u604B"
    ],
    "ko": [
      "\uC0AC\uB791"
    ],
    "ne": [
      "\u092E\u093E\u092F\u093E\u092E\u093E"
    ],
    "pt": [
      "amor",
      "apaixonado"
    ],
    "zh": [
      "\u70ED\u604B",
      "\u604B\u7231"
    ]
  },
  "itchy": {
    "emoji": [
      Emoji.itch
    ],
    "en": [
      "itchy",
      "scratchy"
    ],
    "es": [
      "rasc\xE1ndose",
      "rascandose"
    ],
    "ja": [
      "\u30AB\u30A4\u30AB\u30A4",
      "\u304B\u3086\u3044"
    ],
    "ko": [
      "\uAC00\uB824\uC6B4",
      "\uAE01\uAE30",
      "\uAC04\uC9C0\uB7EC\uC6B4"
    ],
    "ne": [
      "\u0916\u0941\u091C\u0932\u0940"
    ],
    "pt": [
      "coceira",
      "co\xE7ando"
    ],
    "zh": [
      "\u6320\u75D2",
      "\u6293\u75D2"
    ]
  },
  "jizo": {
    "emoji": [
      Emoji.jizo
    ],
    "en": [
      "jizo",
      "jizo statue",
      "statue"
    ],
    "es": [
      "estatua"
    ],
    "ja": [
      "\u304A\u5730\u8535\u3055\u3093"
    ],
    "ko": [
      "\uBD88\uC0C1"
    ],
    "ne": [
      "\u092E\u0942\u0930\u094D\u0924\u093F"
    ],
    "pt": [
      "posi\xE7\xE3o de est\xE1tua"
    ],
    "zh": [
      "\u5730\u85CF\u83E9\u8428"
    ]
  },
  "keeper": {
    "emoji": [
      Emoji.weary
    ],
    "en": [
      "keeper",
      "zookeeper"
    ],
    "es": [
      "cuidador",
      "cuidadora"
    ],
    "ja": [
      "\u98FC\u80B2\u54E1"
    ],
    "ko": [
      "\uC0AC\uC721\uC0AC",
      "\uB3D9\uBB3C\uC6D0 \uC0AC\uC721\uC0AC"
    ],
    "ne": [
      "\u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E"
    ],
    "pt": [
      "cuidador",
      "cuidadora"
    ],
    "zh": [
      "\u9972\u517B\u5458"
    ]
  },
  "kiss": {
    "emoji": [
      Emoji.kiss
    ],
    "en": [
      "kissing",
      "kiss"
    ],
    "es": [
      "beso",
      "besos"
    ],
    "ja": [
      "\u63A5\u543B",
      "\u305B\u3063\u3077\u3093",
      "\u30AD\u30B9"
    ],
    "ko": [
      "\uBF40\uBF40",
      "\uD0A4\uC2A4",
      "\uC785\uB9DE\uCDA4"
    ],
    "ne": [
      "\u091A\u0941\u092E\u094D\u092C\u0928"
    ],
    "pt": [
      "beijo",
      "beijos",
      "beijando"
    ],
    "zh": [
      "\u63A5\u543B",
      "\u4EB2\u4EB2",
      "\u543B"
    ]
  },
  "laying down": {
    "emoji": [
      Emoji.bed
    ],
    "en": [
      "lay down",
      "laying down"
    ],
    "es": [
      "acostado",
      "recostado"
    ],
    "ja": [
      "\u5BDD\u305D\u3079\u3063\u3066\u3044\u308B"
    ],
    "ko": [
      "\uB204\uC6CC \uC788\uAE30",
      "\uB215\uB2E4",
      "\uC26C\uAE30"
    ],
    "ne": [
      "\u0924\u0932 \u0930\u093E\u0916\u094D\u0928\u0941"
    ],
    "pt": [
      "deitado",
      "deitando-se"
    ],
    "zh": [
      "\u8EBA"
    ]
  },
  "lips": {
    "emoji": [
      Emoji.lips
    ],
    "en": [
      "lips"
    ],
    "es": [
      "labios"
    ],
    "ja": [
      "\u304F\u3061\u3073\u308B"
    ],
    "ko": [
      "\uC785\uC220"
    ],
    "ne": [
      "\u0913\u0920"
    ],
    "pt": [
      "l\xE1bios"
    ],
    "zh": [
      "\u5507"
    ]
  },
  "long-tongue": {
    "emoji": [
      Emoji.tongue + Emoji.tongue
    ],
    "en": [
      "long tongue",
      "long-tongue"
    ],
    "es": [
      "sacando la lengua"
    ],
    "ja": [
      "\u9577\u3044\u820C"
    ],
    "ko": [
      "\uAE34 \uD600"
    ],
    "ne": [
      "\u0932\u093E\u092E\u094B \u091C\u0940\u092D"
    ],
    "pt": [
      "mostrando a l\xEDngua"
    ],
    "zh": [
      "\u4F38\u957F\u820C\u5934"
    ]
  },
  "lunch time": {
    "emoji": [
      Emoji.bento
    ],
    "en": [
      "lunch time",
      "lunch"
    ],
    "es": [
      "hora de comer",
      "almuerzo"
    ],
    "ja": [
      "\u30E9\u30F3\u30C1\u306E\u6642\u9593"
    ],
    "ko": [
      "\uC810\uC2EC \uC2DC\uAC04"
    ],
    "ne": [
      "\u0916\u093E\u091C\u093E \u0938\u092E\u092F",
      "\u092D\u094B\u091C\u0928"
    ],
    "pt": [
      "almo\xE7o",
      "hora do almo\xE7o"
    ],
    "zh": [
      "\u5348\u9910\u65F6\u95F4"
    ]
  },
  "mofumofu": {
    "emoji": [
      Emoji.teddybear
    ],
    "en": [
      "mofumofu",
      "fluffy",
      "punchy"
    ],
    "es": [
      "rechoncho",
      "rechoncha",
      "esponjoso",
      "esponjosa"
    ],
    "ja": [
      "\u30E2\u30D5\u30E2\u30D5"
    ],
    "ko": [
      "\uD3EC\uADFC\uD3EC\uADFC",
      "\uBCF5\uC2AC\uBCF5\uC2AC",
      "\uBD80\uB4DC\uB7EC\uC6B4"
    ],
    "ne": [
      "\u0930\u092E\u093E\u0908\u0932\u094B"
    ],
    "pt": [
      "felpudo",
      "fofo",
      "gorducho",
      "rechonchudo"
    ],
    "zh": [
      "\u8F6F\u8F6F"
    ]
  },
  "muzzle": {
    "emoji": [
      Emoji.muzzle
    ],
    "en": [
      "muzzle",
      "snout"
    ],
    "es": [
      "hocico",
      "trompa"
    ],
    "ja": [
      "\u30DE\u30BA\u30EB"
    ],
    "ko": [
      "\uC8FC\uB465\uC774"
    ],
    "ne": [
      "\u0925\u0942\u0932\u0940",
      "\u0925\u094B\u0930\u0948"
    ],
    "pt": [
      "focinho"
    ],
    "zh": [
      "\u53E3\u9F3B\u5957"
    ]
  },
  "night": {
    "emoji": [
      Emoji.moon
    ],
    "en": [
      "night"
    ],
    "es": [
      "noche"
    ],
    "ja": [
      "\u591C"
    ],
    "ko": [
      "\uBC24"
    ],
    "ne": [
      "\u0930\u093E\u0924"
    ],
    "pt": [
      "noite"
    ],
    "zh": [
      "\u591C",
      "\u665A\u4E0A"
    ]
  },
  "nose": {
    "emoji": [
      Emoji.nose
    ],
    "en": [
      "nose",
      "snout"
    ],
    "es": [
      "nariz",
      "hocico"
    ],
    "ja": [
      "\u9F3B"
    ],
    "ko": [
      "\uCF54"
    ],
    "ne": [
      "\u0928\u093E\u0915"
    ],
    "pt": [
      "nariz"
    ],
    "zh": [
      "\u9F3B\u5B50"
    ]
  },
  "old": {
    "emoji": [
      Emoji.grandpa
    ],
    "en": [
      "old"
    ],
    "es": [
      "viejo",
      "vieja"
    ],
    "ja": [
      "\u30B7\u30CB\u30A2\u30D1\u30F3\u30C0\u3055\u3093",
      "\u5E74\u8001\u3044\u305F"
    ],
    "ko": [
      "\uB299\uC740",
      "\uB098\uC774 \uB4E0",
      "\uC5F0\uB85C\uD55C"
    ],
    "ne": [
      "\u092A\u0941\u0930\u093E\u0928\u094B"
    ],
    "pt": [
      "idoso",
      "idosa"
    ],
    "zh": [
      "\u8001\u4EBA"
    ]
  },
  "panda bowl": {
    "emoji": [
      Emoji.panda + Emoji.bowl
    ],
    "en": [
      "panda bowl",
      "bowl"
    ],
    "es": [
      "bola de panda",
      "bola"
    ],
    "ja": [
      "\u30A8\u30B5\u9262"
    ],
    "ko": [
      "\uBC25\uADF8\uB987"
    ],
    "ne": [
      "\u092A\u094B\u0928\u093F\u092F\u093E \u0915\u091F\u094B\u0930\u093E"
    ],
    "pt": [
      "tigela de panda",
      "tigela"
    ],
    "zh": [
      "\u7897"
    ]
  },
  "paws": {
    "emoji": [
      Emoji.paws
    ],
    "en": [
      "paws",
      "feet"
    ],
    "es": [
      "patas",
      "pies"
    ],
    "ja": [
      "\u8DB3"
    ],
    "ko": [
      "\uBC1C",
      "\uBC1C\uBC14\uB2E5"
    ],
    "ne": [
      "\u092A\u0928\u094D\u091C\u093E"
    ],
    "pt": [
      "patas",
      "p\xE9s"
    ],
    "zh": [
      "\u722A"
    ]
  },
  "peek": {
    "emoji": [
      Emoji.monocle
    ],
    "en": [
      "peek",
      "peeking"
    ],
    "es": [
      "ojeando",
      "mirando",
      "curioseando"
    ],
    "ja": [
      "\u30C1\u30E9\u898B"
    ],
    "ko": [
      "\uC5FF\uBCF4\uAE30",
      "\uC0B4\uC9DD \uBCF4\uAE30",
      "\uD6D4\uCCD0\uBCF4\uAE30"
    ],
    "ne": [
      "\u091D\u093F\u0915\u094D\u0928\u0941"
    ],
    "pt": [
      "espiando"
    ],
    "zh": [
      "\u5077\u7AA5"
    ]
  },
  "playing": {
    "emoji": [
      Emoji.playing
    ],
    "en": [
      "playing",
      "play"
    ],
    "es": [
      "jugando",
      "jugar"
    ],
    "ja": [
      "\u62DD\u307F\u98DF\u3044",
      "\u4E21\u624B\u98DF\u3044"
    ],
    "ko": [
      "\uB180\uAE30",
      "\uB180\uC774 \uC911",
      "\uC7A5\uB09C\uCE58\uAE30"
    ],
    "ne": [
      "\u0916\u0947\u0932\u093F\u0930\u0939\u0947\u0915\u094B",
      "\u0916\u0947\u0932\u094D\u0928\u0941"
    ],
    "pt": [
      "brincando"
    ],
    "zh": [
      "\u73A9\u800D"
    ]
  },
  "poop": {
    "emoji": [
      Emoji.poop
    ],
    "en": [
      "poop"
    ],
    "es": [
      "heces",
      "caca",
      "mierda"
    ],
    "ja": [
      Emoji.poop
    ],
    "ko": [
      "\uC751\uAC00"
    ],
    "ne": [
      Emoji.poop
    ],
    "pt": [
      "coc\xF4",
      "coc\xF3",
      "caca"
    ],
    "zh": [
      "\u4FBF\u4FBF"
    ]
  },
  "pooping": {
    "emoji": [
      Emoji.panda + Emoji.poop
    ],
    "en": [
      "pooping"
    ],
    "es": [
      "defecando",
      "haciendo caca",
      "cagando"
    ],
    "ja": [
      "\u{1F4A9}\u3057\u3066\u3044\u308B"
    ],
    "ko": [
      "\uC751\uAC00 \uC911"
    ],
    "ne": [
      Emoji.panda + Emoji.poop
    ],
    "pt": [
      "fazendo coc\xF4",
      "fazendo caca"
    ],
    "zh": [
      "\u4FBF\u4FBF"
    ]
  },
  "portrait": {
    "emoji": [
      Emoji.portrait
    ],
    "en": [
      "portrait",
      "square"
    ],
    "es": [
      "retrato",
      "cuadrada"
    ],
    "ja": [
      "\u9854\u5199\u771F"
    ],
    "ko": [
      "\uCD08\uC0C1\uD654"
    ],
    "ne": [
      "\u091A\u093F\u0924\u094D\u0930"
    ],
    "pt": [
      "retrato"
    ],
    "zh": [
      "\u8096\u50CF"
    ]
  },
  "praying": {
    "emoji": [
      Emoji.pray
    ],
    "en": [
      "praying",
      "pray"
    ],
    "es": [
      "rezando",
      "orando"
    ],
    "ja": [
      "\u304A\u7948\u308A\u3057\u3066\u3044\u308B"
    ],
    "ko": [
      "\uAE30\uB3C4\uD558\uAE30",
      "\uAE30\uB3C4 \uC911"
    ],
    "ne": [
      "\u092A\u094D\u0930\u093E\u0930\u094D\u0925\u0928\u093E \u0917\u0930\u094D\u0926\u0948",
      "\u092A\u094D\u0930\u093E\u0930\u094D\u0925\u0928\u093E"
    ],
    "pt": [
      "rezando",
      "orando",
      "m\xE3os postas"
    ],
    "zh": [
      "\u7948\u7977"
    ]
  },
  "profile": {
    "emoji": [
      Emoji.profile
    ],
    "en": [
      "profile"
    ],
    "es": [
      "perfil"
    ],
    "ja": [
      "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u753B\u50CF"
    ],
    "ko": [
      "\uD504\uB85C\uD544"
    ],
    "ne": [
      "\u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932"
    ],
    "pt": [
      "perfil"
    ],
    "zh": [
      "\u8D44\u6599"
    ]
  },
  "pull-up": {
    "emoji": [
      Emoji.weight
    ],
    "en": [
      "pull-up",
      "pull-ups",
      "pullup"
    ],
    "es": [
      "flexiones",
      "dominadas"
    ],
    "ja": [
      "\u9244\u68D2",
      "\u61F8\u5782"
    ],
    "ko": [
      "\uD131\uAC78\uC774"
    ],
    "ne": [
      "\u0924\u093E\u0928\u094D\u0928\u0941"
    ],
    "pt": [
      "flex\xF5es"
    ],
    "zh": [
      "\u5F15\u4F53\u5411\u4E0A"
    ]
  },
  "pumpkin": {
    "emoji": [
      Emoji.pumpkin
    ],
    "en": [
      "pumpkin",
      "halloween"
    ],
    "es": [
      "calabaza"
    ],
    "ja": [
      "\u304B\u307C\u3061\u3083",
      "\u5357\u74DC"
    ],
    "ko": [
      "\uD638\uBC15",
      "\uD560\uB85C\uC708"
    ],
    "ne": [
      "\u0915\u0926\u094D\u0926\u0942",
      "\u0939\u0947\u0932\u094B\u0935\u0940\u0928"
    ],
    "pt": [
      "ab\xF3bora"
    ],
    "zh": [
      "\u5357\u74DC"
    ]
  },
  "reiwa": {
    "emoji": [
      Emoji.reiwa
    ],
    "en": [
      "reiwa"
    ],
    "es": [
      "reiwa"
    ],
    "ja": [
      "\u4EE4\u548C"
    ],
    "ko": [
      "\uB808\uC774\uC640"
    ],
    "ne": [
      Emoji.reiwa
    ],
    "pt": [
      "reiwa"
    ],
    "zh": [
      "\u4EE4\u548C"
    ]
  },
  "sample": {
    "emoji": [
      Emoji.panda
    ],
    "en": [
      "sample"
    ],
    "es": [
      "muestra"
    ],
    "ja": [
      "\u898B\u672C",
      "\u8A66\u6599",
      "\u8A66\u4F9B\u54C1"
    ],
    "ko": [
      "\uC0D8\uD50C"
    ],
    "ne": [
      "\u0928\u092E\u0942\u0928\u093E"
    ],
    "pt": [
      "amostra"
    ],
    "zh": [
      "\u6837\u672C",
      "\u6837\u54C1",
      "\u6837"
    ]
  },
  "scale": {
    "emoji": [
      Emoji.scale
    ],
    "en": [
      "scale",
      "weigh-in",
      "weight"
    ],
    "es": [
      "balanza",
      "pesa"
    ],
    "ja": [
      "\u4F53\u91CD\u8A08",
      "\u305F\u3044\u3058\u3085\u3046\u3051\u3044"
    ],
    "ko": [
      "\uCCB4\uC911\uACC4",
      "\uC800\uC6B8"
    ],
    "ne": [
      "\u0938\u094D\u0915\u0947\u0932",
      "\u0924\u094C\u0932"
    ],
    "pt": [
      "balan\xE7a",
      "peso"
    ],
    "zh": [
      "\u6D4B\u4F53\u91CD"
    ]
  },
  "shake": {
    "emoji": [
      Emoji.cyclone
    ],
    "en": [
      "shake",
      "shaking"
    ],
    "es": [
      "sacudi\xE9ndose",
      "sacudiendose"
    ],
    "ja": [
      "\u30C9\u30EA\u30D1\u30F3",
      "\u30D6\u30EB\u30D6\u30EB",
      "\u3086\u3089\u3086\u3089"
    ],
    "ko": [
      "\uD754\uB4E4\uAE30",
      "\uD754\uB4E4\uB9BC",
      "\uB5A8\uB9BC"
    ],
    "ne": [
      "\u0939\u0932\u094D\u0932\u093E\u0909\u0928\u0941"
    ],
    "pt": [
      "sacudindo-se"
    ],
    "zh": [
      "\u6447\u6643"
    ]
  },
  "shedding": {
    "emoji": [
      Emoji.worry
    ],
    "en": [
      "shedding",
      "changing fur",
      "losing fur",
      "losing hair"
    ],
    "es": [
      "mudando",
      "mudando el pelo",
      "cambiando el pelo"
    ],
    "ja": [
      "\u63DB\u6BDB",
      "\u6CE3\u3044\u3066\u3044\u308B"
    ],
    "ko": [
      "\uD138\uAC08\uC774"
    ],
    "ne": [
      "\u0938\u0941\u0938\u094D\u0924"
    ],
    "pt": [
      "mudando o pelo",
      "perdendo pelo"
    ],
    "zh": [
      "\u6362\u6BDB"
    ]
  },
  "shoots": {
    "emoji": [
      Emoji.bamboo
    ],
    "en": [
      "shoots",
      "shoot"
    ],
    "es": [
      "brotes"
    ],
    "ja": [
      "\u7AF9\u306E\u5B50",
      "\u305F\u3051\u306E\u3053"
    ],
    "ko": [
      "\uC8FD\uC21C"
    ],
    "ne": [
      "\u092C\u093E\u0901\u0938 \u0915\u094B \u091F\u0941\u092A\u094D\u092A\u094B"
    ],
    "pt": [
      "brotos",
      "broto"
    ],
    "zh": [
      "\u7AF9\u7B0B"
    ]
  },
  "siblings": {
    "emoji": [
      Emoji.siblings
    ],
    "en": [
      "siblings"
    ],
    "es": [
      "hermanos"
    ],
    "ja": [
      "\u5144\u5F1F",
      "\u304D\u3087\u3046\u3060\u3044"
    ],
    "ko": [
      "\uD615\uC81C\xB7\uC790\uB9E4"
    ],
    "ne": [
      "\u092D\u093E\u0907\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942"
    ],
    "pt": [
      "irm\xE3os(\xE3s)"
    ],
    "zh": [
      "\u540C\u80DE"
    ]
  },
  "sisters": {
    "emoji": [
      Emoji.sisters
    ],
    "en": [
      "sisters"
    ],
    "es": [
      "hermanas"
    ],
    "ja": [
      "\u59C9\u59B9"
    ],
    "ko": [
      "\uC790\uB9E4"
    ],
    "ne": [
      "\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942"
    ],
    "pt": [
      "irm\xE3s"
    ],
    "zh": [
      "\u59D0\u59B9"
    ]
  },
  "sleeping": {
    "emoji": [
      Emoji.sleeping
    ],
    "en": [
      "sleeping",
      "sleep",
      "asleep"
    ],
    "es": [
      "durmiendo",
      "dormido",
      "dormida",
      "durmi\xE9ndose",
      "durmiendose",
      "dormir"
    ],
    "ja": [
      "\u5BDD\u3066\u3044\u308B"
    ],
    "ko": [
      "\uC7A0",
      "\uC7A0\uC790\uB294 \uC911",
      "\uC218\uBA74"
    ],
    "ne": [
      "\u0938\u0941\u0924\u094D\u0928\u0941",
      "\u0928\u093F\u0926\u094D\u0930\u093E"
    ],
    "pt": [
      "dormindo"
    ],
    "zh": [
      "\u7761\u89C9"
    ]
  },
  "slobber": {
    "emoji": [
      Emoji.slobber
    ],
    "en": [
      "slobber",
      "slobbering"
    ],
    "es": [
      "babe\xE1ndo",
      "babeando",
      "baba"
    ],
    "ja": [
      "\u3088\u3060\u308C\u3092\u305F\u3089\u3057\u3066\u3044\u308B"
    ],
    "ko": [
      "\uCE68 \uD758\uB9AC\uAE30",
      "\uCE68"
    ],
    "ne": [
      "\u0938\u094D\u0932\u094B\u092C\u0930"
    ],
    "pt": [
      "babando",
      "baba"
    ],
    "zh": [
      "\u53E3\u6C34",
      "\u6D41\u53E3\u6C34"
    ]
  },
  "smile": {
    "emoji": [
      Emoji.smile
    ],
    "en": [
      "smile",
      "smiling"
    ],
    "es": [
      "sonri\xE9ndo",
      "sonriendo",
      "sonre\xEDr",
      "sonreir",
      "sonriente",
      "sonrisa"
    ],
    "ja": [
      "\u30B9\u30DE\u30A4\u30EB"
    ],
    "ko": [
      "\uC6C3\uC74C",
      "\uC6C3\uB294 \uC911"
    ],
    "ne": [
      "\u0939\u093E\u0901\u0938\u094B"
    ],
    "pt": [
      "sorrindo",
      "sorriso",
      "sorridente"
    ],
    "zh": [
      "\u7B11",
      "\u5FAE\u7B11"
    ]
  },
  "snow": {
    "emoji": [
      Emoji.snow
    ],
    "en": [
      "snow"
    ],
    "es": [
      "nieve"
    ],
    "ja": [
      "\u96EA"
    ],
    "ko": [
      "\uB208"
    ],
    "ne": [
      "\u0939\u093F\u0909\u0901"
    ],
    "pt": [
      "neve"
    ],
    "zh": [
      "\u96EA"
    ]
  },
  "spider": {
    "emoji": [
      Emoji.spider
    ],
    "en": [
      "spider",
      "spider-bear",
      "spider bear"
    ],
    "es": [
      "ara\xF1a",
      "arana"
    ],
    "ja": [
      "\u30B9\u30D1\u30A4\u30C0\u30FC"
    ],
    "ko": [
      "\uAC70\uBBF8"
    ],
    "ne": [
      "\u092E\u093E\u0915\u0941\u0930\u094B",
      "\u092E\u093E\u0915\u0941\u0930\u094B \u092D\u093E\u0932\u0941"
    ],
    "pt": [
      "panda-aranha",
      "aranha"
    ],
    "zh": [
      "\u8718\u86DB"
    ]
  },
  "standing": {
    "emoji": [
      Emoji.no_emoji
    ],
    "en": [
      "standing",
      "stand"
    ],
    "es": [
      "de pie",
      "parado"
    ],
    "ja": [
      "\u7ACB\u3063\u3066\u3044\u308B"
    ],
    "ko": [
      "\uC11C\uB2E4"
    ],
    "ne": [
      "\u0916\u0921\u093E"
    ],
    "pt": [
      "de p\xE9",
      "em p\xE9"
    ],
    "zh": [
      "\u7AD9\u7ACB"
    ]
  },
  "stretching": {
    "emoji": [
      Emoji.no_emoji
    ],
    "en": [
      "stretching",
      "stretch"
    ],
    "es": [
      "estir\xE1ndose",
      "estirandose"
    ],
    "ja": [
      "\u30B9\u30C8\u30EC\u30C3\u30C1\u3057\u3066\u3044\u308B"
    ],
    "ko": [
      "\uC2A4\uD2B8\uB808\uCE6D"
    ],
    "ne": [
      "\u0924\u0928\u094D\u0928\u0941",
      "\u0924\u093E\u0928\u094D\u0928"
    ],
    "pt": [
      "espregui\xE7ando-se"
    ],
    "zh": [
      "\u62C9\u4F38"
    ]
  },
  "surprise": {
    "emoji": [
      Emoji.fireworks
    ],
    "en": [
      "surprise",
      "surprised"
    ],
    "es": [
      "sorpresa",
      "sorprendido",
      "sorprendida"
    ],
    "ja": [
      "\u3073\u3063\u304F\u308A"
    ],
    "ko": [
      "\uB180\uB77C\uC6C0"
    ],
    "ne": [
      "\u0905\u091A\u092E\u094D\u092E"
    ],
    "pt": [
      "surpreso",
      "surpresa",
      "surpreendido"
    ],
    "zh": [
      "\u60CA\u559C"
    ]
  },
  "tail": {
    "emoji": [
      Emoji.snake
    ],
    "en": [
      "tail"
    ],
    "es": [
      "cola"
    ],
    "ja": [
      "\u3057\u3063\u307D"
    ],
    "ko": [
      "\uAF2C\uB9AC"
    ],
    "ne": [
      "\u092A\u0941\u091A\u094D\u091B\u0930"
    ],
    "pt": [
      "cauda",
      "rabo"
    ],
    "zh": [
      "\u5C3E\u5DF4"
    ]
  },
  "techitechi": {
    "emoji": [
      Emoji.target
    ],
    "en": [
      "techitechi",
      "spot",
      "cute spot"
    ],
    "es": [
      "lunares",
      "lunar"
    ],
    "ja": [
      "\u30C6\u30C1\u30C6\u30C1"
    ],
    "ko": [
      "\uBAA9\uD45C"
    ],
    "ne": [
      "\u0930\u093E\u092E\u094D\u0930\u094B \u0938\u094D\u0925\u093E\u0928"
    ],
    "pt": [
      "pinta",
      "pintinha"
    ],
    "zh": [
      "\u76EE\u6807"
    ]
  },
  "tongue": {
    "emoji": [
      Emoji.tongue
    ],
    "en": [
      "tongue"
    ],
    "es": [
      "lengua"
    ],
    "ja": [
      "\u3079\u308D"
    ],
    "ko": [
      "\uD600"
    ],
    "ne": [
      "\u091C\u093F\u092C\u094D\u0930\u094B"
    ],
    "pt": [
      "l\xEDngua"
    ],
    "zh": [
      "\u820C"
    ]
  },
  "toys": {
    "emoji": [
      Emoji.football
    ],
    "en": [
      "toy",
      "toys"
    ],
    "es": [
      "juguete",
      "juguetes"
    ],
    "ja": [
      "\u904A\u5177",
      "\u304A\u3082\u3061\u3083",
      "\u304A\u3082\u3061\u3083"
    ],
    "ko": [
      "\uC7A5\uB09C\uAC10"
    ],
    "ne": [
      "\u0916\u0947\u0932\u094C\u0928\u093E"
    ],
    "pt": [
      "brinquedo",
      "brinquedos"
    ],
    "zh": [
      "\u73A9\u5177"
    ]
  },
  "tree": {
    "emoji": [
      Emoji.tree
    ],
    "en": [
      "tree",
      "trees"
    ],
    "es": [
      "\xE1rbol",
      "arbol",
      "\xE1rboles",
      "arboles"
    ],
    "ja": [
      "\u6728"
    ],
    "ko": [
      "\uB098\uBB34"
    ],
    "ne": [
      "\u0930\u0942\u0916"
    ],
    "pt": [
      "\xE1rvore",
      "\xE1rvores"
    ],
    "zh": [
      "\u6811"
    ]
  },
  "upside-down": {
    "emoji": [
      Emoji.upside_down
    ],
    "en": [
      "upside-down",
      "upside down"
    ],
    "es": [
      "al rev\xE9s",
      "al reves",
      "cabeza abajo"
    ],
    "ja": [
      "\u9006\u3055\u307E"
    ],
    "ko": [
      "\uAC70\uAFB8\uB85C",
      "\uB4A4\uC9D1\uD78C"
    ],
    "ne": [
      "\u0924\u0932\u0915\u094B \u092E\u093E\u0925\u093F"
    ],
    "pt": [
      "cabe\xE7a para baixo",
      "ponta-cabe\xE7a"
    ],
    "zh": [
      "\u7FFB\u8F6C"
    ]
  },
  "wink": {
    "emoji": [
      Emoji.wink
    ],
    "en": [
      "wink",
      "winking"
    ],
    "es": [
      "gui\xF1o",
      "guino"
    ],
    "ja": [
      "\u30A6\u30A3\u30F3\u30AF"
    ],
    "ko": [
      "\uC719\uD06C"
    ],
    "ne": [
      "\u0906\u0916\u093E \u092D\u094D\u0915\u093F\u092E\u094D\u0915\u093E\u0909\u0928\u0941"
    ],
    "pt": [
      "piscando",
      "piscada",
      "piscadela",
      "piscar de olhos"
    ],
    "zh": [
      "\u7728\u773C"
    ]
  },
  "wet": {
    "emoji": [
      Emoji.raincloud
    ],
    "en": [
      "wet"
    ],
    "es": [
      "mojado",
      "mojada"
    ],
    "ja": [
      "\u6FE1\u308C\u305F"
    ],
    "ko": [
      "\uC816\uC740",
      "\uCD95\uCD95\uD55C"
    ],
    "ne": [
      "\u092D\u093F\u091C\u0947\u0915\u094B"
    ],
    "pt": [
      "molhado",
      "molhada"
    ],
    "zh": [
      "\u6E7F"
    ]
  },
  "white face": {
    "emoji": [
      Emoji.no_emoji
    ],
    "en": [
      "white face",
      "light face"
    ],
    "es": [
      "cara blanca"
    ],
    "ja": [
      "\u8272\u767D\u3055\u3093",
      "\u3057\u308D\u3081\u3093",
      "\u767D\u9762",
      "\u767D\u3081\u3093"
    ],
    "ko": [
      "\uD558\uC580 \uC5BC\uAD74",
      "\uBC1D\uC740 \uC5BC\uAD74"
    ],
    "ne": [
      "\u0938\u0947\u0924\u094B \u0905\u0928\u0941\u0939\u093E\u0930"
    ],
    "pt": [
      "face branca"
    ],
    "zh": [
      "\u6D45\u8272\u7684\u8138"
    ]
  },
  "window": {
    "emoji": [
      Emoji.window
    ],
    "en": [
      "window"
    ],
    "es": [
      "ventana"
    ],
    "ja": [
      "\u7A93",
      "\u307E\u3069"
    ],
    "ko": [
      "\uCC3D\uBB38"
    ],
    "ne": [
      "\u0935\u093F\u0928\u094D\u0921\u094B"
    ],
    "pt": [
      "janela"
    ],
    "zh": [
      "\u7A97"
    ]
  },
  "whiskers": {
    "emoji": [
      Emoji.whiskers
    ],
    "en": [
      "whiskers",
      "whisker"
    ],
    "es": [
      "bigotes",
      "bigote"
    ],
    "ja": [
      "\u3072\u3052"
    ],
    "ko": [
      "\uC218\uC5FC"
    ],
    "ne": [
      "\u092B\u0941\u0938\u092B\u0941\u0938"
    ],
    "pt": [
      "bigode",
      "bigodes"
    ],
    "zh": [
      "\u6676\u9808"
    ]
  },
  "yawn": {
    "emoji": [
      Emoji.yawn
    ],
    "en": [
      "yawn",
      "yawning"
    ],
    "es": [
      "bostezo",
      "bostezando"
    ],
    "ja": [
      "\u3042\u304F\u3073"
    ],
    "ko": [
      "\uD558\uD488",
      "\uD558\uD488\uD558\uAE30"
    ],
    "ne": [
      "\u091C\u093E\u0902\u092D\u0908"
    ],
    "pt": [
      "bocejo",
      "bocejando"
    ],
    "zh": [
      "\u54C8\u6B20",
      "\u5475\u6B20"
    ]
  }
};

// ts/pandas.ts
var loaded = new Event("panda_data");
var P = {
  db: {}
};
var G = {};
function init() {
  const request = new XMLHttpRequest();
  request.open("GET", "/export/redpanda.json");
  request.responseType = "json";
  request.send();
  request.onload = function() {
    P.db = request.response;
    G = new dagoba_default(P.db.vertices, P.db.edges);
    window.dispatchEvent(loaded);
  };
}
function arrayContentsEqual(a, b) {
  if (a.length !== b.length) return false;
  const arr1 = a.sort();
  const arr2 = b.sort();
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}
function authorLink(author, link) {
  if (!link) return link;
  else if (link.indexOf("ig://") == 0) {
    const ig_locator = link.split("/").at(-1);
    const inline_author = link.split("/").at(-2);
    if (!inline_author) return `https://www.instagram.com/${author}/p/${ig_locator}`;
    else return `https://www.instagram.com/${inline_author}/p/${ig_locator}`;
  } else {
    return link;
  }
}
function date_to_ymd(date2) {
  return {
    "year": date2.getFullYear(),
    "month": date2.getMonth() + 1,
    "day": date2.getDate()
  };
}
function date_ymd_compare_field(birthday4, input, check) {
  if (input[check] == "any") {
    return true;
  } else {
    return birthday4[check] == input[check];
  }
}
function date_ymd_compare(birthday_ymd, input_ymd) {
  return date_ymd_compare_field(birthday_ymd, input_ymd, "day") && date_ymd_compare_field(birthday_ymd, input_ymd, "month") && date_ymd_compare_field(birthday_ymd, input_ymd, "year");
}
function prngValue(input, count) {
  let seed = void 0;
  if (input == void 0) return Math.random();
  if (count == void 0 || count < 1) count = 1;
  let next_input = input;
  for (let i = 0; i <= count; i++) {
    seed = seededPrng(next_input);
    next_input = parseInt(seed.toString().split(".")[1]);
  }
  return seed;
}
function randomChoice(array, count) {
  if (array.length <= 1) return array;
  if (array.length < count) count = array.length;
  return randomChoiceSeed(array, void 0, count);
}
function randomChoiceSeed(array, seed_input, count) {
  let seed = void 0;
  const seen = {};
  if (count >= array.length) {
    return shuffleWithSeed(array, seed_input);
  }
  let n = count;
  for (let i = 1; i <= n; i++) {
    seed = prngValue(seed_input, i);
    const random = Math.floor(seed * array.length);
    if (random in seen) n = n + 1;
    else seen[random] = array[random];
  }
  return Object.values(seen);
}
function removeElementsWithMatchingField(list, removals, field) {
  const removals_field = removals.map((x) => x[field]);
  return list.filter((item) => !removals_field.includes(item[field]));
}
function seededPrng(input) {
  const seededPrngInner = (s) => (t) => (s = s + 1831565813 | 0, t = Math.imul(s ^ s >>> 15, 1 | s), t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t, (t ^ t >>> 14) >>> 0) / 2 ** 32;
  const prngHash = (n) => (n = 61 ^ n ^ n >>> 16, n += n << 3, n = Math.imul(n, 668265261), n ^= n >>> 15) >>> 0;
  return seededPrngInner(prngHash(input))();
}
function shuffle(array) {
  return shuffleWithSeed(array, void 0);
}
function shuffleWithSeed(array, seed_input) {
  const seed = prngValue(seed_input, 1);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(seed * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
function uniqueField(array, field) {
  array = shuffle(array);
  const seen = [];
  for (let i = 0; i < array.length; i++) {
    if (!(field in array[i]) || array[i][field] == null) {
      array.splice(i, 1);
      i--;
      continue;
    }
    const value = JSON.stringify(array[i][field]);
    if (seen.includes(value)) {
      array.splice(i, 1);
      i--;
    } else {
      seen.push(value);
    }
  }
  return array;
}
function values(input) {
  let results2 = [];
  if (typeof input !== "object") {
    results2 = results2.concat(input);
  } else {
    Object.values(input).forEach(function(subinput) {
      if (typeof subinput != "object") {
        results2 = results2.concat(subinput);
      } else {
        results2 = results2.concat(values(subinput));
      }
    });
  }
  return results2;
}
function allAnimalsAndMedia() {
  const vertices = G.v().filter((vertex) => [
    "media",
    "panda"
  ].includes(vertex.type)).run();
  return vertices;
}
function graphId(prefixId) {
  const [type, _numId] = prefixId.split(".");
  const entity = G.v(prefixId).filter((vertex) => vertex.type == type).run().shift();
  return entity;
}
function searchBabies(year) {
  let baby_year = year != void 0 ? parseInt(year) : P.db._totals.last_born;
  if (isNaN(baby_year) || baby_year < Defaults.earliest.year) baby_year = P.db._totals.last_born;
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    const their_date = new Date(vertex.birthday);
    const their_year = their_date.getFullYear();
    return their_year == baby_year;
  }).unique().run();
  return sortYoungestToOldest(nodes);
}
function searchBirthdayList(input_date) {
  const input_ymd = parseDate(input_date);
  if (typeof input_ymd.year === "number" && input_ymd.year < 2e3) {
    input_ymd["year"] = input_ymd["year"] + 2e3;
  }
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    const birthday4 = new Date(vertex.birthday);
    const birthday_ymd = date_to_ymd(birthday4);
    return date_ymd_compare(birthday_ymd, input_ymd);
  }).run();
  return sortOldestToYoungest(nodes);
}
function searchBirthdayToday(keep_living = true, photo_count = 20) {
  const today = /* @__PURE__ */ new Date();
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    const birthday4 = new Date(vertex.birthday);
    return birthday4.getDate() == today.getDate() && birthday4.getMonth() == today.getMonth();
  }).filter((vertex) => {
    if (keep_living == true) {
      return vertex.death == void 0;
    } else {
      return true;
    }
  }).filter((vertex) => vertex.photos.length >= photo_count).run();
  return sortOldestToYoungest(nodes);
}
function searchBirthdayLitterIds(keep_living = true, photo_count = 20) {
  const today = /* @__PURE__ */ new Date();
  let litter_ids = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    const birthday4 = new Date(vertex.birthday);
    return birthday4.getDate() == today.getDate() && birthday4.getMonth() == today.getMonth();
  }).filter((vertex) => {
    return vertex.photos.length >= photo_count;
  }).in("litter").filter((vertex) => {
    const birthday4 = new Date(vertex.birthday);
    return birthday4.getDate() == today.getDate() && birthday4.getMonth() == today.getMonth();
  }).filter((vertex) => {
    if (keep_living == true) {
      return vertex.death == void 0;
    } else {
      return true;
    }
  }).run().map((x) => x._id);
  litter_ids = distinct(litter_ids);
  return litter_ids;
}
function searchBirthdayLitterBias(keep_living = true, photo_count = 20, max_count = 5) {
  const initial_set = searchBirthdayToday(keep_living, photo_count);
  const initial_ids = shuffle(initial_set.map((x) => x._id));
  const litter_ids = searchBirthdayLitterIds(keep_living, photo_count);
  let has_litters = initial_ids.filter((x) => litter_ids.includes(x));
  let no_litters = initial_ids.filter((x) => !litter_ids.includes(x));
  has_litters = distinct(has_litters);
  let chosen_year = -1;
  let chosen_id = "none";
  let chosen_litter_ids = [];
  if (has_litters.length > 0) {
    chosen_id = randomChoice(has_litters, 1)[0];
    const chosen_animal = graphId(chosen_id);
    chosen_litter_ids = searchLitter(chosen_id).filter((vertex) => vertex.birthday == chosen_animal.birthday).filter((vertex) => {
      if (keep_living == true) {
        return vertex.death == void 0;
      } else {
        return true;
      }
    }).map((x) => x._id);
    chosen_litter_ids.unshift(chosen_id);
    chosen_year = parseInt(chosen_animal.birthday.split("/")[0]);
  }
  let s2_ids = [];
  const after_litter = [];
  let remaining_count = max_count - chosen_litter_ids.length;
  if (no_litters.length < remaining_count) {
    remaining_count = no_litters.length;
  }
  for (let i = 0; i < remaining_count; i++) {
    const current_id = no_litters[i];
    const current_year = parseInt(graphId(current_id).birthday.split("/")[0]);
    if (current_year <= chosen_year) {
      s2_ids.unshift(current_id);
    } else if (current_year == chosen_year && !s2_ids.includes(chosen_id)) {
      s2_ids = s2_ids.concat(chosen_litter_ids);
      s2_ids.unshift(current_id);
    } else {
      after_litter.unshift(current_id);
    }
  }
  if (!s2_ids.includes(chosen_id)) s2_ids = s2_ids.concat(chosen_litter_ids);
  if (after_litter.length > 0) s2_ids = s2_ids.concat(after_litter);
  let final_animals = s2_ids.map((x) => graphId(x));
  final_animals = sortByName(final_animals, "birthday");
  return final_animals;
}
function searchDead(year) {
  let died_year = year != void 0 ? parseInt(year) : P.db._totals.last_died;
  if (isNaN(died_year) || died_year < Defaults.earliest.year) died_year = P.db._totals.last_died;
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    if (!vertex.death) return false;
    const their_date = new Date(vertex.death);
    const their_year = their_date.getFullYear();
    return their_year == died_year;
  }).unique().run();
  return sortYoungestToOldest(nodes);
}
function searchDiedList(input_date) {
  let died_date_ymd = parseDate(input_date);
  if (typeof died_date_ymd.year === "number" && died_date_ymd.year < 2e3) died_date_ymd["year"] = died_date_ymd["year"] + 2e3;
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    if (!vertex.death) return false;
    if (!vertex.photos || vertex.photos.length == 0) return false;
    const their_date = new Date(vertex.death);
    const their_date_ymd = date_to_ymd(their_date);
    return date_ymd_compare(their_date_ymd, died_date_ymd);
  }).unique().run();
  return sortYoungestToOldest(nodes);
}
function searchLitter(pandaId) {
  const nodes = G.v(pandaId).in("litter").filter((vertex) => vertex.type == "panda").run();
  return nodes;
}
function searchLinks(idstr) {
  const nodes = G.v().filter((vertex) => vertex._id == `links.${idstr}`).run();
  return nodes[0];
}
function searchMedia(mediaId) {
  const nodes = G.v().filter((vertex) => vertex._id == mediaId && vertex.type == "media").run();
  return nodes;
}
function searchNonLitterSiblings(pandaId) {
  const birthday4 = graphId(pandaId).birthday;
  const nodes = G.v(pandaId).as("me").in("family").out("family").filter((vertex) => vertex.type == "panda").unique().except("me").filter((vertex) => {
    const my_date = new Date(birthday4);
    const their_date = new Date(vertex.birthday);
    const timeDiff = Math.abs(my_date.getTime() - their_date.getTime());
    const diffDays = Math.ceil(timeDiff / (1e3 * 3600 * 24));
    if (diffDays > 2) return true;
    else return false;
  }).run();
  return nodes;
}
function searchPandaNameFields(input, name_fields = []) {
  const inputs = [];
  if (testString(input, "Latin") == true) input = capitalNames(input);
  if (testString(input, "Hiragana") == true) inputs.push(hiraganaToKatakana(input));
  if (testString(input, "Katakana") == true) inputs.push(katakanaToHiragana(input));
  inputs.unshift(input);
  if (name_fields == void 0 || name_fields.length == 0) {
    name_fields = [
      "name",
      "oldnames",
      "othernames"
    ];
  }
  const nodes = G.v().filter((vertex) => {
    if (vertex.type != "panda") return false;
    for (const field of name_fields) {
      for (const language of Defaults.languages) {
        if (vertex[field] && vertex[field][language]) {
          const nameOrList = vertex[field][language];
          const name_list = typeof nameOrList === "string" ? [
            nameOrList
          ] : nameOrList;
          for (let wanted of inputs) {
            if (name_list.includes(wanted)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }).run();
  return nodes;
}
function searchPandaAnyPhotoMedia() {
  const nodes = G.v().filter((vertex) => [
    "media",
    "panda"
  ].includes(vertex.type) && vertex.photos.length > 0).run();
  return nodes;
}
function searchPandaChildren(pandaId) {
  const nodes = G.v(pandaId).out("family").filter((vertex) => vertex.type == "panda").run();
  return nodes;
}
function searchPandaDad(pandaId) {
  const nodes = G.v(pandaId).in("family").filter((vertex) => vertex.type == "panda").filter((vertex) => vertex.gender == "Male").run();
  return nodes;
}
function searchPandaMedia(query, only_media = false) {
  const animals = !isNaN(parseInt(query)) ? [
    graphId(query)
  ] : searchPandaName(query);
  const media2 = [].concat.apply([], animals.map((x) => x._id).map((id) => {
    const nodes = G.v().filter((vertex) => {
      if (Object.keys(vertex).includes("panda.tags")) {
        return vertex["panda.tags"].includes(num(id).toString());
      }
    }).run();
    return nodes;
  }));
  if (only_media == true) return media2;
  else return [
    ...animals,
    ...media2
  ];
}
function searchPandaMediaIntersect(id_list) {
  const nodes = G.v().filter((vertex) => {
    if (Object.keys(vertex).includes("panda.tags")) {
      return arrayContentsEqual(id_list, vertex["panda.tags"]);
    }
  }).run();
  return nodes;
}
function searchPandaMom(pandaId) {
  const nodes = G.v(pandaId).in("family").filter((vertex) => vertex.type == "panda").filter((vertex) => vertex.gender == "Female").run();
  return nodes;
}
function searchPandaName(name) {
  let nodes = searchPandaNameFields(name);
  nodes = nodes.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
  return sortYoungestToOldest(nodes);
}
function searchPandaPhotoTagsIntersect(node, tags) {
  if (tags.length == 0) return [];
  const output = [];
  for (const [index, photo] of node.photos.entries()) {
    if (photo.tags == void 0) continue;
    const contains = tags.every((tag) => photo.tags.includes(tag));
    if (contains == true) {
      const bundle = {
        "_id": node._id,
        "author": photo.author,
        "coordinates": photo.coordinates ?? {},
        "index": index + 1,
        "reference": authorLink(photo.author, photo.source),
        "tags": tags,
        "type": node.type,
        "url": photo.url
      };
      output.push(bundle);
    }
  }
  return output;
}
function searchPandaPhotoTagsUnion(node, tags, mode) {
  if (tags.length == 0) return [];
  const output = [];
  for (const [index, photo] of node.photos.entries()) {
    if (photo.tags == void 0 || photo.tags.length == 0) continue;
    const contains = tags.some((tag) => photo.tags.includes(tag));
    if (contains) {
      const bundle = {
        "_id": node._id,
        "author": photo.author,
        "coordinates": photo.coordinates ?? {},
        "index": index + 1,
        "reference": authorLink(photo.author, photo.source),
        "tags": tags,
        "type": node.type,
        "url": photo.url
      };
      output.push(bundle);
      if (mode == "singleton") {
        return output;
      }
    }
  }
  return output;
}
function searchPandaZoo(zooId) {
  const nodes = G.v(zooId).in("zoo").run();
  return nodes;
}
function searchPandaZooArrived(zooId, months = 6) {
  let nodes = G.v(zooId).in("zoo").filter((vertex) => vertex.type == "panda").filter((vertex) => vertex.death == void 0).filter((vertex) => {
    let last_location = "0";
    for (const location2 of vertex.locations) {
      if (location2._id != zooId) {
        last_location = location2._id;
        continue;
      }
      const current_time = (/* @__PURE__ */ new Date()).getTime();
      const move_time = new Date(location2.date).getTime();
      const ms_per_month = 1e3 * 60 * 60 * 24 * 31;
      const ms_in_period = months * ms_per_month;
      if (ms_in_period == 0) {
        vertex["sort_time"] = move_time;
        vertex["search_context"] = {
          "query": "arrived",
          "from": last_location,
          "move_date": location2.date
        };
        return vertex;
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time;
        vertex["search_context"] = {
          "query": "arrived",
          "from": last_location,
          "move_date": location2.date
        };
        return vertex;
      }
      last_location = location2._id;
    }
  }).run();
  nodes = sortByDate(nodes, "sort_time", "descending");
  return nodes;
}
function searchPandaZooBorn(zooId, months = 6) {
  const born = G.v(zooId).in("birthplace").filter((vertex) => {
    if (vertex.type != "panda") return false;
    if (vertex.death != void 0) return false;
    const current_time = (/* @__PURE__ */ new Date()).getTime();
    const birth_time = new Date(vertex.birthday).getTime();
    const ms_per_month = 1e3 * 60 * 60 * 24 * 31;
    const ms_in_period = months * ms_per_month;
    if (ms_in_period == 0) {
      vertex["sort_time"] = birth_time;
      return vertex;
    }
    if (current_time - birth_time < ms_in_period) {
      vertex["sort_time"] = birth_time;
      vertex["search_context"] = {
        "query": "born",
        "at": zooId
      };
      return vertex;
    } else {
      return false;
    }
  }).run();
  return born;
}
function searchPandaZooBornLived(zoo_id, search_context = false) {
  const lives = G.v(zoo_id).in("zoo").run();
  const born = G.v(zoo_id).in("birthplace").run();
  const was_here = G.v().filter((vertex) => vertex.type == "panda" && vertex.locations && vertex.locations.length > 0).filter((vertex) => {
    for (const location2 of vertex.locations) {
      if (location2._id == zoo_id) return true;
    }
    return false;
  }).run();
  let nodes = lives.concat(born).concat(was_here).filter((value, index, self) => self.indexOf(value) === index);
  if (search_context == true) {
    nodes = nodes.filter((vertex) => {
      const date_ranges = [];
      let current_range = void 0;
      for (const location2 of vertex.locations) {
        if (location2._id == zoo_id) {
          current_range = [
            location2.date
          ];
        } else if (current_range != void 0) {
          current_range.push(location2.date);
          date_ranges.push(current_range);
          current_range = void 0;
        }
      }
      if (current_range != void 0) date_ranges.push(current_range);
      if (date_ranges.length == 0) {
        vertex["sort_time"] = vertex.birthday;
      } else {
        vertex["sort_time"] = date_ranges[0][0];
      }
      vertex["search_context"] = {
        "query": "born_or_lived",
        "ranges": date_ranges,
        "at": zoo_id
      };
      return vertex;
    });
  }
  nodes = sortByDate(nodes, "sort_time", "ascending");
  return nodes;
}
function searchPandaZooBornRecords(zooId, search_context = false) {
  let nodes = G.v(zooId).in("birthplace").filter((vertex) => vertex.type == "panda").filter((vertex) => {
    if (search_context == true) {
      vertex["search_context"] = {
        "query": "born_at",
        "at": zooId
      };
    }
    return vertex;
  }).run();
  nodes = sortByName(nodes, "birthday").reverse();
  return nodes;
}
function searchPandaZooCurrent(zooId) {
  const nodes = G.v(zooId).in("zoo").filter((vertex) => vertex.type == "panda").filter((vertex) => vertex.death == void 0).run();
  return nodes;
}
function searchPandaZooDeparted(compare_id, months = 6) {
  let nodes = G.v().filter((vertex) => vertex.type == "panda").filter((vertex) => vertex.locations.length > 0).filter((vertex) => vertex.zoo != num(compare_id)).filter((vertex) => {
    let at_zoo_previously = false;
    for (const location2 of vertex.locations) {
      if (location2._id != compare_id && at_zoo_previously == false) continue;
      if (location2._id == compare_id) {
        at_zoo_previously = true;
        continue;
      }
      const current_time = (/* @__PURE__ */ new Date()).getTime();
      const move_time = new Date(location2.date).getTime();
      const ms_per_month = 1e3 * 60 * 60 * 24 * 31;
      const ms_in_period = months * ms_per_month;
      if (ms_in_period == 0) {
        vertex["sort_time"] = location2.date;
        vertex["search_context"] = {
          "query": "departed",
          "to": location2._id,
          "move_date": location2.date
        };
        return true;
      }
      if (current_time - move_time < ms_in_period) {
        vertex["sort_time"] = move_time;
        vertex["search_context"] = {
          "query": "departed",
          "to": location2._id,
          "move_date": location2.date
        };
        return true;
      } else {
        at_zoo_previously = false;
      }
    }
    return false;
  }).run();
  nodes = sortByDate(nodes, "sort_time", "descending");
  return nodes;
}
function searchPandaZooDied(zooId, months = 6) {
  let nodes = G.v(zooId).in("zoo").filter((vertex) => vertex.type == "panda").filter((vertex) => {
    if (vertex.death == void 0) return false;
    const current_time = (/* @__PURE__ */ new Date()).getTime();
    const anniversary = new Date(vertex.death).getTime();
    const ms_per_month = 1e3 * 60 * 60 * 24 * 31;
    const ms_in_period = months * ms_per_month;
    if (ms_in_period == 0) {
      vertex["sort_time"] = vertex["death"];
      vertex["search_context"] = {
        "query": "died"
      };
      return vertex;
    }
    if (current_time - anniversary < ms_in_period) {
      vertex["sort_time"] = vertex["death"];
      vertex["search_context"] = {
        "query": "died"
      };
      return vertex;
    } else {
      return false;
    }
  }).run();
  nodes = sortByDate(nodes, "sort_time", "descending");
  return nodes;
}
function searchPhotoCredit(author, filter_ids = []) {
  const photoTypes = [
    "media",
    "panda",
    "wild",
    "zoo"
  ];
  const nodes = G.v().filter((vertex) => photoTypes.includes(vertex.type)).filter((vertex) => vertex.photos.length > 0).filter((vertex) => vertex.photos.some((photo) => photo.author == author)).filter((vertex) => {
    if (filter_ids.length == 0) return true;
    else return filter_ids.includes(vertex._id);
  }).run();
  return nodes;
}
function searchPhotoProfile(animal_list) {
  return searchPhotoTags(animal_list, [
    "profile"
  ], "singleton", "first");
}
function searchPhotoProfileChildren(pandaId) {
  const children = sortOldestToYoungest(searchPandaChildren(pandaId));
  return searchPhotoProfile(children);
}
function searchPhotoProfileImmediateFamily(pandaId) {
  const me = graphId(pandaId);
  const mom = searchPandaMom(pandaId);
  const dad = searchPandaDad(pandaId);
  const litter = searchLitter(pandaId);
  const family = me.concat(mom).concat(dad).concat(litter);
  return searchPhotoProfile(family);
}
function searchPhotoProfileSiblings(pandaId) {
  const nonLitterSiblings = searchNonLitterSiblings(pandaId);
  const litter = searchLitter(pandaId);
  const siblings = sortOldestToYoungest(nonLitterSiblings.concat(litter));
  return searchPhotoProfile(siblings);
}
function searchPhotoTags(animal_list, tags, mode, fallback) {
  let output = [];
  for (const animal of animal_list) {
    let set = [];
    if (mode == "photos" || mode == "union" || mode == "singleton") {
      set = searchPandaPhotoTagsUnion(animal, tags, mode);
    }
    if (mode == "intersect") {
      set = searchPandaPhotoTagsIntersect(animal, tags);
    }
    if (fallback == "first") {
      if (set.length == 1 && Object.values(Defaults.unknown).includes(set[0].author)) {
        set = [
          profilePhoto(animal, 1)
        ];
      }
      if (set.length == 1 && Object.values(Defaults.unknown).includes(set[0].author)) {
        set = [];
      }
    }
    output = output.concat(set);
  }
  return output;
}
function searchZooName(zoo_name_str) {
  if (testString(zoo_name_str, "Latin") == true) {
    zoo_name_str = capitalNames(zoo_name_str);
  }
  const searchFields = [
    "location",
    "name"
  ];
  const location_nodes = G.v().filter((vertex) => {
    if (vertex.type != "zoo") return false;
    for (const searchField of searchFields) {
      for (const language of Defaults.languages) {
        const testField = vertex[searchField][language];
        if (testField && testField.includes(zoo_name_str)) return true;
      }
    }
    return false;
  }).run();
  return location_nodes;
}
function sortByNameJapanese(nodes) {
  function hiragana_generate(name) {
    const hiragana = Defaults.ranges["ja"][1];
    const katakana = Defaults.ranges["ja"][2];
    if (hiragana.test(name) == true) {
      return name;
    }
    if (katakana.test(name) == true) {
      return katakanaToHiragana(name);
    }
  }
  function build_name_list(node) {
    let name_list = [];
    if (node.name["ja"]) name_list = name_list.concat(node.name["ja"]);
    if (node.othernames["ja"]) name_list = name_list.concat(node.othernames["ja"]);
    return name_list;
  }
  const connector = Text["and"][environment_default.language];
  nodes = nodes.map((node) => {
    if (node.type == "media") {
      const panda_ids = node["panda.tags"];
      const animals = panda_ids.map((id) => graphId(`panda.${id}`));
      const first_group_name = node.name["ja"].split(connector)[0];
      const animal = animals.filter((animal2) => animal2.name.ja == first_group_name)[0];
      const name_list = build_name_list(animal);
      node.sortname = name_list.map((name) => hiragana_generate(name)).filter((name) => name != void 0)[0];
    } else {
      const name_list = build_name_list(node);
      node.sortname = name_list.map((name) => hiragana_generate(name)).filter((name) => name != void 0)[0];
    }
    return node;
  });
  return sortByName(nodes, "sortname");
}
function sortByName(nodes, name_field) {
  return nodes.sort((a, b) => {
    if (a[name_field] > b[name_field]) {
      return 1;
    } else if (a[name_field] < b[name_field]) {
      return -1;
    } else {
      return 0;
    }
  });
}
function sortByNameWithGroups(nodes, photo_list) {
  nodes = nodes.map((node) => {
    if (node.type == "media") {
      const desired_url = photo_list.map((photo) => photo.url).filter((url2) => node.photos.map((photo) => photo.url).includes(url2))[0];
      const desired_photo = node.photos.filter((photo) => photo.url == desired_url)[0];
      node.name = {};
      node.name[environment_default.language] = groupMediaCaption(node, desired_photo);
    }
    return node;
  });
  if (environment_default.language == "ja") return sortByNameJapanese(nodes);
  else return sortByName(nodes, "name");
}
function sortByDate(nodes, field_name, mode = "descending") {
  if (mode == "descending") {
    return sortByName(nodes, field_name).reverse();
  } else {
    return sortByName(nodes, field_name);
  }
}
function sortPhotosByName(photo_list) {
  let entities = photo_list.map((photo) => graphId(photo._id));
  entities = sortByNameWithGroups(entities, photo_list);
  const output_list = entities.map((entity) => photo_list.filter((photo) => photo._id == entity._id)[0]);
  return output_list;
}
function sortOldestToYoungest(nodes) {
  return nodes.sort(function(a, b) {
    const time_a = new Date(a.birthday).getTime();
    const time_b = new Date(b.birthday).getTime();
    if (time_a > time_b) {
      return 1;
    } else if (time_a < time_b) {
      return -1;
    } else {
      return 0;
    }
  });
}
function sortYoungestToOldest(nodes) {
  return nodes.sort(function(a, b) {
    const time_a = new Date(a.birthday).getTime();
    const time_b = new Date(b.birthday).getTime();
    if (time_a < time_b) {
      return 1;
    } else if (time_a > time_b) {
      return -1;
    } else {
      return 0;
    }
  });
}
function age(animal) {
  const birth = animal["birthday"];
  if (birth == void 0 || birth == "unknown") return Defaults.unknown[environment_default.language];
  const birthday4 = new Date(birth).getTime();
  const death = animal["death"];
  if (death == "unknown") return Defaults.unknown[environment_default.language];
  const endday = death == void 0 ? (/* @__PURE__ */ new Date()).getTime() : new Date(death).getTime();
  const ms_per_day = 1e3 * 60 * 60 * 24;
  const age_days = (endday - birthday4) / ms_per_day;
  const age_years = Math.floor(age_days / 365);
  const age_months = Math.floor(age_days / 31);
  function pluralize(count, time_word) {
    return count < 2 ? Defaults.age[environment_default.language][time_word] : Defaults.age[environment_default.language][time_word + "s"];
  }
  function spacing() {
    return environment_default.language == "ja" ? "" : " ";
  }
  if (age_days <= 100) {
    return Math.floor(age_days).toString() + spacing() + pluralize(age_days, "day");
  } else if (age_days <= 365) {
    return age_months.toString() + spacing() + Defaults.age[environment_default.language]["months"];
  } else if (age_days <= 403) {
    return "1" + spacing() + Defaults.age[environment_default.language]["year"];
  } else if (age_days <= 730) {
    return "1" + spacing() + Defaults.age[environment_default.language]["year"] + " " + (age_months - 12).toString() + spacing() + pluralize(age_months - 12, "month");
  } else {
    return age_years.toString() + spacing() + Defaults.age[environment_default.language]["years"];
  }
}
function ageYears(animal) {
  const birth = animal["birthday"];
  if (birth == void 0 || birth == "unknown") return Defaults.unknown[environment_default.language];
  const birthday4 = new Date(birth).getTime();
  const endday = (/* @__PURE__ */ new Date()).getTime();
  const ms_per_day = 1e3 * 60 * 60 * 24;
  const age_days = (endday - birthday4) / ms_per_day;
  const age_years = Math.floor(age_days / 365);
  return age_years.toString();
}
function birthday(animal) {
  return date(animal, "birthday");
}
function date(animal, field) {
  const date2 = animal[field];
  if (date2 == void 0 || date2 == "unknown") return Defaults.unknown[environment_default.language];
  return formatDate(date2);
}
function formatDate(date2) {
  if (date2 == void 0 || date2 == "unknown") return Defaults.unknown[environment_default.language];
  if (date2.split("/").length == 2 && Gui[date2.split("/")[1].toLowerCase()] != void 0) {
    return formatSeason(date2);
  }
  let format = Defaults.date[environment_default.language];
  const [year, month, day] = date2.split("/");
  format = format.replace("YYYY", year);
  format = format.replace("MM", month);
  format = format.replace("DD", day);
  return format;
}
function formatSeason(date2) {
  if (date2 == void 0 || date2 == "unknown") return Defaults.unknown[environment_default.language];
  let [year, season] = date2.split("/");
  season = season.toLowerCase();
  let format = Defaults.date_season[environment_default.language];
  format = format.replace("YYYY", year);
  format = format.replace("SEASON", Gui[season][environment_default.language]);
  return format;
}
function formatYear(date2) {
  if (date2 == void 0 || date2 == "unknown") return Defaults.unknown[environment_default.language];
  const [year] = date2.split("/");
  return year;
}
function gender(animal) {
  const gender3 = animal["gender"];
  return gender3 == void 0 ? Defaults.unknown[environment_default.language] : Defaults.gender[gender3][environment_default.language];
}
function groupMediaCaption(entity, photo) {
  const pandaTags = entity["panda.tags"];
  let output_string = Defaults.animal.name[environment_default.language] ?? "";
  let animals = [];
  for (const id of pandaTags) {
    const panda = graphId(`panda.${id}`);
    const [x, y] = photo.coordinates[id];
    const name = fallback_name(panda);
    const info = {
      "name": name,
      "x": x,
      "y": y
    };
    animals.push(info);
  }
  animals = animals.sort((a, b) => a["x"] > b["x"] ? 1 : -1);
  if (animals.length > 0) {
    let connector = Text["and"][environment_default.language];
    if (animals.length > 2 && alphabets.latin.includes(environment_default.language)) {
      connector = Text["comma"][environment_default.language];
      output_string = animals.map((x) => x.name).join(connector);
      const last_animal = animals[animals.length - 1];
      const match = new RegExp(connector + last_animal.name + "$");
      const replace = Text["and"][environment_default.language] + last_animal.name;
      output_string = output_string.replace(match, replace);
    } else {
      output_string = animals.map((x) => x.name).join(connector);
    }
  }
  if (values(Polyglots["baby"]).includes(animals[0].name) && uniqueField(animals, "name").length == 1) {
    output_string = Gui["babies"][environment_default.language];
  }
  return output_string;
}
function halfSiblings(animal, sibling) {
  if (indeterminateSiblings(animal._id, sibling._id) == true) return false;
  const animal_mom = searchPandaMom(animal._id)[0];
  const animal_dad = searchPandaDad(animal._id)[0];
  const sibling_mom = searchPandaMom(sibling._id)[0];
  const sibling_dad = searchPandaDad(sibling._id)[0];
  let sibling_year = -1;
  if (sibling["birthday"] != Defaults.animal["birthday"]) sibling_year = parseInt(formatYear(sibling["birthday"]));
  let mymom_year = -2;
  if (animal_mom != void 0) mymom_year = parseInt(formatYear(animal_mom["birthday"]));
  let mydad_year = -2;
  if (animal_dad != void 0) mydad_year = parseInt(formatYear(animal_dad["birthday"]));
  if ((animal_mom == void 0 || animal_dad == void 0 || sibling_mom == void 0 || sibling_dad == void 0) && (sibling_year <= mymom_year || sibling_year <= mydad_year)) {
    return true;
  }
  return !(animal_mom == sibling_mom && animal_dad == sibling_dad) && animal_mom != void 0 && animal_dad != void 0 && sibling_mom != void 0 && sibling_dad != void 0;
}
function indeterminateParent(parent_id, child_id) {
  const parent_gender = graphId(parent_id).gender;
  if (parent_gender == "m") {
    return searchPandaDad(child_id).length > 1;
  } else {
    return searchPandaMom(child_id).length > 1;
  }
}
function indeterminateSiblings(animal_id, sibling_id) {
  const animal_moms = searchPandaMom(animal_id);
  const animal_dads = searchPandaDad(animal_id);
  const sibling_moms = searchPandaMom(sibling_id);
  const sibling_dads = searchPandaDad(sibling_id);
  if (animal_moms.length > 1 || animal_dads.length > 1 || sibling_moms.length > 1 || sibling_dads.length > 1) {
    return true;
  }
  return false;
}
function language_order(entity) {
  const ordering = entity["language.order"];
  if (ordering == void 0 || ordering.length == 0) {
    return Fallback.order;
  } else {
    return ordering;
  }
}
function locationList(animal) {
  let locations = [];
  const defaultLocations = [
    Defaults.zoo._id,
    Defaults.wild._id
  ];
  for (const [index, location2] of animal.locations.entries()) {
    const nextLocation = animal.locations[index + 1];
    const end_date = nextLocation == void 0 ? animal["death"] ?? void 0 : defaultLocations.includes(location2._id) ? Defaults.animal["birthday"] : nextLocation.date;
    const start_date = defaultLocations.includes(location2._id) ? Defaults.animal["birthday"] : location2.date;
    locations.push({
      "id": location2._id,
      "start_date": start_date,
      "end_date": end_date
    });
  }
  if (locations.length == 0 && myWild(animal, "wild") != void 0) locations = [
    locationWild(animal)
  ];
  if (locations.length == 0 && myZoo(animal, "zoo") != void 0) locations = [
    locationZoo(animal)
  ];
  return locations;
}
function locationWild(animal) {
  let end_date = void 0;
  if (animal["death"] != void 0) {
    end_date = animal["death"];
  }
  return {
    "id": myWild(animal, "wild"),
    "start_date": Defaults.date[environment_default.language],
    "end_date": end_date ?? Defaults.date[environment_default.language]
  };
}
function locationZoo(animal) {
  return {
    "id": myZoo(animal, "zoo"),
    "start_date": animal["birthday"],
    "end_date": animal["death"]
    // Fall back to undefined
  };
}
function locatorsToPhotos(locators) {
  const photos = [];
  for (const locator of locators) {
    photos.push(locatorToPhoto(locator));
  }
  return photos;
}
function locatorToPhoto(locator) {
  const parts = locator.split(".");
  const photo_index = parseInt(parts[parts.length - 1]);
  const entity_type = parts[0];
  let entity_id = void 0;
  let entity;
  if (entity_type == "media") {
    entity_id = `${parts[0]}.${parts[1]}.${parts[2]}`;
    entity = searchMedia(entity_id)[0];
  } else if (entity_type == "zoo") {
    entity_id = `zoo.${parts[1]}`;
    entity = graphId(entity_id);
  } else {
    entity_id = `panda.${parts[1]}`;
    entity = graphId(entity_id);
  }
  const choice = entity.photos[photo_index - 1];
  const desired = {
    "_id": entity._id,
    "author": choice.author,
    "coordinates": choice.coordinates,
    "index": photo_index,
    "reference": authorLink(choice.author, choice.source),
    "tags": [],
    "type": entity_type,
    "url": choice.url
  };
  return desired;
}
function myWild(animal, field) {
  const wild = G.v(animal._id).out(field).run();
  return wild.length == 0 ? Defaults.wild : wild[0];
}
function myZoo(animal, field) {
  const zoo = G.v(animal._id).out(field).run();
  return zoo.length == 0 ? Defaults.zoo : zoo[0];
}
function othernames(animal) {
  return animal.othernames[environment_default.language] == void 0 ? Defaults.animal.othernames[environment_default.language] : animal.othernames[environment_default.language];
}
function parseDate(date2) {
  date2 = date2.replace(/[^\d]/g, "/");
  date2 = date2.replace(/^\//, "");
  date2 = date2.replace(/\/$/, "");
  const nums = date2.split("/").map((x) => parseInt(x));
  if (nums.length == 2) {
    if (nums[0] > 31) {
      return {
        "year": nums[0],
        "month": nums[1],
        "day": "any"
      };
    } else if (nums[1] > 31) {
      return {
        "year": nums[1],
        "month": nums[0],
        "day": "any"
      };
    } else {
      var locale = DateLocale["mm_dd"][environment_default.language].split("_");
      if (locale[0] == "mm") {
        return {
          "year": "any",
          "month": nums[0],
          "day": nums[1]
        };
      } else {
        return {
          "year": "any",
          "month": nums[1],
          "day": nums[0]
        };
      }
    }
  } else if (nums.length == 3) {
    const locale2 = DateLocale["yy_mm_dd"][environment_default.language].split("_");
    if (nums[0] > 31) {
      return {
        "year": nums[0],
        "month": nums[1],
        "day": nums[2]
      };
    } else if (nums[2] > 31) {
      if (nums[0] > 12) {
        return {
          "year": nums[2],
          "month": nums[1],
          "day": nums[0]
        };
      } else if (nums[1] > 12) {
        return {
          "year": nums[2],
          "month": nums[0],
          "day": nums[1]
        };
      } else {
        if (locale2[0] == "mm") {
          return {
            "year": nums[2],
            "month": nums[0],
            "day": nums[1]
          };
        } else {
          return {
            "year": nums[2],
            "month": nums[1],
            "day": nums[0]
          };
        }
      }
    } else {
      const locale3 = DateLocale["yy_mm_dd"][environment_default.language].split("_");
      if (locale3[0] == "mm") {
        return {
          "year": nums[2],
          "month": nums[0],
          "day": nums[1]
        };
      } else if (locale3[0] == "dd") {
        return {
          "year": nums[2],
          "month": nums[1],
          "day": nums[0]
        };
      } else {
        return {
          "year": nums[0],
          "month": nums[1],
          "day": nums[2]
        };
      }
    }
  } else {
    return {
      "year": -1,
      "month": -1,
      "day": -1
    };
  }
}
function profilePhoto(animal, naturalIndex) {
  let arrayIndex = typeof naturalIndex !== "number" ? 0 : naturalIndex - 1;
  let choice = typeof naturalIndex !== "number" ? void 0 : animal.photos[arrayIndex];
  let imageUrl = choice ? choice.url : Defaults.photo.url;
  if (choice == void 0) {
    const space = animal.photos.length;
    arrayIndex = Math.floor(Math.random() * space);
    choice = animal.photos[arrayIndex];
    imageUrl = choice ? choice.url : Defaults.photo.url;
  }
  if (animal.photos.length === 0) {
    const contributeLink = Gui.contribute_link[environment_default.language] ?? Gui.contribute_link["en"];
    return {
      "_id": animal._id,
      "author": Gui.contribute[environment_default.language],
      "coordinates": {},
      "index": 1,
      "reference": authorLink(Gui.contribute[environment_default.language], contributeLink),
      "tags": [],
      "type": animal.type,
      "url": Defaults.photo.url
    };
  } else {
    return {
      "_id": animal._id,
      "author": choice.author,
      "coordinates": {},
      "index": arrayIndex + 1,
      "reference": authorLink(choice.author, choice.source),
      "tags": [],
      "type": animal.type,
      "url": imageUrl
    };
  }
}
function species(animal) {
  if (animal.species == void 0) {
    return Defaults.unknown[environment_default.language];
  }
  const idx = parseInt(animal.species) - 1;
  return Defaults.species[environment_default.language][idx];
}
function wildField(wild, field) {
  return wild[field] == void 0 ? Defaults.wild[field] : wild[field];
}
function zooField(zoo, field) {
  return zoo[field] == void 0 ? Defaults.zoo[field] : zoo[field];
}
var pandas_default = P;

// js/qrcode.js
function QR8bitByte(data) {
  this.mode = QRMode.MODE_8BIT_BYTE;
  this.data = this.toUTF8(data);
}
QR8bitByte.prototype = {
  getLength: function(buffer) {
    return this.data.length;
  },
  write: function(buffer) {
    for (var i = 0; i < this.data.length; i++) {
      buffer.put(this.data.charCodeAt(i), 8);
    }
  },
  toUTF8: function(str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if (c >= 1 && c <= 127) {
        out += str.charAt(i);
      } else if (c > 2047) {
        out += String.fromCharCode(224 | c >> 12 & 15);
        out += String.fromCharCode(128 | c >> 6 & 63);
        out += String.fromCharCode(128 | c >> 0 & 63);
      } else {
        out += String.fromCharCode(192 | c >> 6 & 31);
        out += String.fromCharCode(128 | c >> 0 & 63);
      }
    }
    return out;
  }
};
function QRCode(typeNumber, errorCorrectLevel) {
  this.typeNumber = typeNumber;
  this.errorCorrectLevel = errorCorrectLevel;
  this.modules = null;
  this.moduleCount = 0;
  this.dataCache = null;
  this.dataList = new Array();
}
QRCode.prototype = {
  addData: function(data) {
    var newData = new QR8bitByte(data);
    this.dataList.push(newData);
    this.dataCache = null;
  },
  isDark: function(row, col) {
    if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
      throw new Error(row + "," + col);
    }
    return this.modules[row][col];
  },
  getModuleCount: function() {
    return this.moduleCount;
  },
  make: function() {
    this.makeImpl(false, this.getBestMaskPattern());
  },
  makeImpl: function(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (var row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount);
      for (var col = 0; col < this.moduleCount; col++) {
        this.modules[row][col] = null;
      }
    }
    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);
    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }
    if (this.dataCache == null) {
      this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
    }
    this.mapData(this.dataCache, maskPattern);
  },
  setupPositionProbePattern: function(row, col) {
    for (var r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  },
  getBestMaskPattern: function() {
    var minLostPoint = 0;
    var pattern = 0;
    for (var i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      var lostPoint = QRUtil.getLostPoint(this);
      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  },
  createMovieClip: function(target_mc, instance_name, depth) {
    var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
    var cs = 1;
    this.make();
    for (var row = 0; row < this.modules.length; row++) {
      var y = row * cs;
      for (var col = 0; col < this.modules[row].length; col++) {
        var x = col * cs;
        var dark = this.modules[row][col];
        if (dark) {
          qr_mc.beginFill(0, 100);
          qr_mc.moveTo(x, y);
          qr_mc.lineTo(x + cs, y);
          qr_mc.lineTo(x + cs, y + cs);
          qr_mc.lineTo(x, y + cs);
          qr_mc.endFill();
        }
      }
    }
    return qr_mc;
  },
  setupTimingPattern: function() {
    for (var r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] != null) {
        continue;
      }
      this.modules[r][6] = r % 2 == 0;
    }
    for (var c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] != null) {
        continue;
      }
      this.modules[6][c] = c % 2 == 0;
    }
  },
  setupPositionAdjustPattern: function() {
    var pos = QRUtil.getPatternPosition(this.typeNumber);
    for (var i = 0; i < pos.length; i++) {
      for (var j = 0; j < pos.length; j++) {
        var row = pos[i];
        var col = pos[j];
        if (this.modules[row][col] != null) {
          continue;
        }
        for (var r = -2; r <= 2; r++) {
          for (var c = -2; c <= 2; c++) {
            if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  },
  setupTypeNumber: function(test) {
    var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
    for (var i = 0; i < 18; i++) {
      var mod = !test && (bits >> i & 1) == 1;
      this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
    }
    for (var i = 0; i < 18; i++) {
      var mod = !test && (bits >> i & 1) == 1;
      this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  },
  setupTypeInfo: function(test, maskPattern) {
    var data = this.errorCorrectLevel << 3 | maskPattern;
    var bits = QRUtil.getBCHTypeInfo(data);
    for (var i = 0; i < 15; i++) {
      var mod = !test && (bits >> i & 1) == 1;
      if (i < 6) {
        this.modules[i][8] = mod;
      } else if (i < 8) {
        this.modules[i + 1][8] = mod;
      } else {
        this.modules[this.moduleCount - 15 + i][8] = mod;
      }
    }
    for (var i = 0; i < 15; i++) {
      var mod = !test && (bits >> i & 1) == 1;
      if (i < 8) {
        this.modules[8][this.moduleCount - i - 1] = mod;
      } else if (i < 9) {
        this.modules[8][15 - i - 1 + 1] = mod;
      } else {
        this.modules[8][15 - i - 1] = mod;
      }
    }
    this.modules[this.moduleCount - 8][8] = !test;
  },
  mapData: function(data, maskPattern) {
    var inc = -1;
    var row = this.moduleCount - 1;
    var bitIndex = 7;
    var byteIndex = 0;
    for (var col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col--;
      while (true) {
        for (var c = 0; c < 2; c++) {
          if (this.modules[row][col - c] == null) {
            var dark = false;
            if (byteIndex < data.length) {
              dark = (data[byteIndex] >>> bitIndex & 1) == 1;
            }
            var mask = QRUtil.getMask(maskPattern, row, col - c);
            if (mask) {
              dark = !dark;
            }
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex == -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
};
QRCode.PAD0 = 236;
QRCode.PAD1 = 17;
QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
  var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
  var buffer = new QRBitBuffer();
  for (var i = 0; i < dataList.length; i++) {
    var data = dataList[i];
    buffer.put(data.mode, 4);
    buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
    data.write(buffer);
  }
  var totalDataCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) {
    totalDataCount += rsBlocks[i].dataCount;
  }
  if (buffer.getLengthInBits() > totalDataCount * 8) {
    throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
  }
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
    buffer.put(0, 4);
  }
  while (buffer.getLengthInBits() % 8 != 0) {
    buffer.putBit(false);
  }
  while (true) {
    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break;
    }
    buffer.put(QRCode.PAD0, 8);
    if (buffer.getLengthInBits() >= totalDataCount * 8) {
      break;
    }
    buffer.put(QRCode.PAD1, 8);
  }
  return QRCode.createBytes(buffer, rsBlocks);
};
QRCode.createBytes = function(buffer, rsBlocks) {
  var offset = 0;
  var maxDcCount = 0;
  var maxEcCount = 0;
  var dcdata = new Array(rsBlocks.length);
  var ecdata = new Array(rsBlocks.length);
  for (var r = 0; r < rsBlocks.length; r++) {
    var dcCount = rsBlocks[r].dataCount;
    var ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);
    dcdata[r] = new Array(dcCount);
    for (var i = 0; i < dcdata[r].length; i++) {
      dcdata[r][i] = 255 & buffer.buffer[i + offset];
    }
    offset += dcCount;
    var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
    var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
    var modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.getLength() - 1);
    for (var i = 0; i < ecdata[r].length; i++) {
      var modIndex = i + modPoly.getLength() - ecdata[r].length;
      ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
  }
  var totalCodeCount = 0;
  for (var i = 0; i < rsBlocks.length; i++) {
    totalCodeCount += rsBlocks[i].totalCount;
  }
  var data = new Array(totalCodeCount);
  var index = 0;
  for (var i = 0; i < maxDcCount; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < dcdata[r].length) {
        data[index++] = dcdata[r][i];
      }
    }
  }
  for (var i = 0; i < maxEcCount; i++) {
    for (var r = 0; r < rsBlocks.length; r++) {
      if (i < ecdata[r].length) {
        data[index++] = ecdata[r][i];
      }
    }
  }
  return data;
};
var QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3
};
var QRErrorCorrectLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2
};
var QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7
};
var QRUtil = {
  PATTERN_POSITION_TABLE: [
    [],
    [
      6,
      18
    ],
    [
      6,
      22
    ],
    [
      6,
      26
    ],
    [
      6,
      30
    ],
    [
      6,
      34
    ],
    [
      6,
      22,
      38
    ],
    [
      6,
      24,
      42
    ],
    [
      6,
      26,
      46
    ],
    [
      6,
      28,
      50
    ],
    [
      6,
      30,
      54
    ],
    [
      6,
      32,
      58
    ],
    [
      6,
      34,
      62
    ],
    [
      6,
      26,
      46,
      66
    ],
    [
      6,
      26,
      48,
      70
    ],
    [
      6,
      26,
      50,
      74
    ],
    [
      6,
      30,
      54,
      78
    ],
    [
      6,
      30,
      56,
      82
    ],
    [
      6,
      30,
      58,
      86
    ],
    [
      6,
      34,
      62,
      90
    ],
    [
      6,
      28,
      50,
      72,
      94
    ],
    [
      6,
      26,
      50,
      74,
      98
    ],
    [
      6,
      30,
      54,
      78,
      102
    ],
    [
      6,
      28,
      54,
      80,
      106
    ],
    [
      6,
      32,
      58,
      84,
      110
    ],
    [
      6,
      30,
      58,
      86,
      114
    ],
    [
      6,
      34,
      62,
      90,
      118
    ],
    [
      6,
      26,
      50,
      74,
      98,
      122
    ],
    [
      6,
      30,
      54,
      78,
      102,
      126
    ],
    [
      6,
      26,
      52,
      78,
      104,
      130
    ],
    [
      6,
      30,
      56,
      82,
      108,
      134
    ],
    [
      6,
      34,
      60,
      86,
      112,
      138
    ],
    [
      6,
      30,
      58,
      86,
      114,
      142
    ],
    [
      6,
      34,
      62,
      90,
      118,
      146
    ],
    [
      6,
      30,
      54,
      78,
      102,
      126,
      150
    ],
    [
      6,
      24,
      50,
      76,
      102,
      128,
      154
    ],
    [
      6,
      28,
      54,
      80,
      106,
      132,
      158
    ],
    [
      6,
      32,
      58,
      84,
      110,
      136,
      162
    ],
    [
      6,
      26,
      54,
      82,
      110,
      138,
      166
    ],
    [
      6,
      30,
      58,
      86,
      114,
      142,
      170
    ]
  ],
  G15: 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0,
  G18: 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0,
  G15_MASK: 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1,
  getBCHTypeInfo: function(data) {
    var d = data << 10;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
      d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
    }
    return (data << 10 | d) ^ QRUtil.G15_MASK;
  },
  getBCHTypeNumber: function(data) {
    var d = data << 12;
    while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
      d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
    }
    return data << 12 | d;
  },
  getBCHDigit: function(data) {
    var digit = 0;
    while (data != 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  },
  getPatternPosition: function(typeNumber) {
    return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
  },
  getMask: function(maskPattern, i, j) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000:
        return (i + j) % 2 == 0;
      case QRMaskPattern.PATTERN001:
        return i % 2 == 0;
      case QRMaskPattern.PATTERN010:
        return j % 3 == 0;
      case QRMaskPattern.PATTERN011:
        return (i + j) % 3 == 0;
      case QRMaskPattern.PATTERN100:
        return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
      case QRMaskPattern.PATTERN101:
        return i * j % 2 + i * j % 3 == 0;
      case QRMaskPattern.PATTERN110:
        return (i * j % 2 + i * j % 3) % 2 == 0;
      case QRMaskPattern.PATTERN111:
        return (i * j % 3 + (i + j) % 2) % 2 == 0;
      default:
        throw new Error("bad maskPattern:" + maskPattern);
    }
  },
  getErrorCorrectPolynomial: function(errorCorrectLength) {
    var a = new QRPolynomial([
      1
    ], 0);
    for (var i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([
        1,
        QRMath.gexp(i)
      ], 0));
    }
    return a;
  },
  getLengthInBits: function(mode, type) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 10;
        case QRMode.MODE_ALPHA_NUM:
          return 9;
        case QRMode.MODE_8BIT_BYTE:
          return 8;
        case QRMode.MODE_KANJI:
          return 8;
        default:
          throw new Error("mode:" + mode);
      }
    } else if (type < 27) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 12;
        case QRMode.MODE_ALPHA_NUM:
          return 11;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 10;
        default:
          throw new Error("mode:" + mode);
      }
    } else if (type < 41) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 14;
        case QRMode.MODE_ALPHA_NUM:
          return 13;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 12;
        default:
          throw new Error("mode:" + mode);
      }
    } else {
      throw new Error("type:" + type);
    }
  },
  getLostPoint: function(qrCode) {
    var moduleCount = qrCode.getModuleCount();
    var lostPoint = 0;
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount; col++) {
        var sameCount = 0;
        var dark = qrCode.isDark(row, col);
        for (var r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }
          for (var c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }
            if (r == 0 && c == 0) {
              continue;
            }
            if (dark == qrCode.isDark(row + r, col + c)) {
              sameCount++;
            }
          }
        }
        if (sameCount > 5) {
          lostPoint += 3 + sameCount - 5;
        }
      }
    }
    for (var row = 0; row < moduleCount - 1; row++) {
      for (var col = 0; col < moduleCount - 1; col++) {
        var count = 0;
        if (qrCode.isDark(row, col)) count++;
        if (qrCode.isDark(row + 1, col)) count++;
        if (qrCode.isDark(row, col + 1)) count++;
        if (qrCode.isDark(row + 1, col + 1)) count++;
        if (count == 0 || count == 4) {
          lostPoint += 3;
        }
      }
    }
    for (var row = 0; row < moduleCount; row++) {
      for (var col = 0; col < moduleCount - 6; col++) {
        if (qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) {
          lostPoint += 40;
        }
      }
    }
    for (var col = 0; col < moduleCount; col++) {
      for (var row = 0; row < moduleCount - 6; row++) {
        if (qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) {
          lostPoint += 40;
        }
      }
    }
    var darkCount = 0;
    for (var col = 0; col < moduleCount; col++) {
      for (var row = 0; row < moduleCount; row++) {
        if (qrCode.isDark(row, col)) {
          darkCount++;
        }
      }
    }
    var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;
    return lostPoint;
  }
};
var QRMath = {
  glog: function(n) {
    if (n < 1) {
      throw new Error("glog(" + n + ")");
    }
    return QRMath.LOG_TABLE[n];
  },
  gexp: function(n) {
    while (n < 0) {
      n += 255;
    }
    while (n >= 256) {
      n -= 255;
    }
    return QRMath.EXP_TABLE[n];
  },
  EXP_TABLE: new Array(256),
  LOG_TABLE: new Array(256)
};
for (i = 0; i < 8; i++) {
  QRMath.EXP_TABLE[i] = 1 << i;
}
var i;
for (i = 8; i < 256; i++) {
  QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
}
var i;
for (i = 0; i < 255; i++) {
  QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
}
var i;
function QRPolynomial(num2, shift) {
  if (num2.length == void 0) {
    throw new Error(num2.length + "/" + shift);
  }
  var offset = 0;
  while (offset < num2.length && num2[offset] == 0) {
    offset++;
  }
  this.num = new Array(num2.length - offset + shift);
  for (var i = 0; i < num2.length - offset; i++) {
    this.num[i] = num2[i + offset];
  }
}
QRPolynomial.prototype = {
  get: function(index) {
    return this.num[index];
  },
  getLength: function() {
    return this.num.length;
  },
  multiply: function(e) {
    var num2 = new Array(this.getLength() + e.getLength() - 1);
    for (var i = 0; i < this.getLength(); i++) {
      for (var j = 0; j < e.getLength(); j++) {
        num2[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      }
    }
    return new QRPolynomial(num2, 0);
  },
  mod: function(e) {
    if (this.getLength() - e.getLength() < 0) {
      return this;
    }
    var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
    var num2 = new Array(this.getLength());
    for (var i = 0; i < this.getLength(); i++) {
      num2[i] = this.get(i);
    }
    for (var i = 0; i < e.getLength(); i++) {
      num2[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num2, 0).mod(e);
  }
};
function QRRSBlock(totalCount, dataCount) {
  this.totalCount = totalCount;
  this.dataCount = dataCount;
}
QRRSBlock.RS_BLOCK_TABLE = [
  // L
  // M
  // Q
  // H
  // 1
  [
    1,
    26,
    19
  ],
  [
    1,
    26,
    16
  ],
  [
    1,
    26,
    13
  ],
  [
    1,
    26,
    9
  ],
  // 2
  [
    1,
    44,
    34
  ],
  [
    1,
    44,
    28
  ],
  [
    1,
    44,
    22
  ],
  [
    1,
    44,
    16
  ],
  // 3
  [
    1,
    70,
    55
  ],
  [
    1,
    70,
    44
  ],
  [
    2,
    35,
    17
  ],
  [
    2,
    35,
    13
  ],
  // 4		
  [
    1,
    100,
    80
  ],
  [
    2,
    50,
    32
  ],
  [
    2,
    50,
    24
  ],
  [
    4,
    25,
    9
  ],
  // 5
  [
    1,
    134,
    108
  ],
  [
    2,
    67,
    43
  ],
  [
    2,
    33,
    15,
    2,
    34,
    16
  ],
  [
    2,
    33,
    11,
    2,
    34,
    12
  ],
  // 6
  [
    2,
    86,
    68
  ],
  [
    4,
    43,
    27
  ],
  [
    4,
    43,
    19
  ],
  [
    4,
    43,
    15
  ],
  // 7		
  [
    2,
    98,
    78
  ],
  [
    4,
    49,
    31
  ],
  [
    2,
    32,
    14,
    4,
    33,
    15
  ],
  [
    4,
    39,
    13,
    1,
    40,
    14
  ],
  // 8
  [
    2,
    121,
    97
  ],
  [
    2,
    60,
    38,
    2,
    61,
    39
  ],
  [
    4,
    40,
    18,
    2,
    41,
    19
  ],
  [
    4,
    40,
    14,
    2,
    41,
    15
  ],
  // 9
  [
    2,
    146,
    116
  ],
  [
    3,
    58,
    36,
    2,
    59,
    37
  ],
  [
    4,
    36,
    16,
    4,
    37,
    17
  ],
  [
    4,
    36,
    12,
    4,
    37,
    13
  ],
  // 10		
  [
    2,
    86,
    68,
    2,
    87,
    69
  ],
  [
    4,
    69,
    43,
    1,
    70,
    44
  ],
  [
    6,
    43,
    19,
    2,
    44,
    20
  ],
  [
    6,
    43,
    15,
    2,
    44,
    16
  ],
  // 11
  [
    4,
    101,
    81
  ],
  [
    1,
    80,
    50,
    4,
    81,
    51
  ],
  [
    4,
    50,
    22,
    4,
    51,
    23
  ],
  [
    3,
    36,
    12,
    8,
    37,
    13
  ],
  // 12
  [
    2,
    116,
    92,
    2,
    117,
    93
  ],
  [
    6,
    58,
    36,
    2,
    59,
    37
  ],
  [
    4,
    46,
    20,
    6,
    47,
    21
  ],
  [
    7,
    42,
    14,
    4,
    43,
    15
  ],
  // 13
  [
    4,
    133,
    107
  ],
  [
    8,
    59,
    37,
    1,
    60,
    38
  ],
  [
    8,
    44,
    20,
    4,
    45,
    21
  ],
  [
    12,
    33,
    11,
    4,
    34,
    12
  ],
  // 14
  [
    3,
    145,
    115,
    1,
    146,
    116
  ],
  [
    4,
    64,
    40,
    5,
    65,
    41
  ],
  [
    11,
    36,
    16,
    5,
    37,
    17
  ],
  [
    11,
    36,
    12,
    5,
    37,
    13
  ],
  // 15
  [
    5,
    109,
    87,
    1,
    110,
    88
  ],
  [
    5,
    65,
    41,
    5,
    66,
    42
  ],
  [
    5,
    54,
    24,
    7,
    55,
    25
  ],
  [
    11,
    36,
    12
  ],
  // 16
  [
    5,
    122,
    98,
    1,
    123,
    99
  ],
  [
    7,
    73,
    45,
    3,
    74,
    46
  ],
  [
    15,
    43,
    19,
    2,
    44,
    20
  ],
  [
    3,
    45,
    15,
    13,
    46,
    16
  ],
  // 17
  [
    1,
    135,
    107,
    5,
    136,
    108
  ],
  [
    10,
    74,
    46,
    1,
    75,
    47
  ],
  [
    1,
    50,
    22,
    15,
    51,
    23
  ],
  [
    2,
    42,
    14,
    17,
    43,
    15
  ],
  // 18
  [
    5,
    150,
    120,
    1,
    151,
    121
  ],
  [
    9,
    69,
    43,
    4,
    70,
    44
  ],
  [
    17,
    50,
    22,
    1,
    51,
    23
  ],
  [
    2,
    42,
    14,
    19,
    43,
    15
  ],
  // 19
  [
    3,
    141,
    113,
    4,
    142,
    114
  ],
  [
    3,
    70,
    44,
    11,
    71,
    45
  ],
  [
    17,
    47,
    21,
    4,
    48,
    22
  ],
  [
    9,
    39,
    13,
    16,
    40,
    14
  ],
  // 20
  [
    3,
    135,
    107,
    5,
    136,
    108
  ],
  [
    3,
    67,
    41,
    13,
    68,
    42
  ],
  [
    15,
    54,
    24,
    5,
    55,
    25
  ],
  [
    15,
    43,
    15,
    10,
    44,
    16
  ],
  // 21
  [
    4,
    144,
    116,
    4,
    145,
    117
  ],
  [
    17,
    68,
    42
  ],
  [
    17,
    50,
    22,
    6,
    51,
    23
  ],
  [
    19,
    46,
    16,
    6,
    47,
    17
  ],
  // 22
  [
    2,
    139,
    111,
    7,
    140,
    112
  ],
  [
    17,
    74,
    46
  ],
  [
    7,
    54,
    24,
    16,
    55,
    25
  ],
  [
    34,
    37,
    13
  ],
  // 23
  [
    4,
    151,
    121,
    5,
    152,
    122
  ],
  [
    4,
    75,
    47,
    14,
    76,
    48
  ],
  [
    11,
    54,
    24,
    14,
    55,
    25
  ],
  [
    16,
    45,
    15,
    14,
    46,
    16
  ],
  // 24
  [
    6,
    147,
    117,
    4,
    148,
    118
  ],
  [
    6,
    73,
    45,
    14,
    74,
    46
  ],
  [
    11,
    54,
    24,
    16,
    55,
    25
  ],
  [
    30,
    46,
    16,
    2,
    47,
    17
  ],
  // 25
  [
    8,
    132,
    106,
    4,
    133,
    107
  ],
  [
    8,
    75,
    47,
    13,
    76,
    48
  ],
  [
    7,
    54,
    24,
    22,
    55,
    25
  ],
  [
    22,
    45,
    15,
    13,
    46,
    16
  ],
  // 26
  [
    10,
    142,
    114,
    2,
    143,
    115
  ],
  [
    19,
    74,
    46,
    4,
    75,
    47
  ],
  [
    28,
    50,
    22,
    6,
    51,
    23
  ],
  [
    33,
    46,
    16,
    4,
    47,
    17
  ],
  // 27
  [
    8,
    152,
    122,
    4,
    153,
    123
  ],
  [
    22,
    73,
    45,
    3,
    74,
    46
  ],
  [
    8,
    53,
    23,
    26,
    54,
    24
  ],
  [
    12,
    45,
    15,
    28,
    46,
    16
  ],
  // 28
  [
    3,
    147,
    117,
    10,
    148,
    118
  ],
  [
    3,
    73,
    45,
    23,
    74,
    46
  ],
  [
    4,
    54,
    24,
    31,
    55,
    25
  ],
  [
    11,
    45,
    15,
    31,
    46,
    16
  ],
  // 29
  [
    7,
    146,
    116,
    7,
    147,
    117
  ],
  [
    21,
    73,
    45,
    7,
    74,
    46
  ],
  [
    1,
    53,
    23,
    37,
    54,
    24
  ],
  [
    19,
    45,
    15,
    26,
    46,
    16
  ],
  // 30
  [
    5,
    145,
    115,
    10,
    146,
    116
  ],
  [
    19,
    75,
    47,
    10,
    76,
    48
  ],
  [
    15,
    54,
    24,
    25,
    55,
    25
  ],
  [
    23,
    45,
    15,
    25,
    46,
    16
  ],
  // 31
  [
    13,
    145,
    115,
    3,
    146,
    116
  ],
  [
    2,
    74,
    46,
    29,
    75,
    47
  ],
  [
    42,
    54,
    24,
    1,
    55,
    25
  ],
  [
    23,
    45,
    15,
    28,
    46,
    16
  ],
  // 32
  [
    17,
    145,
    115
  ],
  [
    10,
    74,
    46,
    23,
    75,
    47
  ],
  [
    10,
    54,
    24,
    35,
    55,
    25
  ],
  [
    19,
    45,
    15,
    35,
    46,
    16
  ],
  // 33
  [
    17,
    145,
    115,
    1,
    146,
    116
  ],
  [
    14,
    74,
    46,
    21,
    75,
    47
  ],
  [
    29,
    54,
    24,
    19,
    55,
    25
  ],
  [
    11,
    45,
    15,
    46,
    46,
    16
  ],
  // 34
  [
    13,
    145,
    115,
    6,
    146,
    116
  ],
  [
    14,
    74,
    46,
    23,
    75,
    47
  ],
  [
    44,
    54,
    24,
    7,
    55,
    25
  ],
  [
    59,
    46,
    16,
    1,
    47,
    17
  ],
  // 35
  [
    12,
    151,
    121,
    7,
    152,
    122
  ],
  [
    12,
    75,
    47,
    26,
    76,
    48
  ],
  [
    39,
    54,
    24,
    14,
    55,
    25
  ],
  [
    22,
    45,
    15,
    41,
    46,
    16
  ],
  // 36
  [
    6,
    151,
    121,
    14,
    152,
    122
  ],
  [
    6,
    75,
    47,
    34,
    76,
    48
  ],
  [
    46,
    54,
    24,
    10,
    55,
    25
  ],
  [
    2,
    45,
    15,
    64,
    46,
    16
  ],
  // 37
  [
    17,
    152,
    122,
    4,
    153,
    123
  ],
  [
    29,
    74,
    46,
    14,
    75,
    47
  ],
  [
    49,
    54,
    24,
    10,
    55,
    25
  ],
  [
    24,
    45,
    15,
    46,
    46,
    16
  ],
  // 38
  [
    4,
    152,
    122,
    18,
    153,
    123
  ],
  [
    13,
    74,
    46,
    32,
    75,
    47
  ],
  [
    48,
    54,
    24,
    14,
    55,
    25
  ],
  [
    42,
    45,
    15,
    32,
    46,
    16
  ],
  // 39
  [
    20,
    147,
    117,
    4,
    148,
    118
  ],
  [
    40,
    75,
    47,
    7,
    76,
    48
  ],
  [
    43,
    54,
    24,
    22,
    55,
    25
  ],
  [
    10,
    45,
    15,
    67,
    46,
    16
  ],
  // 40
  [
    19,
    148,
    118,
    6,
    149,
    119
  ],
  [
    18,
    75,
    47,
    31,
    76,
    48
  ],
  [
    34,
    54,
    24,
    34,
    55,
    25
  ],
  [
    20,
    45,
    15,
    61,
    46,
    16
  ]
];
QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
  var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
  if (rsBlock == void 0) {
    throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
  }
  var length = rsBlock.length / 3;
  var list = new Array();
  for (var i = 0; i < length; i++) {
    var count = rsBlock[i * 3 + 0];
    var totalCount = rsBlock[i * 3 + 1];
    var dataCount = rsBlock[i * 3 + 2];
    for (var j = 0; j < count; j++) {
      list.push(new QRRSBlock(totalCount, dataCount));
    }
  }
  return list;
};
QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
  switch (errorCorrectLevel) {
    case QRErrorCorrectLevel.L:
      return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
    case QRErrorCorrectLevel.M:
      return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
    case QRErrorCorrectLevel.Q:
      return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
    case QRErrorCorrectLevel.H:
      return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
    default:
      return void 0;
  }
};
function QRBitBuffer() {
  this.buffer = new Array();
  this.length = 0;
}
QRBitBuffer.prototype = {
  get: function(index) {
    var bufIndex = Math.floor(index / 8);
    return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
  },
  put: function(num2, length) {
    for (var i = 0; i < length; i++) {
      this.putBit((num2 >>> length - i - 1 & 1) == 1);
    }
  },
  getLengthInBits: function() {
    return this.length;
  },
  putBit: function(bit) {
    var bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) {
      this.buffer.push(0);
    }
    if (bit) {
      this.buffer[bufIndex] |= 128 >>> this.length % 8;
    }
    this.length++;
  }
};

// js/html5-qrcode.js
function showQRCode(text) {
  var dotsize = 5;
  var padding = 10;
  var black = "rgb(0,0,0)";
  var white = "rgb(240,240,240)";
  var QRCodeVersion = 4;
  var canvas = document.createElement("canvas");
  var qrCanvasContext = canvas.getContext("2d");
  try {
    var qr = new QRCode(QRCodeVersion, QRErrorCorrectLevel.L);
    qr.addData(text);
    qr.make();
  } catch (err) {
    var errorChild = document.createElement("p");
    var errorMSG = document.createTextNode("QR Code FAIL! " + err);
    errorChild.appendChild(errorMSG);
    return errorChild;
  }
  var qrsize = qr.getModuleCount();
  canvas.setAttribute("height", qrsize * dotsize + padding);
  canvas.setAttribute("width", qrsize * dotsize + padding);
  var shiftForPadding = padding / 2;
  if (canvas.getContext) {
    for (var r = 0; r < qrsize; r++) {
      for (var c = 0; c < qrsize; c++) {
        if (qr.isDark(r, c)) qrCanvasContext.fillStyle = black;
        else qrCanvasContext.fillStyle = white;
        qrCanvasContext.fillRect(c * dotsize + shiftForPadding, r * dotsize + shiftForPadding, dotsize, dotsize);
      }
    }
  }
  var imgElement = document.createElement("img");
  imgElement.src = canvas.toDataURL("image/png");
  return imgElement;
}

// ts/layout.ts
var mediaQuery = () => window.matchMedia("(max-width: 670px)");
var defaultHeight = "500px";
mediaQuery().addEventListener("change", shrinkNames);
mediaQuery().addEventListener("change", recomputeHeight);
function divider(className) {
  const breaker = document.createElement("hr");
  breaker.className = "divider";
  if (![
    "enabled",
    "disabled"
  ].includes(className)) breaker.classList.add(className);
  return breaker;
}
function flatten(div, mode) {
  div.childNodes[1].classList.add("double");
  if (mode == "onlyMobile") {
    div.childNodes[1].classList.add("onlyMobile");
  }
  return div;
}
function multiColumn(div, columnCount = 2, extraStyle) {
  if (columnCount == 2) {
    div.childNodes[1].classList.add("double");
    div.classList.add("double");
  }
  if (columnCount == 3) {
    div.childNodes[1].classList.add("triple");
    div.classList.add("triple");
  }
  if (extraStyle != void 0) {
    div.childNodes[1].classList.add(extraStyle);
  }
  return div;
}
function permutations(input) {
  const results2 = [];
  if (input.length == 0) return [];
  if (input.length == 1) return [
    input
  ];
  for (let i = 0; i < input.length; i++) {
    const firstVal = input[i];
    const valsLeft = input.slice(0, i).concat(input.slice(i + 1));
    const innerPermutations = permutations(valsLeft) ?? [];
    for (let j = 0; j < innerPermutations.length; j++) {
      results2.push([
        firstVal
      ].concat(innerPermutations[j]));
    }
  }
  return results2;
}
function recomputeHeight(e) {
  const families = document.querySelectorAll(".family");
  if (e.matches == false || e.type == "DOMContentLoaded") {
    for (const family_div of families) {
      if (family_div.classList.contains("onlyMobile")) {
        family_div.style.height = "";
      } else {
        family_div.style.height = family_div.dataset.height_desktop ?? defaultHeight;
      }
    }
  } else {
    for (const family_div of families) {
      if (family_div.classList.contains("onlyDesktop")) {
        family_div.style.height = "";
      } else {
        family_div.style.height = family_div.dataset.height_mobile;
      }
    }
  }
}
function shrinkNames() {
  const width_check = function(span, element, width_select) {
    let width = element.offsetWidth;
    if (width_select == "inner") {
      width = span.offsetWidth;
    }
    return width;
  };
  const shrinker = function(element, nth, width_select, condensed_width) {
    const span = element.childNodes[nth];
    let width = width_check(span, element, width_select);
    if (width > condensed_width) {
      span.classList.add("condensed");
      span.classList.remove("ultraCondensed");
      width = width_check(span, element, width_select);
      if (width > condensed_width) {
        span.classList.add("ultraCondensed");
        span.classList.remove("condensed");
      }
    }
    const latin = Defaults.ranges["en"].some(function(range) {
      return range.test(span.innerText);
    });
    const cjk = Defaults.ranges["ja"].some(function(range) {
      return range.test(span.innerText);
    });
    if (latin && cjk) {
      span.classList.add("adjusted");
    }
  };
  const expander = function(element, nth) {
    const span = element.childNodes[nth];
    span.classList.remove("condensed");
    span.classList.remove("ultraCondensed");
    span.classList.remove("adjusted");
    const author_nodes2 = document.querySelectorAll(".caption.updateAuthor");
    const more_author_nodes2 = document.querySelectorAll(".caption.updateAuthorCredit");
    for (let caption of author_nodes2) {
      shrinker(caption, 0, "inner", 160);
    }
    for (let caption of more_author_nodes2) {
      shrinker(caption, 0, "inner", 160);
    }
  };
  let action = shrinker;
  if (mediaQuery().matches == false) action = expander;
  const link_nodes = document.querySelectorAll(".geneaologyListName");
  const birthday_nodes = document.querySelectorAll(".caption.birthdayMessage");
  const memorial_nodes = document.querySelectorAll(".caption.memorialMessage");
  const author_nodes = document.querySelectorAll(".caption.updateAuthor");
  const more_author_nodes = document.querySelectorAll(".caption.updateAuthorCredit");
  const media_author_nodes = document.querySelectorAll(".caption.groupMediaAuthor");
  for (const link of link_nodes) shrinker(link, 1, "outer", 125);
  for (const caption of birthday_nodes) action(caption, 0, "inner", 130);
  for (const caption of memorial_nodes) action(caption, 0, "inner", 130);
  for (const caption of author_nodes) action(caption, 0, "inner", 130);
  for (const caption of more_author_nodes) action(caption, 0, "inner", 130);
  for (const caption of media_author_nodes) action(caption, 0, "inner", 130);
}
var Layout = class {
  /**
   * All details of creating new content and arranging that content happens in
   * the `layout` namespace. This includes layout rules, list ordering, and the
   * actual HTMLNode containers of div contents.
   */
  layout = {
    /** 
     * Flex box order. Determines display groupings. In the arrange methods,
     * increment whenever we plan on making a new row.
     */
    boxOrder: 0,
    /**
     * Cutoffs for the number of columns in a multi-column list. `m[2] = 4`
     * here means a two-column list must have greater than 4 items in it.
     */
    cutoffs: [
      0,
      0,
      4,
      8,
      16
    ],
    /**
     * Distance in list-count since the last divider. When this gets to two,
     * or after a flat element, a divider should be added
     */
    distance: 0,
    /**
     * Modal check to add a divider to the layout flow. May be `true`/`false`,
     * `onlyMobile`, `onlyDesktop`, or `both` setting
     */
    dividerMode: "disabled",
    /**
     * Height values to apply to the family box/DOM node when in vertical-flow
     * mode on desktop. This is required for the flex box to properly flow the
     * child elements. The default values here are arbitrary!
     */
    height_desktop: defaultHeight,
    /**
     * Height values to apply to the family box/DOM node when in vertical-flow
     * mode on mobile. This is required for the flex box to properly flow the
     * child elements. The default values here are arbitrary!
     */
    height_mobile: defaultHeight,
    /** 
     * The default order of parents/litter/siblings/children in the flow of
     * the family box/DOM node
     */
    list_default: [
      "parents",
      "litter",
      "siblings",
      "children"
    ],
    /** 
     * The modified or selected order of parents/litter/siblings/children in
     * the flow of the family box/DOM node, with items removed if no siblings
     * or litter or children are known/present.
     */
    list_order: [
      "parents",
      "litter",
      "siblings",
      "children"
    ]
  };
  /** 
   * Number of animals for laying out in each of the parent, litter, siblings,
   * and children columns. If one parent is unknown, we insert a "star-parent"
   * 👩‍🎤👨‍🎤 entry and count that towards the layout totals here.
   */
  num = {
    children: 0,
    litter: 0,
    parents: 0,
    siblings: 0
  };
  /** 
   * The DOM nodes themselves for the parents, litter, siblings, and children
   * lists. They are all contained in the family DOM node once the layout code
   * has finished its job.
   */
  section = {};
  /** Set the initial layout state, and perform a layout computation */
  constructor(family, info, parents, litter, siblings, children) {
    const parentCount = info.dad.length > 1 || info.mom.length > 1 ? info.dad.length + info.mom.length : info.dad.length > 0 || info.mom.length > 0 ? 2 : 0;
    this.num = {
      parents: parentCount,
      litter: info.litter.length,
      siblings: info.siblings.length,
      children: info.children.length
    };
    this.section = {
      children,
      family,
      litter,
      parents,
      siblings
    };
    const sum = this.sum();
    const orders = permutations(this.layout.list_order);
    let arrangeId = void 0;
    for (const order of orders) {
      this.layout.list_order = order;
      const test = `div${sum}_${order.map((list) => this.num[list]).join("_")}`;
      if (test in this.switchboard) {
        arrangeId = test;
        break;
      }
    }
    if (arrangeId != void 0) {
      this.switchboard[arrangeId]();
    } else {
      this.arrange.default();
    }
    return this;
  }
  /** Get the number of non-empty columns */
  existingColumns() {
    return Object.values(this.num).filter((a) => a != 0).length;
  }
  /** Find the list with the most pandas in it */
  longestList() {
    return Object.values(this.num).reduce((a, b) => a > b ? a : b);
  }
  /**
   * In the cutoff array that describes how many columns to use, find the first
   * value greater than the number of elements in the list you're measuring.
   * Then, step back one entry in that array, and that index to the cutoff
   * array becomes the CSS column-count for the list.
   * 
   * In other words, the cutoff column reads the number of list items underneath
   * which it should remain in n columns.
   */
  multiColumnCount(list_len) {
    const cutoffs = this.layout.cutoffs;
    return cutoffs.indexOf(cutoffs.filter((x) => x >= list_len)[0]) - 1;
  }
  /**
   * Clear state after doing a layout operation. Partial clears are useful
   * after adding a divider, so support that as the default.
   */
  resetCounters(mode = "partial") {
    if (mode == "all") {
      this.layout.boxOrder = 0;
      this.layout.list_order = this.layout.list_default;
    }
    this.layout.distance = 0;
    this.layout.dividerMode = "disabled";
  }
  /** 
   * A layout sum of parents, litter, siblings, and children. This includes
   * "star-parents 👩‍🎤👨‍🎤" which are unknown.
   */
  sum() {
    return this.num.parents + this.num.litter + this.num.siblings + this.num.children;
  }
  /** 
   * Lots of different layout arrangements, which are grouped inside this
   * namespace, all so we can operate on a specific instance of layout state
   * for any given search result card.
   */
  arrange = {
    /** 
     * This may be the basis of a basic layout which takes arguments:
     * _flattenTop_, _multiColumn_, _others_.
     * Take all inputs and display as straight columns.
     */
    columns: (nobreak = false) => {
      const lists = this.layout.list_default.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        this.section.family.append(cur_list);
        this.layout.distance++;
        if (this.layout.distance == 2 && nobreak != true) {
          const breaker = divider("onlyMobile");
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
        }
      }
      this.resetCounters("all");
    },
    /**
     * Take the longest column and make into a multicolumn list. Any other
     * columns that exist should be displayed as straight columns. Mode can
     * be "onlyMobile", "onlyDesktop", or "both".
     * TODO: have modes for both the breakers and the multicolumn classes
     */
    oneMultiColumn: (columns = 0, breaker_mode = "enabled", column_mode = "enabled") => {
      let breaking_style = breaker_mode;
      const order = this.layout.list_default.filter((x) => this.section[x] != void 0);
      const lists = this.layout.list_default.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        const list_name = order[i];
        const list_len = this.num[list_name];
        if (list_len == this.longestList()) {
          let mc_count = columns;
          if (mc_count == 0) mc_count = this.multiColumnCount(list_len);
          multiColumn(cur_list, mc_count);
          this.layout.dividerMode = column_mode;
          breaking_style = column_mode;
        }
        this.section.family.append(cur_list);
        this.layout.distance++;
        if (this.layout.distance == 2 || this.layout.dividerMode != "disabled") {
          const breaker = divider(breaking_style);
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
          breaking_style = breaker_mode;
        }
      }
      this.resetCounters("all");
    },
    /**
     * Turn all lists into multi-columns on mobile, while only doing the long
     * lists as multi-column on the desktop.
     */
    allMultiColumns: (columns = 0, breaker_mode = "enabled", column_mode = "enabled") => {
      let breaking_style = breaker_mode;
      const order = this.layout.list_default.filter((x) => this.section[x] != void 0);
      const lists = this.layout.list_default.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        const list_name = order[i];
        const list_len = this.num[list_name];
        if (list_len <= 2) {
          multiColumn(cur_list, 2, "onlyMobile");
        } else {
          let mc_count = columns;
          if (mc_count == 0) mc_count = this.multiColumnCount(list_len);
          multiColumn(cur_list, mc_count);
        }
        this.layout.dividerMode = column_mode;
        breaking_style = column_mode;
        this.section.family.append(cur_list);
        this.layout.distance++;
        if (this.layout.distance == 2 || this.layout.dividerMode != "disabled") {
          const breaker = divider(breaking_style);
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
          breaking_style = breaker_mode;
        }
      }
      this.resetCounters("all");
    },
    /** Flatten a single column (the first one) both on mobile and desktop */
    flattenSimple: (mode = "onlyMobile") => {
      const lists = this.layout.list_default.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        if (i == 0) {
          flatten(cur_list, mode);
          this.layout.dividerMode = mode;
        }
        this.section.family.append(cur_list);
        this.layout.distance++;
        if (this.layout.distance == 2 || this.layout.dividerMode != "disabled") {
          const breaker = divider("onlyMobile");
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
        }
      }
      this.resetCounters("all");
    },
    /** 
     * Combination of flattenTop and multiColumn.
     * 
     * TODO: need desktop or mobile modal flags for BOTH the flattening and the
     * multicolumn mode
     */
    flattenPlusMultiColumn: (columns = 0, breaker_mode = "enabled", column_mode = "enabled") => {
      let breaking_style = breaker_mode;
      const order = this.layout.list_default.filter((x) => this.section[x] != void 0);
      const lists = this.layout.list_default.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        const list_name = order[i];
        const list_len = this.num[list_name];
        if (i == 0) flatten(cur_list, "onlyMobile");
        let mc_count = columns;
        if (mc_count == 0) mc_count = this.multiColumnCount(list_len);
        if (list_len == this.longestList()) {
          multiColumn(cur_list, mc_count);
          this.layout.dividerMode = column_mode;
          breaking_style = column_mode;
        }
        this.section.family.append(cur_list);
        this.layout.distance++;
        if ((this.layout.distance == 2 || this.layout.dividerMode != "disabled") && i != lists.length - 1) {
          const breaker = divider(breaking_style);
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
          breaking_style = breaker_mode;
        }
      }
      this.resetCounters("all");
    },
    /**
     * For a four-column layout with 2, 2, 1, long orientation, we want a
     * three-multicolumn on desktop, and a two-multicolumn on mobile. Put the
     * two-width lists first, followed by the one-width lists, and then lastly,
     * the long list. If it's a 2, 1, 1 orientation, flatten the parents list.
     */
    fourListOneLong: () => {
      const order = this.layout.list_default.filter((x) => this.section[x] != void 0);
      order.sort((a, b) => this.num[b] > this.num[a] ? 1 : -1);
      order.push(order[0]);
      order.shift();
      order.splice(order.indexOf("parents"), 1);
      order.unshift("parents");
      const lists = order.map((x) => this.section[x]).filter((x) => x != void 0);
      for (let i = 0; i < lists.length; i++) {
        const cur_list = lists[i];
        cur_list.style.order = `${this.layout.boxOrder++}`;
        const list_name = order[i];
        const list_len = this.num[list_name];
        if (this.num[order[1]] == 1 && this.num[order[2]] == 1 && i == 0) {
          flatten(cur_list, "onlyMobile");
        }
        const mc_count = 3;
        if (list_len == this.longestList()) {
          multiColumn(cur_list, mc_count);
        }
        this.section.family.append(cur_list);
        this.layout.distance++;
        if ((this.layout.distance == 3 || this.layout.dividerMode != "disabled") && i != lists.length - 1) {
          const breaker = divider("both");
          breaker.style.order = `${this.layout.boxOrder++}`;
          this.section.family.append(breaker);
          this.resetCounters("breakers");
        }
      }
      this.resetCounters("all");
    },
    /**
     * Four-column layouts are the trickiest, and when two of those columns are
     * very long, we need to do a multi-column flow where the short columns
     * squeeze left, and the longer ones get flattened into 2-wide-multicols or
     * 3-wide-multicols.
     */
    fourListTwoLong: (mode = "onlyDesktop") => {
      this.section.family.classList.add("vertical");
      if (mode == "onlyDesktop") {
        this.section.family.classList.add(mode);
      }
      this.balance.verticalTwoMultiColumns();
      for (let i = 0; i < this.layout.list_order.length; i++) {
        const list_name = this.layout.list_order[i];
        const cur_list = this.section[list_name];
        if (!cur_list) continue;
        const list_len = this.num[list_name];
        if (list_len >= 3 && list_name != "litter") {
          multiColumn(cur_list);
        } else if (i == 3 && list_len > 1) {
          multiColumn(cur_list);
        }
        cur_list.style.order = `${this.layout.boxOrder++}`;
        this.section.family.append(cur_list);
      }
      if (mediaQuery().matches == false) {
        this.section.family.style.height = this.layout.height_desktop;
        this.section.family.dataset.height_desktop = this.layout.height_desktop;
      }
      this.resetCounters("all");
    },
    /** 
     * When sparse columns stacked up may be nearly as long as a third column,
     * kick the little ones out and let the longer column run. If a fourth
     * column appears, display it underneath the long column.
     * 
     * hr/line breaks in vertical flow don't work. Uses a height constraint to
     * influence the final displayed flow. Also see the mediaQuery event
     * listeners in this module.
     */
    longRun: (mode = "onlyMobile") => {
      this.section.family.classList.add("vertical");
      if (mode == "onlyMobile") {
        this.section.family.classList.add(mode);
      }
      this.balance.verticalMobile();
      for (let i = 0; i < this.layout.list_order.length; i++) {
        const list_name = this.layout.list_order[i];
        const cur_list = this.section[list_name];
        if (!cur_list) continue;
        cur_list.style.order = `${this.layout.boxOrder++}`;
        this.section.family.append(cur_list);
      }
      if (mediaQuery().matches == true) this.section.family.style.height = this.layout.height_mobile;
      this.section.family.dataset.height_mobile = this.layout.height_mobile;
      this.resetCounters("all");
    },
    /**
     * With three columns, and one of them long, we often need to flow two of
     * them into a single column. On mobile row-flow might be fine, but on desktop, 
     * column-flow is preferable. We still need multi-column lists though, and
     * calculating the list heights will depend on how flattened these multicolumn
     * lists might be. Assumes the multi-column list is only two-wide, since the
     * first column is already used by two short columns.
     */
    threeListOneLong: (mode = "onlyDesktop") => {
      this.section.family.classList.add("vertical");
      if (mode == "onlyDesktop") {
        this.section.family.classList.add(mode);
      }
      this.balance.verticalOneMultiColumn(2);
      for (let i = 0; i < this.layout.list_order.length; i++) {
        const list_name = this.layout.list_order[i];
        const cur_list = this.section[list_name];
        if (!cur_list) continue;
        const list_len = this.num[list_name];
        if (list_len == this.longestList()) {
          multiColumn(cur_list, 2);
          cur_list.style.order = `${this.existingColumns()}`;
        } else {
          cur_list.style.order = `${this.layout.boxOrder++}`;
        }
        this.section.family.append(cur_list);
      }
      if (mediaQuery().matches == false) this.section.family.style.height = this.layout.height_desktop;
      this.section.family.dataset.height_desktop = this.layout.height_desktop;
      this.resetCounters("all");
    },
    /**
     * If the switchboard lookup finds no arrangement, use these default
     * heuristics:
     * 
     * Two columns, one short and one long? `flattenTopMultiColumn`
     * 
     * Similar columns no deeper than four? `columns`
     * 
     * A long column, two shorts, and long column is 8 or less? `longRun`
     * 
     * A long column, two shorts, and long column is 9 or more: `multiColumn`
     * 
     * Two long columns, shorter <= 5, longest >= 8? `longRun`
     * 
     * A long column of 9+? Take all columns >= 5 and `multiColumn` them
     */
    default: () => {
      if (this.longestList() > 4 && this.existingColumns() == 1) {
        return this.arrange.oneMultiColumn();
      } else if (this.longestList() <= 6 && this.existingColumns() == 3) {
        return this.arrange.longRun("onlyMobile");
      } else if (this.longestList() >= 8 && this.existingColumns() == 4 && this.sum() - this.longestList() >= this.longestList()) {
        return this.arrange.fourListTwoLong("onlyDesktop");
      } else if (this.longestList() >= 8 && this.existingColumns() == 4 && this.sum() - this.longestList() <= 5) {
        return this.arrange.fourListOneLong();
      } else if (this.longestList() >= 8 && this.existingColumns() == 3 && this.sum() - this.longestList() >= this.longestList()) {
        return this.arrange.longRun("onlyMobile");
      } else if (this.longestList() <= 9 && this.existingColumns() == 4) {
        return this.arrange.longRun("onlyMobile");
      } else if (this.longestList() > 9 && this.existingColumns() == 4) {
        return this.arrange.fourListTwoLong("onlyDesktop");
      } else if (this.longestList() > 5 && this.existingColumns() == 3 && this.sum() - this.longestList() <= 4) {
        return this.arrange.threeListOneLong("onlyDesktop");
      } else if (this.longestList() > 5 && this.existingColumns() == 3 && this.sum() - this.longestList() - 2 >= 3) {
        return this.arrange.longRun("onlyMobile");
      } else if (this.longestList() > 5 && this.existingColumns() == 2 && this.sum() - this.longestList() <= 2) {
        return this.arrange.flattenPlusMultiColumn(2);
      } else {
        return this.arrange.columns();
      }
    }
  };
  /** 
   * Namespace for instance methods that calculate height estimates and
   * multi-column split points.
   */
  balance = {
    /**
     * Given a multicolumn mobile layout with two lanes for lists, determine
     * the optimal balance of column content. The parents will always appear
     * first, but other elements can have line breaks inserted to change the
     * balance. This will change the layout.list_order. Returns the split point
     * for displaying the columns we want, and sets the max `layout.height_*`.
     */
    verticalMobile: () => {
      const valid_list = this.layout.list_default.filter((x) => this.num[x] != 0);
      const listPermutations = permutations(valid_list).filter((x) => x[0] == valid_list[0]);
      const between_list_pad = 2;
      const line_height = "35px";
      const list_count_height = "22px";
      let minimum_space = Math.pow(2, 32) - 1;
      let minimum_split = Math.floor(valid_list.length / 2);
      for (const list_order of listPermutations) {
        for (const list_name of list_order) {
          if (list_name == list_order[list_order.length - 1]) {
            break;
          }
          const split_point = list_order.indexOf(list_name);
          const left_no_lists = split_point + 1;
          const right_no_lists = list_order.length - left_no_lists;
          const left_padding = between_list_pad * (left_no_lists - 1);
          const right_padding = between_list_pad * (right_no_lists - 1);
          const left_lists = list_order.slice(0, split_point + 1);
          const right_lists = list_order.slice(split_point + 1, this.layout.list_default.length + 1);
          const left_sum = left_lists.map((x) => this.num[x]).reduce((acc, cv) => acc + cv) + left_padding;
          const right_sum = right_lists.map((x) => this.num[x]).reduce((acc, cv) => acc + cv) + right_padding;
          const difference = Math.abs(right_sum - left_sum);
          if (difference == 0) {
            this.layout.list_order = list_order;
            minimum_split = split_point;
            const longest = left_sum > right_sum ? left_sum : right_sum;
            const longest_list_count = left_lists.length > right_lists.length ? left_lists.length : right_lists.length;
            this.layout.height_mobile = `${longest * parseInt(line_height) + longest_list_count * parseInt(list_count_height)}px`;
            return minimum_split;
          } else if (difference < minimum_space) {
            this.layout.list_order = list_order;
            minimum_space = difference;
            minimum_split = split_point;
            const longest = left_sum > right_sum ? left_sum : right_sum;
            const longest_list_count = left_lists.length > right_lists.length ? left_lists.length : right_lists.length;
            this.layout.height_mobile = `${longest * parseInt(line_height) + longest_list_count * parseInt(list_count_height)}px`;
          } else {
            continue;
          }
        }
      }
      return minimum_split;
    },
    /** Hacky calculation for vertical balance of multicolumn vertical flow */
    verticalOneMultiColumn: (multi_cols) => {
      const between_list_pad = 2;
      const line_height = "42px";
      const list_count_height = "30px";
      this.layout.list_order = this.layout.list_default.filter((x) => this.num[x] != 0);
      const squeeze_count = this.existingColumns() > 3 ? 3 : 2;
      const padding = between_list_pad * (parseInt(list_count_height) * squeeze_count);
      const squeeze_num = this.sum() - this.longestList();
      const squeeze_height = padding + squeeze_num * parseInt(line_height);
      const multi_column_cnt = Math.ceil(this.longestList() / multi_cols);
      const multi_column_height = multi_column_cnt * parseInt(line_height);
      if (multi_column_height > squeeze_height) {
        this.layout.height_desktop = `${multi_column_height}px`;
        return 2;
      } else {
        this.layout.height_desktop = `${squeeze_height}px`;
        return 0;
      }
    },
    /** 
     * Even hackier vertical balancing of two multicolumns. Assume the
     * multicolumns are two-wide, and that they're taller than the left gutter
     */
    verticalTwoMultiColumns: () => {
      this.layout.list_order = this.layout.list_default;
      const between_list_pad = 3;
      const line_height = "40px";
      const list_count_height = "40px";
      const sibling_col_cnt = 2;
      const children_col_cnt = 2;
      const siblings_num = Math.ceil(this.num.siblings / sibling_col_cnt);
      const children_num = Math.ceil(this.num.children / children_col_cnt);
      const siblings_height = siblings_num * parseInt(line_height);
      const children_height = children_num * parseInt(line_height);
      const padding = between_list_pad * parseInt(list_count_height);
      this.layout.height_desktop = `${siblings_height + children_height + padding}px`;
      return 2;
    }
  };
  /**
   * The arrangement switchboard, a shortcut for specific arrangements that
   * are known to be good and working for specific panda result cards.
   */
  switchboard = {
    /** One list item? Simple column layout is fine. */
    div1_1_0_0_0: () => this.arrange.columns(),
    /** Two list items, flattened to save space. TEST: Harumaki (0001) */
    div2_2_0_0_0: () => this.arrange.flattenSimple("enabled"),
    /** Two list items, in their own columns. */
    div2_1_1_0_0: () => this.arrange.columns(),
    /** Three list item arrangements all use column mode. */
    div3_2_1_0_0: () => this.arrange.columns(),
    div3_0_1_1_1: () => this.arrange.columns(),
    div3_0_0_3_0: () => this.arrange.columns(),
    div3_3_0_0_0: () => this.arrange.columns(),
    /** 
     * Four list items. Two parents and two in a second column. 
     * TEST: Shizuku (0138)
     */
    div4_2_2_0_0: () => this.arrange.columns(),
    /** Four list items. Two in one category and singles. */
    div4_2_1_1_0: () => this.arrange.longRun("onlyMobile"),
    // Four list items. Three in one category
    div4_0_0_3_1: () => this.arrange.columns(),
    /** Four list items. Longer lists will get multiColumn'ed. */
    div4_0_0_4_0: () => this.arrange.columns(),
    /** Four list items. Possible parents */
    div4_4_0_0_0: () => this.arrange.columns(),
    /** Five list items. Two parents and three in a second column. TEST: Keti */
    div5_2_0_3_0: () => this.arrange.columns(),
    /** 
     * Five list items. Two parents and a two/one split.
     * TODO: consider flattenTop for this style of layout
     */
    div5_2_2_1_0: () => this.arrange.longRun("onlyMobile"),
    /** Five list items. Two parents and three other columns */
    div5_2_1_1_1: () => this.arrange.longRun("onlyMobile"),
    /** Five list items. Four in one list, and a fifth */
    div5_0_0_4_1: () => this.arrange.columns(),
    /** Six list items. Two parents and others in a single column */
    div6_2_0_4_0: () => this.arrange.columns(),
    /** Six list items. Two parents and a short split */
    div6_2_1_3_0: () => this.arrange.longRun("onlyMobile"),
    /** Six list items. Two parents and even columns. TEST: Asahi (0261) */
    div6_2_2_2_0: () => this.arrange.flattenSimple("onlyMobile"),
    /** Six list items. Two parents and spread */
    div6_2_2_1_1: () => this.arrange.columns(),
    /** Six list items. Mostly or all in one column */
    div6_0_0_5_1: () => this.arrange.oneMultiColumn(2),
    /** Six list items. All in two columns */
    div6_0_0_3_3: () => this.arrange.columns(),
    /** Seven list items. Parents, litter, and three siblings */
    div7_2_2_3_0: () => this.arrange.longRun("onlyMobile"),
    /** Seven list items. parents/litter/siblings/children, straight columns */
    div7_2_2_2_1: () => this.arrange.columns(),
    /** 
     * Seven list items. A predominant list with parents. The three item list is
     * last, but we can shift it up a little. TEST: Gin (0017)
     */
    div7_2_1_3_1: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Seven list items. A predominant list with no litter. Place the one below
     * the parents, and the four kicked right.
     */
    div7_2_0_4_1: () => this.arrange.longRun("onlyMobile"),
    /** Eight list items. Two animals per list type */
    div8_2_2_2_2: () => this.arrange.columns(),
    /** Eight list items. Mostly balanced but a three-and-one on the right */
    div8_2_2_3_1: () => this.arrange.longRun("onlyMobile"),
    /** Eight list items, a long column and two shorties */
    div8_2_2_4_0: () => this.arrange.longRun("onlyMobile"),
    div8_2_1_5_0: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Eight list items. Do the four column below the one, but kick it up.
     * TEST: Mitarashi (0282)
     */
    div8_2_1_4_1: () => this.arrange.longRun("onlyMobile"),
    /** Nine items. Do a balancing act. TEST: Shiratama (0285) */
    div9_2_1_4_2: () => this.arrange.longRun("onlyMobile"),
    /** Nine list items. Two single columns sneaking on the left */
    div9_2_1_5_1: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Nine list items. A long column goes multiColumn. On mobile the broader
     * multicolumn lists should shrink down to two columns
     */
    div9_2_2_5_0: () => this.arrange.oneMultiColumn(2, "onlyMobile", "onlyMobile"),
    /** 
     * Nine list items. Parents and two similar length lists. TEST: Mugi (0005)
     */
    div9_2_0_3_4: () => this.arrange.flattenSimple("onlyMobile"),
    /** 
     * Nine list items. Multi-column, and flow the smaller ones left.
     * TEST: Furin (0085)
     */
    div9_2_1_6_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Wouldn't normally flatten the one. Might not need this */
    div9_0_0_8_1: () => this.arrange.flattenPlusMultiColumn(3),
    /** Ten list items. Parents and balanced elsewhere */
    div10_2_0_4_4: () => this.arrange.flattenSimple("onlyMobile"),
    /** Ten list items. Spread out evenly and wide */
    div10_2_2_3_3: () => this.arrange.columns(),
    /** Ten list items. Balance these */
    div10_2_1_4_3: () => this.arrange.longRun("onlyMobile"),
    /** Ten list items. Flatten the top, and multicolumn the largest one */
    div10_2_2_5_1: () => this.arrange.flattenPlusMultiColumn(2),
    /** Another arrangement of that 10 looks better a different way */
    div10_2_1_5_2: () => this.arrange.longRun("onlyMobile"),
    /** 
     * Ten list items. Balanced lists and a muticolumn
     * TODO: On mobile, flatten all the short columns.
     */
    div10_2_2_6_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Ten list items. Sneak the singles down the left */
    div10_2_1_6_1: () => this.arrange.longRun("onlyMobile"),
    /** Ten list items. Too long to be a long run. TEST: Fuuna (0045) */
    div10_2_0_7_1: () => this.arrange.threeListOneLong("onlyDesktop"),
    /** Ten list items. No parents layout, even stevens. Spread out on desktop */
    div10_0_0_5_5: () => this.arrange.oneMultiColumn(2, "onlyDesktop"),
    /**
     * Ten list items. On mobile this looks fine as two columns.
     * On desktop the multicolumn div needs to be split out.
     */
    div10_0_0_6_4: () => this.arrange.oneMultiColumn(2, "onlyDesktop"),
    /** Ten list items. Seven-long columns are too much. */
    div10_0_0_7_3: () => this.arrange.flattenPlusMultiColumn(2, "onlyMobile"),
    /** 
     * Eleven items: force a two-column flatten, since 9 will default to 3
     * columns otherwise
     */
    div11_2_0_9_0: () => this.arrange.flattenPlusMultiColumn(2),
    div11_2_2_7_0: () => this.arrange.threeListOneLong("onlyDesktop"),
    /**
     * Eleven items: do a vertical flow on desktop and mobile
     * TODO: vertical flow on desktop and mobile. Different heights stored.
     * Adjust other code to use special heights for mobile versus desktop.
     * TEST: Yan-Yan (0112)
     */
    // div11_2_1_3_5: () => this.arrange.verticalFlow(),
    /** Twelve items: Force multicolumns to be just two wide */
    div12_2_1_9_0: () => this.arrange.threeListOneLong("onlyDesktop")
  };
};
var layout_default = Layout;

// ts/options.ts
var Data = {
  hideDeadPandas: false
};
function init2() {
  load();
}
function update(func) {
  func(Data);
  save();
  window.dispatchEvent(new Event("options_updated"));
}
function save() {
  window.localStorage.setItem("options", JSON.stringify(Data));
}
function load() {
  const localSavedOptions = window.localStorage.getItem("options");
  if (localSavedOptions !== null) {
    Data = JSON.parse(localSavedOptions);
  }
}

// ts/show.ts
function acquirePandaInfo(animal) {
  const chosen_index = environment_default.specific_photo == void 0 ? "random" : parseInt(environment_default.specific_photo);
  const picture = profilePhoto(animal, chosen_index);
  let bundle = {
    "_id": animal._id,
    "age": age(animal),
    "birthday": birthday(animal),
    "birthplace": myZoo(animal, "birthplace"),
    "children": searchPandaChildren(animal._id),
    "death": date(animal, "death"),
    "dad": searchPandaDad(animal._id),
    "gender": gender(animal),
    "language_order": language_order(animal),
    "litter": searchLitter(animal._id),
    "mom": searchPandaMom(animal._id),
    "name": fallback_name(animal),
    "othernames": othernames(animal),
    "photo": picture.url,
    "photo_credit": picture.author,
    "photo_index": picture.index,
    "photo_link": picture.reference,
    "photos": animal.photos,
    "search_context": animal["search_context"],
    "siblings": searchNonLitterSiblings(animal._id),
    "species": species(animal),
    "type": "panda",
    "wild": myWild(animal, "wild"),
    "zoo": myZoo(animal, "zoo")
  };
  bundle = fallbackInfo(bundle, animal);
  animal["search_context"] = void 0;
  return bundle;
}
function acquireLocationList(animal) {
  const raw_locations = locationList(animal);
  const history2 = raw_locations.map((location1) => getLocationBundle(location1));
  return history2;
}
function getLocationBundle(location1) {
  const entity = graphId(location1.id);
  if (entity == void 0) return getUnknownLocationBundle(location1);
  const enriched = fallbackEntity(entity);
  const locationField = entity.type == "zoo" ? zooField(entity, "location")[environment_default.language] : wildField(entity, "location")[environment_default.language];
  return {
    "_id": enriched._id,
    "end_date": formatDate(location1["end_date"]),
    "language_order": language_order(enriched),
    "location": locationField,
    "name": fallback_name(enriched),
    "start_date": formatDate(location1["start_date"])
  };
}
function getUnknownLocationBundle(location1) {
  const defaultId = location1.id.startsWith("zoo") ? Defaults.zoo._id : Defaults.wild._id;
  return {
    "_id": defaultId,
    "end_date": formatDate(location1["end_date"]),
    "language_order": [],
    "start_date": formatDate(location1["start_date"])
  };
}
function acquireZooInfo(zoo) {
  const animals = searchPandaZooCurrent(zoo._id);
  const chosen_index = environment_default.specific_photo == void 0 ? "random" : parseInt(environment_default.specific_photo);
  const picture = profilePhoto(zoo, chosen_index);
  const recorded = searchPandaZooBornLived(zoo._id);
  let bundle = {
    "_id": zoo._id,
    "animals": animals,
    "address": zooField(zoo, "address")[environment_default.language],
    "animal_count": animals.length,
    "closed": zooField(zoo, "closed"),
    "language_order": language_order(zoo),
    "location": zooField(zoo, "location")[environment_default.language],
    "map": zooField(zoo, "map"),
    "name": fallback_name(zoo),
    "photo": picture.url,
    "photo_credit": picture.author,
    "photo_index": picture.index,
    "photo_link": picture.reference,
    "photos": zoo.photos,
    "recorded": recorded,
    "recorded_count": recorded.length,
    "type": "zoo",
    "website": zooField(zoo, "website")
  };
  bundle = fallbackInfo(bundle, zoo);
  return bundle;
}
function animalLink(animal, link_text, options2) {
  if (animal._id == Defaults.animal._id) {
    let alien = Emoji.alien;
    if (options2.indexOf("mom_icon") != -1) alien = Emoji.star_mom;
    if (options2.indexOf("dad_icon") != -1) alien = Emoji.star_dad;
    return emptyLink(alien + "\xA0" + link_text);
  }
  const gender3 = gender(animal);
  const a = document.createElement("a");
  a.className = "geneaologyListName";
  const name_span = document.createElement("span");
  const inner_text = link_text;
  let gender_text = "";
  let trailing_text = "";
  if (options2.includes("child_icon")) gender_text = childIcon(gender3) + "\xA0";
  if (options2.includes("mom_icon")) gender_text = Emoji.mother + "\xA0";
  if (options2.includes("dad_icon")) gender_text = Emoji.father + "\xA0";
  if (options2.includes("question_icon")) gender_text = gender_text.replace("\xA0", "") + Emoji.question + "\xA0";
  if (options2.indexOf("half_icon") != -1) trailing_text = trailing_text + "\u200A\xBD";
  if (options2.indexOf("live_icon") != -1 && "death" in animal) {
    a.classList.add("passedAway");
    trailing_text = trailing_text + "\u200A" + Emoji.died;
  }
  name_span.innerText = inner_text;
  a.append(gender_text);
  a.appendChild(name_span);
  a.append(trailing_text);
  if (options2.indexOf("in_link") != -1) {
    a.href = `#panda_${num(animal._id)}`;
  } else {
    a.href = `#panda/${num(animal._id)}`;
    a.addEventListener("click", topButton.action);
  }
  return a;
}
function appleLink(info, container_element) {
  const other_photos = document.createElement(container_element);
  const credit_count_link = document.createElement("a");
  credit_count_link.id = `${num(info._id)}/counts/${info.photo_index}`;
  credit_count_link.href = `#credit/${info.photo_credit}`;
  if (Object.keys(Defaults.authors).includes(info.photo_credit)) {
    credit_count_link.removeAttribute("href");
    credit_count_link.innerText = "";
  } else if (Object.values(Gui.contribute).includes(info.photo_credit)) {
    return other_photos;
  } else {
    const apple_count = pandas_default.db._photo.credit[info.photo_credit];
    credit_count_link.innerText = `${Emoji.gift} ${apple_count}`;
    if (apple_count >= 1e3) credit_count_link.innerText = `${Emoji.megagift}  ${apple_count}`;
  }
  other_photos.appendChild(credit_count_link);
  return other_photos;
}
function birthday2(info) {
  const birthday4 = `${Emoji.born} ${info.birthday}`;
  let parentheses = void 0;
  if (info.death == Defaults.unknown[environment_default.language]) parentheses = `(${info.age})`;
  else parentheses = `${Emoji.died} ${info.death}`;
  return [
    birthday4,
    parentheses
  ];
}
function childIcon(gender3) {
  if (Object.values(Defaults.gender.Male).includes(gender3)) return Emoji.boy;
  else if (Object.values(Defaults.gender.Female).includes(gender3)) return Emoji.girl;
  else return Emoji.baby;
}
function creditLink(info, container_element) {
  const credit_link = document.createElement("a");
  credit_link.id = `${num(info._id)}/author/${info.photo_index}`;
  credit_link.target = "_blank";
  credit_link.href = authorLink(info.photo_credit, info.photo_link);
  if (Object.keys(Defaults.authors).includes(info.photo_credit)) {
    credit_link.innerText = `${Emoji.camera} ${Defaults.authors[info.photo_credit][environment_default.language]}`;
    credit_link.removeAttribute("href");
  } else if (info.photo_credit != void 0) {
    credit_link.innerText = `${Emoji.camera} ${info.photo_credit}`;
  } else {
    credit_link.innerText = `${Emoji.camera} ${Gui.contribute[environment_default.language]}\xA0`;
    credit_link.href = Gui.contribute_link[environment_default.language];
  }
  const container = document.createElement(container_element);
  container.appendChild(credit_link);
  return container;
}
function emptyLink(output_text) {
  const a = document.createElement("a");
  const span = document.createElement("span");
  span.innerText = output_text;
  a.appendChild(span);
  a.href = "#not_sure_yet";
  return a;
}
function emptyResult(chosen_message = Text.no_result) {
  const message = document.createElement("div");
  message.className = "overlay";
  message.innerText = chosen_message[environment_default.language];
  const image = document.createElement("img");
  image.src = "images/no-panda.jpg";
  const result2 = document.createElement("div");
  result2.className = "emptyResult";
  result2.appendChild(image);
  result2.appendChild(message);
  return result2;
}
function fade(el) {
  if (!el) return;
  let op = 1;
  if (el.style.display == "none" || el.style.display == "") el.style.display = "block";
  else {
    el.style.opacity = op.toString();
    return;
  }
  const timer = setInterval(() => {
    if (op <= 0.05) {
      clearInterval(timer);
      el.style.display = "none";
    }
    el.style.opacity = op.toString();
    el.style.filter = `alpha(opacity=${op * 100})`;
    op -= 0.1;
  }, 40);
}
function furigana(name, othernames3) {
  if (!othernames3 || othernames3.length == 0) return false;
  othernames3 = othernames3.filter((option) => {
    if (Defaults.animal.othernames.ja?.includes(option)) return false;
    if (option == "none") return false;
    if (editDistance(name, option) > 1) {
      return true;
    }
  });
  if (othernames3.length == 0) return false;
  const chosen = othernames3[0];
  const p = document.createElement("p");
  p.className = "furigana";
  p.innerText = `(${chosen})`;
  return p;
}
function gender2(info, frame_class) {
  const img = document.createElement("img");
  if (info.gender == Defaults.gender.Male[environment_default.language]) img.src = "images/male.svg";
  else if (info.gender == Defaults.gender.Female[environment_default.language]) img.src = "images/female.svg";
  else img.src = "images/unknown.svg";
  img.alt = info.gender;
  const gender3 = document.createElement("div");
  gender3.className = "gender";
  if (frame_class != void 0) gender3.classList.add(frame_class);
  gender3.appendChild(img);
  return gender3;
}
function genderAnimal(animal, frame_class) {
  const gender3 = document.createElement("div");
  gender3.className = frame_class;
  const img = document.createElement("img");
  if (animal["gender"] == "Male") {
    img.src = "images/male.svg";
    img.alt = Defaults.gender.Male[environment_default.language];
  } else if (animal["gender"] == "Female") {
    img.src = "images/female.svg";
    img.alt = Defaults.gender.Male[environment_default.language];
  } else {
    img.src = "images/unknown.svg";
    img.alt = Defaults.unknown[environment_default.language];
  }
  gender3.appendChild(img);
  return gender3;
}
function locationLink(zoo, mode = "icons_only") {
  if (zoo._id == Defaults.zoo._id) return document.createTextNode(Defaults.zoo.location[environment_default.language] ?? Defaults.unknown[environment_default.language]);
  let link_text = Emoji.map;
  if (mode != "icons_only") link_text += ` ${zoo.location[environment_default.language]}`;
  if (zoo.flag) {
    link_text += ` ${Flags[zoo.flag]}`;
  }
  const a = document.createElement("a");
  if (zoo.map) {
    a.href = zoo.map;
  }
  a.innerText = link_text;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}
function nicknames(animal) {
  const container = document.createElement("ul");
  container.className = "nicknameList";
  for (const language of animal["language.order"]) {
    const nicknames2 = animal.nicknames;
    if (!nicknames2 || nicknames2[language] == void 0) continue;
    const nicknames_list = [];
    const nicknames_li = document.createElement("li");
    nicknames_li.innerText = `${LangNames[environment_default.language][language]}: `;
    for (const name of nicknames2[language]) nicknames_list.push(name);
    if (nicknames_list.length > 0) {
      nicknames_li.innerText += nicknames_list.join(", ");
      container.appendChild(nicknames_li);
    }
  }
  return container;
}
function othernames2(animal) {
  const container = document.createElement("ul");
  container.className = "nicknameList";
  for (const language of animal["language.order"]) {
    const othername_list = [];
    const othername_li = document.createElement("li");
    othername_li.innerText = `${LangNames[environment_default.language][language]}: `;
    if (language != environment_default.language) {
      const name = animal.name;
      if (name[language] != void 0) othername_list.push(name[language]);
    }
    const othernames3 = animal.othernames;
    if (othernames3 && othernames3[language] != void 0) {
      for (const name of othernames3[language]) othername_list.push(name);
    }
    const oldnames = animal.oldnames;
    if (oldnames && oldnames[language] != void 0) {
      for (const name of oldnames[language]) othername_list.push(name);
    }
    if (othername_list.length > 0) {
      othername_li.innerText += othername_list.join(", ");
      container.appendChild(othername_li);
    }
  }
  return container;
}
function qrcodeHashSafe(short = false) {
  const in_hash = window.location.hash;
  let out_hash = void 0;
  const parts = in_hash.split("/");
  let profile2 = void 0;
  let panda_id = void 0;
  let sub_hash = void 0;
  let photo_id = void 0;
  if (parts.length >= 4) {
    profile2 = parts[0];
    panda_id = parts[1];
    sub_hash = "photo";
    photo_id = parts[3];
    if (parseInt(panda_id) <= 0 || parseInt(panda_id) > pandas_default.db._totals.pandas) {
      panda_id = "1";
    }
    if (parseInt(photo_id) <= 0 || parseInt(photo_id) > pandas_default.db._photo.entity_max) {
      photo_id = "1";
    }
    if (short == false) out_hash = `${profile2}/${panda_id}/${sub_hash}/${photo_id}`;
    else out_hash = `${profile2}/${panda_id}`;
  } else if (parts.length <= 3 && parts.length >= 2) {
    profile2 = parts[0];
    panda_id = parts[1];
    sub_hash = "";
    photo_id = "";
    if (parseInt(panda_id) <= 0 || parseInt(panda_id) > pandas_default.db._totals.pandas) {
      panda_id = "1";
    }
    out_hash = `${profile2}/${panda_id}`;
  } else {
    out_hash = "";
  }
  return out_hash;
}
function qrcodeImage(animal_index = null, photo_index = null) {
  const safe_hash = qrcodeHashSafe(photo_index == null);
  let safe_url = `https://${window.location.host}/${safe_hash}`;
  if (photo_index != null && animal_index != null) {
    safe_url = `https://${window.location.host}/#profile/${animal_index}/photo/${photo_index}`;
  }
  const img = showQRCode(safe_url);
  const qrcode = document.createElement("div");
  qrcode.className = "qrcodeFrame";
  const button = document.createElement("button");
  const tld = document.createElement("span");
  tld.className = "qrcodeText";
  tld.innerText = `https://${window.location.host}/`;
  button.appendChild(tld);
  const qrimg = document.createElement("img");
  qrimg.id = "qrcodeUri";
  qrimg.src = img.src;
  button.appendChild(qrimg);
  qrcode.appendChild(button);
  button.addEventListener("click", function(event) {
    event.preventDefault();
    const text_class = "qrcodeText";
    const qrcode_url = Array.from(document.querySelectorAll(`.${text_class}`)).map((span) => span.innerText).join("");
    navigator.clipboard.writeText(qrcode_url);
    fade(document.getElementById("copyToast"));
  });
  const qrHashLink = document.createElement("span");
  qrHashLink.className = "qrcodeText";
  if (photo_index == null && animal_index == null) qrHashLink.innerText = safe_hash;
  else qrHashLink.innerText = `#profile/${animal_index}/photo/${photo_index}`;
  button.appendChild(qrHashLink);
  const copy_notice = document.createElement("span");
  copy_notice.className = "notifier condensed";
  copy_notice.id = "copyToast";
  copy_notice.innerText = Gui.copied[environment_default.language];
  qrcode.appendChild(copy_notice);
  return qrcode;
}
function qrcodeSwap() {
  const old_qrcode = document.getElementsByClassName("qrcodeFrame")[0];
  if (old_qrcode == void 0) return;
  const gallery = document.getElementsByClassName("pandaPhoto")[0];
  const gallery_id = gallery.childNodes[0].id;
  const animal_id = gallery_id.split("/photo/")[0].split("_")[1];
  const photo_index = gallery_id.split("/photo/").pop();
  const new_qrcode = qrcodeImage(animal_id, photo_index);
  old_qrcode.replaceWith(new_qrcode);
}
function update3(new_contents, container, container_class, container_id) {
  if (!container) {
    container = document.createElement("div");
    container.appendChild(new_contents);
  } else {
    const old_contents = container.childNodes[0];
    container.replaceChild(new_contents, old_contents);
  }
  container.className = container_class;
  container.id = container_id;
  return container;
}
function zooDivider(mode) {
  const divider2 = document.createElement("div");
  const modes = [
    "bamboo",
    "bear",
    "bear-bamboo",
    "fruit"
  ];
  if (mode == "random") mode = randomChoice(modes, 1).pop();
  divider2.className = "zooDivider";
  if (mode == "bamboo") divider2.innerText = "- \u{1F38D} \u2014 \u{1F38B} \u2014 \u{1F38D} -";
  else if (mode == "bear") divider2.innerText = "\u{1F33F} \u{1F42F} \u{1F43B} \u{1F33F}";
  else if (mode == "bear-bamboo") divider2.innerText = "\u{1F33F} \u{1F38D} \u{1F42F}\u{1F43B} \u{1F38D} \u{1F33F}";
  else if (mode == "fruit") divider2.innerText = "\u{1F33F} \u{1F34E} \u{1F347} \u{1F34E} \u{1F33F}";
  else divider2.innerText = "\u{1F33F} \u{1F34E} \u{1F347} \u{1F34E} \u{1F33F}";
  return divider2;
}
function zooLink(zoo, link_text, icon) {
  if (zoo._id == Defaults.zoo._id) return emptyLink(Defaults.zoo.name[environment_default.language] ?? Defaults.unknown[environment_default.language]);
  const a = document.createElement("a");
  let inner_text = link_text;
  if (icon != void 0) inner_text = `${icon} ${inner_text}`;
  a.innerText = inner_text;
  a.href = `#zoo/${num(zoo._id)}`;
  a.addEventListener("click", topButton.action);
  return a;
}
function zooTitle(info) {
  const name_div = document.createElement("div");
  name_div.className = "zooName";
  name_div.innerText = info.name;
  const title_div = document.createElement("div");
  title_div.className = "zooTitle";
  title_div.appendChild(name_div);
  return title_div;
}
function renderButton(id, button_icon, button_text, class_name, icon_class = "") {
  const button = document.createElement("button");
  button.className = "menu";
  button.classList.add(class_name);
  button.id = id;
  const content = document.createElement("div");
  content.className = "buttonContent";
  const icon_div = document.createElement("div");
  icon_div.className = "buttonIcon";
  if (icon_class) icon_div.classList.add(icon_class);
  icon_div.innerText = button_icon;
  content.appendChild(icon_div);
  if (button_text != void 0) {
    const text_div = document.createElement("div");
    text_div.className = "buttonText";
    text_div.innerText = button_text;
    content.appendChild(text_div);
  }
  button.appendChild(content);
  return button;
}
var aboutButton = {
  /** Toggle the visibility of the `#about` page */
  action: function() {
    about.routing();
    languageButton.hide();
  },
  /** Draw the _about_ button */
  render: function(class_name = "results") {
    const button = renderButton("aboutButton", Emoji.bamboo, Gui.about[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var flagButton = {
  action: function(button) {
    const language = button.id.replace("LanguageFlag", "");
    const options2 = Defaults.languages;
    const choice = options2.indexOf(language);
    if (choice > -1 && language != environment_default.language) {
      environment_default.language = language;
      update2();
      if (environment_default.output_mode == "nearby") getNaiveLocation();
      redraw(environment_default.current);
    }
    languageButton.hide();
  },
  render: function(language, class_color) {
    const button = document.createElement("button");
    button.classList.add("menu");
    button.classList.add("flag");
    button.classList.add(class_color);
    button.id = language + "LanguageFlag";
    const content = document.createElement("div");
    content.className = "buttonContent";
    const icon = document.createElement("div");
    icon.className = "buttonIcon";
    icon.innerText = Gui.flag[language];
    content.appendChild(icon);
    button.appendChild(content);
    button.addEventListener("click", () => this.action(button));
    return button;
  }
};
var homeButton = {
  action: function() {
    environment_default.lastSearch = "#home";
    home.render();
    window.location.href = "#home";
    languageButton.hide();
    environment_default.current = home.render;
    searchBar.remove("bottomSearch");
    window.scrollTo(0, 0);
  },
  /** Draw the _home_ button that takes you to the landing page */
  render: function(class_name = "results") {
    const button = renderButton("homeButton", Emoji.home, Gui.home[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var languageButton = {
  /** Make the flag menu buttons appear above the top menu */
  action: function() {
    const language_menu = document.querySelector(".languageMenu");
    if (!language_menu) return;
    else if (language_menu.style.display == "none" || language_menu.style.display == "") language_menu.style.display = "table";
    else language_menu.style.display = "none";
  },
  /** Immediately change the displayed language to the next one in the list */
  altAction: function(e) {
    e.preventDefault();
    const language = environment_default.language;
    const options2 = Defaults.languages;
    const count = options2.length;
    const choice = (options2.indexOf(language) + 1) % count;
    environment_default.language = options2[choice];
    update2();
    if (environment_default.output_mode == "nearby") getNaiveLocation();
    redraw(environment_default.current);
    this.hide();
  },
  hide: function() {
    const language_menu = document.querySelector(".languageMenu");
    if (language_menu) language_menu.style.display = "none";
  },
  render: function(class_name = "results") {
    const button = renderButton("languageButton", Gui.flag[environment_default.language], LangNames[environment_default.language][environment_default.language], class_name);
    button.addEventListener("click", this.action);
    button.addEventListener("contextmenu", this.altAction);
    return button;
  }
};
var linksButton = {
  action: function() {
    links.routing();
    languageButton.hide();
  },
  render: function(class_name = "results") {
    const button = renderButton("linksButton", Emoji.link, Gui.links[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var mediaButton = {
  action: function(pandaNumericId) {
    media.render();
    window.location.href = `#media/${pandaNumericId}`;
    languageButton.hide();
    environment_default.current = media.render;
  },
  altAction: function(e) {
    e.preventDefault();
    environment_default.current = media.render;
    let pandaIds = pandas_default.db.vertices.filter((entity) => entity.type == "media").filter((entity) => entity.photos.length > 0).flatMap((entity) => entity["panda.tags"]);
    pandaIds = distinct(pandaIds);
    window.location.href = `#media/${pandaIds[Math.floor(Math.random() * pandaIds.length)]}`;
    languageButton.hide();
    window.scrollTo(0, 0);
  },
  render: function(class_name = "profile", pandaNumericId) {
    const button = renderButton("mediaButton", Emoji.media, Gui.media[environment_default.language], class_name);
    button.addEventListener("click", () => this.action(pandaNumericId));
    button.addEventListener("contextmenu", this.altAction);
    return button;
  }
};
var optionsButton = {
  action: function() {
    window.location.href = "#options";
  },
  render: function(class_name = "results") {
    const button = renderButton("optionsButton", Emoji.options, Gui.options[environment_default.language], class_name, "brightness-150");
    button.addEventListener("click", this.action);
    return button;
  }
};
var pagingButton = {
  action: function(callback, parameters, frame_id, class_name) {
    languageButton.hide();
    const paging_data = callback.apply(null, parameters);
    const new_photos2 = paging_data["output"];
    const frame = document.getElementById(frame_id).childNodes[0];
    for (const new_photo of new_photos2) frame.appendChild(new_photo);
    parameters[0] = parameters[0] + 1;
    footer.redraw(class_name);
    environment_default.paging.shown_pages = environment_default.paging.shown_pages + 1;
  },
  render: function(class_name) {
    const button = renderButton("pagingButton", Emoji.paging, Gui.paging[environment_default.language], class_name);
    const callback = environment_default.paging.callback.function ?? (() => {
    });
    const parameters = environment_default.paging.callback.arguments ?? [];
    const frame_id = environment_default.paging.callback.frame_id ?? "contentFrame";
    button.addEventListener("click", () => this.action(callback, parameters, frame_id, class_name));
    const text = button.childNodes[0].childNodes[1];
    if (environment_default.language == "ja") text.classList.add("condensed");
    else text.classList.remove("condensed");
    if (environment_default.paging.display_button == false) button.classList.add("hidden");
    return button;
  }
};
var profileButton = {
  action: function(panda_id) {
    profile.render();
    window.location.href = `#profile/${panda_id}`;
    languageButton.hide();
    environment_default.current = profile.render;
  },
  altAction: function(e) {
    e.preventDefault();
    environment_default.current = profile.render;
    const pandaIds = pandas_default.db.vertices.filter((entity) => entity.type == "panda").filter((entity) => entity.photos.length > 0).filter((entity) => entity.death == void 0).map((entity) => entity._id);
    window.location.href = `#profile/${pandaIds[Math.floor(Math.random() * pandaIds.length)]}`;
    languageButton.hide();
    window.scrollTo(0, 0);
  },
  render: function(class_name = "profile", panda_id) {
    const button = renderButton("profileButton", Emoji.profile, Gui.profile[environment_default.language], class_name);
    button.addEventListener("click", () => this.action(panda_id));
    button.addEventListener("contextmenu", this.altAction);
    const text = button.childNodes[0].childNodes[1];
    if (environment_default.language == "ja") text.classList.add("condensed");
    else text.classList.remove("condensed");
    return button;
  }
};
var randomButton = {
  action: function() {
    environment_default.current = results.render;
    const zooIds = pandas_default.db.vertices.filter((entity) => entity.type == "zoo").filter((entity) => entity.photos && entity.photos.length > 0).map((entity) => entity._id).filter((id) => searchPandaZooCurrent(id).length > 0).map((id) => id.toString());
    const pandaIds = pandas_default.db.vertices.filter((entity) => entity.type == "panda").filter((entity) => entity.photos && entity.photos.length > 0).filter((entity) => entity.death == void 0).map((entity) => entity._id.toString());
    const groupIds = pandas_default.db.vertices.filter((entity) => entity.type == "media").map((entity) => entity["panda.tags"]).map((numericIds) => numericIds.map((numericId) => `panda.${numericId}`)).filter((pandaIds2) => {
      const alive = pandaIds2.every((id) => graphId(id).death != void 0);
      if (alive) return false;
      else return true;
    }).map((pandaIds2) => pandaIds2.join(" "));
    const randomChoices = pandaIds.concat(groupIds).concat(zooIds);
    window.location.href = `#query/${randomChoices[Math.floor(Math.random() * randomChoices.length)]}`;
    languageButton.hide();
    searchBar.remove("bottomSearch");
    window.scrollTo(0, 0);
  },
  render: function(class_name = "results") {
    const button = renderButton("randomButton", Emoji.random, Gui.random[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var refreshButton = {
  action: function() {
    location.reload(false);
  },
  altAction: function(e) {
    e.preventDefault();
    location.reload(true);
  },
  render: function(class_name = "results") {
    const button = renderButton("refreshButton", Emoji.refresh, Gui.refresh[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    button.addEventListener("contextmenu", this.altAction);
    return button;
  }
};
var searchButton = {
  action: function() {
    const active = searchBar.toggle("bottomSearch");
    const searchInput = document.querySelector("#searchInput");
    if (active == true && searchInput != null) {
      window.scrollTo(0, searchInput.offsetTop);
      searchInput.focus();
    }
  },
  render: function(class_name = "profile") {
    const searchButtonText = Gui.search[environment_default.language].replace("...", "");
    const button = renderButton("searchButton", Emoji.search, searchButtonText, class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var sectionButton = {
  render: function(classes, id, body_text) {
    const button = document.createElement("button");
    button.className = classes;
    button.id = id;
    const button_text = document.createElement("div");
    button_text.className = "sectionMenuItem";
    button_text.innerText = body_text;
    button.appendChild(button_text);
    return button;
  }
};
var topButton = {
  /**
   * anchor tags get used for JS redraws, so don't use an anchor tag for
   * top-of-page scroll events. This fixes the language button after clicking
   * _pageTop_.
   */
  action: function() {
    languageButton.hide();
    window.scrollTo(0, 0);
  },
  render: function(class_name = "results") {
    const button = renderButton("topButton", Emoji.top, Gui.top[environment_default.language], class_name);
    button.addEventListener("click", this.action);
    return button;
  }
};
var treeButton = {
  render: function(class_name = "profile") {
    const button = renderButton("treeButton", Emoji.wip, Gui.family[environment_default.language], class_name);
    const text = button.childNodes[0].childNodes[1];
    if (environment_default.language == "ja") text.classList.add("condensed");
    else text.classList.remove("condensed");
    return button;
  }
};
var aboutMenu = {
  buttons: [
    homeButton,
    languageButton,
    randomButton,
    linksButton
  ],
  render: function() {
    const new_contents = document.createElement("div");
    new_contents.className = "shrinker";
    for (const buttonType of this.buttons) {
      const button = buttonType.render("results");
      new_contents.appendChild(button);
    }
    let menu = document.querySelector(".topMenu");
    menu = update3(new_contents, menu, "topMenu", "pageTop");
    menu.classList.add("results");
    menu.classList.remove("profile");
    return menu;
  }
};
var optionsPage = {
  body: function() {
    const container = document.createElement("div");
    container.id = "contentFrame";
    container.className = "options";
    container.appendChild(this.render());
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    container.appendChild(shrinker);
    return container;
  },
  content: {
    deadPandas: {
      action: (e) => {
        update((data) => data.hideDeadPandas = e.currentTarget.checked);
      },
      render: function() {
        const container = document.createElement("div");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.id = "dead-pandas";
        input.name = "dead-pandas";
        input.value = "dead-pandas";
        input.checked = Data.hideDeadPandas;
        input.addEventListener("change", this.action);
        container.appendChild(input);
        const label = document.createElement("label");
        label.htmlFor = "dead-pandas";
        label.innerText = Gui["opt_hide_dead_pandas"][environment_default.language];
        container.appendChild(label);
        return container;
      }
    }
  },
  header: function() {
    const header = document.createElement("h3");
    header.innerText = Gui["options"][environment_default.language];
    return header;
  },
  render: function() {
    const container = document.createElement("div");
    container.className = "shrinker";
    container.appendChild(this.header());
    container.appendChild(this.content.deadPandas.render());
    return container;
  }
};
var landingMenus = {
  bottom: {
    buttons: [
      optionsButton
    ],
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".bottomMenu");
      menu = update3(new_contents, menu, "bottomMenu", "pageBottom");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  },
  /** Draw the language (flags) select menu, but it will be hidden initially */
  language: function(class_color) {
    const languages = Defaults.languages;
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    for (const language of languages) {
      const button = flagButton.render(language, class_color);
      shrinker.appendChild(button);
    }
    let menu = document.querySelector(".languageMenu");
    menu = update3(shrinker, menu, "languageMenu", "languageTop");
    menu.classList.remove("results", "profile");
    menu.classList.add(class_color);
  },
  top: {
    buttons: [
      refreshButton,
      languageButton,
      aboutButton,
      randomButton,
      linksButton
    ],
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".topMenu");
      menu = update3(new_contents, menu, "topMenu", "pageTop");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  }
};
var linksMenus = {
  bottom: {
    buttons: [],
    /** Share the green color of the results page content for the links page */
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".bottomMenu");
      menu = update3(new_contents, menu, "bottomMenu", "pageBottom");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  },
  sections: {
    buttons: [
      "redPandaCommunity",
      "zooLinks",
      "instagramLinks",
      "specialThanksLinks"
    ],
    /** 
     * Draw the links page subsection menus, highlighting the button for the 
     * currently-displayed subpage
     */
    render: function(subpage) {
      const menu = document.createElement("div");
      menu.id = "linksPageMenu";
      menu.className = "sectionMenu";
      for (const btn_name of this.buttons) {
        const btn_id = `${btn_name}_button`;
        let btn_class = "sectionButton four";
        if (btn_name == subpage) {
          btn_class = `${btn_class} selected`;
        }
        const text = Gui[btn_id][environment_default.language];
        const button = sectionButton.render(btn_class, btn_id, text);
        menu.appendChild(button);
      }
      return menu;
    }
  },
  top: {
    buttons: [
      homeButton,
      languageButton,
      aboutButton,
      randomButton
    ],
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      var menu = document.querySelector(".topMenu");
      menu = update3(new_contents, menu, "topMenu", "pageTop");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  }
};
var linksOrder = {
  /** 
   * Go through a set of links, and return an object with all details necessary
   * to construct links in the page, along with any counts that will assist in
   * sorting, should sorting be necessary elsewhere.
   */
  given: function(node) {
    const output = {
      counts: {},
      icon: node.icon,
      list: []
    };
    node.links.forEach((link) => {
      const languageOrder = link["language.order"] ? link["language.order"] : Fallback.order;
      let linkName = link.name[environment_default.language];
      if (linkName == void 0) {
        const checkLanguages = languageOrder.concat(Fallback.order).filter((l) => l != environment_default.language);
        for (let l of checkLanguages) {
          if (link.name[l]) {
            linkName = link.name[l];
            break;
          }
        }
      }
      const processed = {
        "href": link.url,
        "order": languageOrder,
        "text": linkName ?? Defaults.unknown[environment_default.language]
      };
      if (link.first) processed.first = link.first[environment_default.language] ?? "";
      if (link.last) processed.last = link.last[environment_default.language] ?? "";
      for (const language of processed.order) output.counts[language] = (output.counts[language] ?? 0) + 1;
      output.list.push(processed);
    });
    return output;
  },
  /**
   * Display links in language order, and then order by which language has the
   * most recorded hits in the links.
   */
  hits: function(links2) {
    const output = this.given(links2);
    output.list = output.list.sort(this.sortLinkTextWithoutUnderscores).sort((a, b) => {
      const aLangCount = output.counts[a.order[0]] ?? 0;
      const bLangCount = output.counts[b.order[0]] ?? 0;
      if (aLangCount > bLangCount) return -1;
      else if (aLangCount < bLangCount) return 1;
      else return 0;
    });
    return output;
  },
  /** 
   * Display links in language order, but otherwise preserving the list order
   * of the underlying links dataset. This means that other than language
   * sorting, the zoo lists will still prioritize the original list order,
   * which is generally done by how many animals that zoo is known for. Return
   * the links page content as an array with the desired ordering.
   */
  language: function(links2) {
    const output = this.given(links2);
    output.list = output.list.sort(this.sortLinkByCurrentLanguageAndOrder);
    return output;
  },
  /** 
   * Display links in language order. Any link with the current language as the
   * 1st in the link's language.order will be treated as a primary language
   * link and appear first. All primary links will be arranged in
   * lexicographical order. Next, order the other links by whether the desired
   * language is a secondary value for the given link. Return the links page
   * content as an array with the desired ordering.
   */
  languageAndAlphabet: function(links2) {
    const output = this.given(links2);
    output.list = output.list.sort(this.sortLinkTextWithoutUnderscores).sort(this.sortLinkByCurrentLanguageAndOrder);
    return output;
  },
  /**
   * If the primary (zeroth) language for the link is the display language,
   * prioritize that.
   */
  sortLinkByCurrentLanguageAndOrder: function(a, b) {
    const aHasLang = a.order.indexOf(environment_default.language);
    const bHasLang = b.order.indexOf(environment_default.language);
    if (aHasLang == bHasLang) {
      return 0;
    } else if (bHasLang == -1) {
      return -1;
    } else if (aHasLang == 0) {
      return -1;
    } else {
      return 1;
    }
  },
  /** 
   * Do a pass of alphabetical sorting by name, without underscores changing
   * the sort order.
   */
  sortLinkTextWithoutUnderscores: function(a, b) {
    const aText = a.text.replace("_", "");
    const bText = b.text.replace("_", "");
    if (aText > bText) return 1;
    else if (aText < bText) return -1;
    else return 0;
  }
};
var linksPage = {
  body: function(subpage) {
    const container = document.createElement("div");
    container.id = "contentFrame";
    container.className = "links";
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    const menu = linksMenus.sections.render(subpage);
    const content = linksSections[subpage]();
    shrinker.appendChild(menu);
    shrinker.appendChild(content);
    container.appendChild(shrinker);
    return container;
  },
  /** Draw a link, with optional suffix data for the link text */
  create: function(element, href, text, suffix, before, after) {
    const container = document.createElement(element);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.innerText = `${text} ${suffix}`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    if (before != void 0) {
      const text_before = document.createTextNode(before);
      container.appendChild(text_before);
    }
    if (href == "underline") {
      const leading = document.createTextNode(" ");
      const trailing = document.createTextNode(" ");
      const underline = document.createElement("u");
      underline.innerText = text;
      container.appendChild(leading);
      container.appendChild(underline);
      container.appendChild(trailing);
    } else {
      container.appendChild(anchor);
    }
    if (after != void 0) {
      const text_after = document.createTextNode(after);
      container.appendChild(text_after);
    }
    return container;
  },
  /** Convert the language order string into a list of flag emojis */
  flags: function(order) {
    return order.length > 0 ? order.map((l) => Gui.flag[l]).join(" ") : "";
  }
};
var linksSections = {
  instagramLinks: function() {
    const data = "instagram";
    const links2 = linksOrder.languageAndAlphabet(searchLinks(data));
    const container = document.createElement("div");
    container.id = "instagramLinks";
    container.className = "section";
    const sub_container = document.createElement("div");
    sub_container.className = "pandaLinks";
    const h2 = document.createElement("h2");
    h2.className = "linksHeader";
    h2.innerText = Gui["instagramLinks_header"][environment_default.language];
    const body = document.createElement("p");
    body.innerText = Gui["instagramLinks_body"][environment_default.language];
    const ul = document.createElement("ul");
    ul.classList.add("linkList");
    ul.classList.add("multiColumn");
    ul.classList.add(links2.icon);
    for (const link of links2.list) {
      const suffix = linksPage.flags(link.order);
      const li = linksPage.create("li", link.href, link.text, suffix);
      ul.appendChild(li);
    }
    sub_container.appendChild(h2);
    sub_container.appendChild(body);
    sub_container.appendChild(ul);
    container.appendChild(sub_container);
    return container;
  },
  redPandaCommunity: function() {
    const data = "community";
    const links2 = linksOrder.language(searchLinks(data));
    const container = document.createElement("div");
    container.id = "redPandaCommunity";
    container.className = "section";
    const sub_container = document.createElement("div");
    sub_container.className = "pandaLinks";
    var h2 = document.createElement("h2");
    h2.className = "linksHeader";
    h2.innerText = Gui["redPandaCommunity_header"][environment_default.language];
    var body = document.createElement("p");
    body.innerText = Gui["redPandaCommunity_body"][environment_default.language];
    var ul = document.createElement("ul");
    ul.classList.add("linkList");
    ul.classList.add(links2.icon);
    for (const link of links2.list) {
      const suffix = linksPage.flags(link.order);
      const li = linksPage.create("li", link.href, link.text, suffix);
      ul.appendChild(li);
    }
    sub_container.appendChild(h2);
    sub_container.appendChild(body);
    sub_container.appendChild(ul);
    container.appendChild(sub_container);
    return container;
  },
  specialThanksLinks: function() {
    const data = "special-thanks";
    const links2 = linksOrder.given(searchLinks(data));
    const container = document.createElement("div");
    container.id = "specialThanksLinks";
    container.className = "section";
    const sub_container = document.createElement("div");
    sub_container.className = "pandaLinks";
    const h2 = document.createElement("h2");
    h2.className = "linksHeader";
    h2.innerText = Gui["specialThanksLinks_header"][environment_default.language];
    const body = document.createElement("p");
    body.innerText = Gui["specialThanksLinks_body"][environment_default.language];
    const ul = document.createElement("ul");
    ul.classList.add("linkList");
    ul.classList.add(links2.icon);
    for (const link of links2.list) {
      const li = linksPage.create("li", link.href, link.text, "", link.first, link.last);
      ul.appendChild(li);
    }
    sub_container.appendChild(h2);
    sub_container.appendChild(body);
    sub_container.appendChild(ul);
    container.appendChild(sub_container);
    return container;
  },
  zooLinks: function() {
    const data = "zoos";
    const links2 = linksOrder.language(searchLinks(data));
    const container = document.createElement("div");
    container.id = "zooLinks";
    container.className = "section";
    const sub_container = document.createElement("div");
    sub_container.className = "pandaLinks";
    const h2 = document.createElement("h2");
    h2.className = "linksHeader";
    h2.innerText = Gui["zooLinks_header"][environment_default.language];
    const body = document.createElement("p");
    body.innerText = Gui["zooLinks_body"][environment_default.language];
    const ul = document.createElement("ul");
    ul.classList.add("linkList");
    ul.classList.add(links2.icon);
    for (const link of links2.list) {
      const suffix = linksPage.flags(link.order);
      const li = linksPage.create("li", link.href, link.text, suffix);
      ul.appendChild(li);
    }
    sub_container.appendChild(h2);
    sub_container.appendChild(body);
    sub_container.appendChild(ul);
    container.appendChild(sub_container);
    return container;
  }
};
var profileMenus = {
  bottom: {
    buttons: [
      pagingButton,
      randomButton,
      searchButton
    ],
    /** Offer red menu bar with a search function: Top, Home, Search */
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("profile");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".bottomMenu");
      menu = update3(new_contents, menu, "bottomMenu", "pageBottom");
      menu.classList.add("profile");
      menu.classList.remove("results");
      return menu;
    }
  },
  language: () => landingMenus.language("profile"),
  top: {
    buttons: [
      homeButton,
      languageButton,
      profileButton,
      mediaButton,
      treeButton
    ],
    /** A red menu bar: Home, Language, Profile, Media, Timeline */
    render: function(numericId) {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("profile", numericId);
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".topMenu");
      menu = update3(new_contents, menu, "topMenu", "pageTop");
      menu.classList.add("profile");
      menu.classList.remove("results");
      return menu;
    }
  }
};
var profilePage = {
  /** Show a carousel of photos for this animal */
  carousel: function(info) {
    const carousel = new Carousel(info, "panda");
    carousel.displayPhoto();
    const frame = document.createElement("div");
    frame.className = "pandaPhoto";
    const image = carousel.image;
    const dogEar = carousel.displayPhotoNavigation();
    frame.appendChild(image);
    frame.appendChild(dogEar);
    frame.addEventListener("mouseover", () => dogEar.style.display = "block");
    frame.addEventListener("mouseout", () => dogEar.style.display = "none");
    return frame;
  },
  /** Display photos of the animal's children */
  children: function(animal) {
    const info = acquirePandaInfo(animal);
    const elements = [];
    const photo_divs = [];
    const children_count = info.children.length;
    if (children_count == 0) return [];
    const sons_count = info.children.filter((x) => x.gender == "Male").length;
    const daughters_count = info.children.filter((x) => x.gender == "Female").length;
    const message = profile_children(info["name"], children_count, daughters_count, sons_count);
    elements.push(message);
    const photos = searchPhotoProfileChildren(animal._id);
    for (const photo of photos) {
      const child = info.children.filter((x) => x._id == photo._id)[0];
      const birth_year = formatYear(child["birthday"]);
      const indeterminate = indeterminateParent(animal._id, child._id);
      const gallery = familyProfilePhoto(child, photo, birth_year, void 0, indeterminate);
      photo_divs.push(gallery);
    }
    const container = document.createElement("div");
    container.className = "profilePhotos";
    for (const photo_div of photo_divs) container.appendChild(photo_div);
    elements.push(container);
    return elements;
  },
  /**
   * The profile dossier includes the species details, along with photo-credit
   * text related to the currently-displayed gallery on the profile page, and a
   * QR code for the panda being displayed.
   */
  dossier: function(animal, info) {
    const species2 = this.species(animal);
    const [first_string, second_string] = birthday2(info);
    const dossierBirthday = document.createElement("ul");
    dossierBirthday.className = "pandaList";
    const first_item = document.createElement("li");
    first_item.style.display = "inline-block";
    first_item.style.paddingBottom = "0.25ex";
    first_item.style.paddingRight = "1em";
    first_item.innerText = first_string;
    const second_item = document.createElement("li");
    second_item.style.display = "inline-block";
    second_item.style.marginTop = "0.25ex";
    second_item.innerText = second_string;
    dossierBirthday.appendChild(first_item);
    dossierBirthday.appendChild(second_item);
    const qrcode = qrcodeImage();
    window.addEventListener("qr_update", qrcodeSwap);
    const dossier = document.createElement("div");
    dossier.className = "profileDossier";
    dossier.appendChild(species2);
    dossier.appendChild(dossierBirthday);
    if (info.photo_credit != void 0) {
      const credit2 = document.createElement("ul");
      credit2.className = "pandaList";
      const credit_inner = creditLink(info, "li");
      credit_inner.style.display = "inline-block";
      credit_inner.style.paddingRight = "1em";
      credit2.appendChild(credit_inner);
      const apple_inner = appleLink(info, "li");
      apple_inner.style.display = "inline-block";
      if (apple_inner.children.length > 0) credit2.appendChild(apple_inner);
      dossier.appendChild(credit2);
    }
    dossier.appendChild(qrcode);
    const nicknames_container = document.createElement("div");
    nicknames_container.className = "nicknameContainer";
    const nicknames_heading = document.createElement("h4");
    nicknames_heading.className = "nicknamesHeading";
    nicknames_heading.classList.add(environment_default.language);
    nicknames_heading.innerText = Gui.nicknames[environment_default.language];
    const dossierNicknames = nicknames(animal);
    if (dossierNicknames.childNodes.length > 0) {
      nicknames_container.appendChild(nicknames_heading);
      nicknames_container.appendChild(dossierNicknames);
      dossier.appendChild(nicknames_container);
    }
    const othernames_container = document.createElement("div");
    othernames_container.className = "othernamesContainer";
    const othernames_heading = document.createElement("h4");
    othernames_heading.className = "othernamesHeading";
    othernames_heading.classList.add(environment_default.language);
    othernames_heading.innerText = Gui.othernames[environment_default.language];
    const dossierOthernames = othernames2(animal);
    if (dossierOthernames.childNodes.length > 0) {
      othernames_container.appendChild(othernames_heading);
      othernames_container.appendChild(dossierOthernames);
      dossier.appendChild(othernames_container);
    }
    return dossier;
  },
  /** Display photos of the animal's family */
  family: function(animal) {
    const info = acquirePandaInfo(animal);
    const elements = [];
    const photo_divs = [];
    const message = profile_family(info["name"]);
    elements.push(message);
    const photos = searchPhotoProfileImmediateFamily(animal._id);
    const mom_photos = [];
    for (const mom of info.mom) {
      if (mom != void 0) {
        const mom_photo = photos.filter((x) => x._id == mom._id)[0];
        mom_photos.push(mom_photo);
        const mom_entry = familyProfilePhoto(mom, mom_photo, Gui.mother[environment_default.language], "immediateFamily", info.mom.length > 1);
        photo_divs.push(mom_entry);
      }
    }
    const dad_photos = [];
    for (const dad of info.dad) {
      if (dad != void 0) {
        const dad_photo = photos.filter((x) => x._id == dad._id)[0];
        dad_photos.push(dad_photo);
        var dad_entry = familyProfilePhoto(dad, dad_photo, Gui.father[environment_default.language], "immediateFamily", info.dad.length > 1);
        photo_divs.push(dad_entry);
      }
    }
    const me_photo = photos.filter((x) => x._id == info._id)[0];
    const me = familyProfilePhoto(animal, me_photo, Gui.me[environment_default.language], "immediateFamily");
    photo_divs.push(me);
    const other_family_ids = mom_photos.concat(dad_photos).concat(me_photo).filter((x) => x).map((x) => x._id);
    const litter_photos = photos.filter((photo) => !other_family_ids.includes(photo._id));
    for (const litter_photo of litter_photos) {
      let subHeading = Gui.twin[environment_default.language];
      if (litter_photos.length == 2) subHeading = Gui.triplet[environment_default.language];
      if (litter_photos.length >= 3) subHeading = Gui.quadruplet[environment_default.language];
      const litter_mate = info.litter.filter((x) => x._id == litter_photo._id)[0];
      const gallery = familyProfilePhoto(litter_mate, litter_photo, subHeading, "immediateFamily");
      photo_divs.push(gallery);
    }
    const container = document.createElement("div");
    container.className = "profilePhotos";
    for (const photo_div of photo_divs) container.appendChild(photo_div);
    elements.push(container);
    return elements;
  },
  /** 
   * Replace the _top_search_ bar with something that displays the animal's
   * name and gender
   */
  nameBar: function(info) {
    const animalGender = gender2(info, "profile");
    const name = document.createElement("div");
    name.className = "pandaName";
    name.classList.add("profile");
    name.innerText = info.name;
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    shrinker.appendChild(animalGender);
    shrinker.appendChild(name);
    const nameBar = document.createElement("div");
    nameBar.className = "nameBar";
    nameBar.classList.add("profile");
    nameBar.id = "focalBar";
    nameBar.appendChild(shrinker);
    const body = document.getElementsByTagName("body")[0];
    const existing = document.querySelector("focalBar");
    if (existing) body.replaceChild(nameBar, existing);
  },
  /** Create a profile page for a single panda */
  panda: function(animal) {
    const info = acquirePandaInfo(animal);
    this.nameBar(info);
    const carousel = this.carousel(info);
    const dossier = this.dossier(animal, info);
    const result2 = document.createElement("div");
    result2.className = "profileFrame";
    result2.appendChild(carousel);
    result2.appendChild(dossier);
    return result2;
  },
  /** Render the search bar at the bottom of the profile page */
  searchBar: function() {
    const bottomMenu = document.querySelector(".bottomMenu");
    if (bottomMenu) {
      const bottomSearchBar = searchBar.render("bottomSearch profile", "bottomSearch");
      bottomMenu.appendChild(bottomSearchBar);
    }
  },
  /** Display photos of the animal's siblings */
  siblings: function(animal) {
    const info = acquirePandaInfo(animal);
    const elements = [];
    const photo_divs = [];
    const total_siblings = info.siblings.concat(info.litter);
    const siblings_count = total_siblings.length;
    if (siblings_count == 0) return [];
    const brothers_count = total_siblings.filter((x) => x.gender == "Male").length;
    const sisters_count = total_siblings.filter((x) => x.gender == "Female").length;
    const message = profile_siblings(info["name"], siblings_count, sisters_count, brothers_count);
    elements.push(message);
    const photos = searchPhotoProfileSiblings(animal._id);
    for (const photo of photos) {
      const sibling = total_siblings.filter((x) => x._id == photo._id)[0];
      let subHeading = formatYear(sibling["birthday"]);
      if (halfSiblings(animal, sibling)) subHeading = subHeading + "\u200A(\xBD)";
      const indeterminate = indeterminateSiblings(animal._id, sibling._id);
      const gallery = familyProfilePhoto(sibling, photo, subHeading, void 0, indeterminate);
      photo_divs.push(gallery);
    }
    const container = document.createElement("div");
    container.className = "profilePhotos";
    for (const photo_div of photo_divs) container.appendChild(photo_div);
    elements.push(container);
    return elements;
  },
  /** Underneath a photo, display the subspecies info for the panda */
  species: function(animal) {
    const species_text = document.createTextNode(species(animal));
    const italics = document.createElement("i");
    italics.appendChild(species_text);
    const heading = document.createElement("h4");
    const emoji2 = document.createTextNode(Emoji.animal + " ");
    heading.appendChild(emoji2);
    heading.appendChild(italics);
    const species_div = document.createElement("div");
    species_div.className = "species";
    species_div.appendChild(heading);
    return species_div;
  },
  /**
   * Show the locations this panda has been at. Return an array of HTMLElements
   * to insert into the page
   */
  where: function(animal) {
    const elements = [];
    const info = acquirePandaInfo(animal);
    const history2 = acquireLocationList(animal);
    const message = profile_where(info["name"]);
    elements.push(message);
    const container = document.createElement("div");
    container.className = "zooHistory";
    for (const zoo of history2) {
      let zoo_icon = Emoji.zoo;
      let date_string = zoo.start_date + "\u2014" + zoo.end_date;
      if (!zoo._id.includes("wild.")) {
        if (zoo.end_date == Defaults.unknown[environment_default.language]) {
          date_string = Gui.since_date[environment_default.language].replace("<INSERTDATE>", zoo.start_date);
          zoo_icon = Emoji.home;
        }
      } else {
        zoo_icon = Emoji.tree;
        date_string = Gui.seen_date[environment_default.language].replace("<INSERTDATE>", zoo.start_date);
      }
      if (zoo.end_date != Defaults.unknown[environment_default.language] && zoo.end_date == date(animal, "death")) {
        zoo_icon = Emoji.died;
      }
      if (zoo.start_date != Defaults.unknown[environment_default.language] && zoo.start_date == formatDate(animal["birthday"]) && zoo_icon != Emoji.home) {
        zoo_icon = Emoji.born_at;
      }
      const zoo_info = graphId(zoo._id);
      const zoo_entry = document.createElement("ul");
      zoo_entry.className = "zooList";
      const zoo_name = document.createElement("li");
      const zoo_link = zooLink(zoo_info, fallback_name(zoo_info), zoo_icon);
      const zoo_date = document.createElement("span");
      zoo_date.className = "detail";
      zoo_date.innerText = date_string;
      zoo_name.appendChild(zoo_link);
      if (zoo.start_date != Defaults.unknown[environment_default.language]) zoo_name.appendChild(zoo_date);
      zoo_entry.appendChild(zoo_name);
      const zoo_location = document.createElement("li");
      const location_link = locationLink(zoo_info, "text");
      zoo_location.appendChild(location_link);
      zoo_entry.appendChild(zoo_location);
      container.appendChild(zoo_entry);
    }
    elements.push(container);
    return elements;
  }
};
var resultsMenus = {
  bottom: {
    buttons: [
      pagingButton
    ],
    /** Return to a green menu bar: Paging, Home */
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".bottomMenu");
      menu = update3(new_contents, menu, "bottomMenu", "pageBottom");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  },
  language: () => landingMenus.language("results"),
  top: {
    buttons: [
      homeButton,
      languageButton,
      aboutButton,
      randomButton,
      linksButton
    ],
    /** Return to a green menu bar: Logo/Home, Language, About, Random, Links */
    render: function() {
      const new_contents = document.createElement("div");
      new_contents.className = "shrinker";
      for (const buttonType of this.buttons) {
        const button = buttonType.render("results");
        new_contents.appendChild(button);
      }
      let menu = document.querySelector(".topMenu");
      menu = update3(new_contents, menu, "topMenu", "pageTop");
      menu.classList.add("results");
      menu.classList.remove("profile");
      return menu;
    }
  }
};
var mediaMenus = profileMenus;
var mediaPage = {
  gallery: function(animal) {
    const gallery = groupPhotosPage(0, [
      animal._id
    ], 10)["output"];
    const info = acquirePandaInfo(animal);
    this.nameBar(info);
    const result2 = document.createElement("div");
    result2.className = "mediaFrame";
    for (const photo of gallery) result2.appendChild(photo);
    if (gallery.length < 1) result2.appendChild(emptyResult(Text.no_group_media_result));
    return result2;
  },
  nameBar: profilePage.nameBar,
  searchBar: profilePage.searchBar
};
var resultsPage = {
  /** Display panda children in the family section */
  children: function(info) {
    const heading = document.createElement("h4");
    heading.className = `childrenHeading ${environment_default.language}`;
    heading.innerText = Gui.children[environment_default.language];
    const ul = document.createElement("ul");
    ul.className = `pandaList ${environment_default.language}`;
    for (const index in sortOldestToYoungest(info.children)) {
      const animal = info.children[index];
      const icon_list = [
        "child_icon",
        "live_icon"
      ];
      if (indeterminateParent(info._id, animal._id) == true) icon_list.push("question_icon");
      const children_link = animalLink(animal, fallback_name(animal), icon_list);
      const li = document.createElement("li");
      li.appendChild(children_link);
      ul.appendChild(li);
    }
    const children = document.createElement("div");
    children.className = "children";
    children.appendChild(heading);
    children.appendChild(ul);
    return children;
  },
  /** 
   * Display lists of family information, starting with parents, then adding
   * immediate littermates, and finally including the other siblings, ordered
   * by birthday. This is the tan stripe at the bottom of a family dossier in
   * a search-result card.
   */
  family: function(info) {
    let family = document.createElement("div");
    family.className = "family";
    if (info.dad.length == 0 && info.mom.length == 0 && info.litter.length == 0 && info.siblings.length == 0 && info.children.length == 0) {
      return family;
    }
    let parents = void 0;
    let litter = void 0;
    let siblings = void 0;
    let children = void 0;
    if (info.dad.length > 0 || info.mom.length > 0) parents = this.parents(info);
    if (info.litter.length > 0) litter = this.litter(info);
    if (info.siblings.length > 0) siblings = this.siblings(info);
    if (info.children.length > 0) children = this.children(info);
    const layout = new layout_default(family, info, parents, litter, siblings, children);
    return layout.section.family ?? family;
  },
  groupGallery: function(id_list) {
    const gallery = groupPhotosIntersectPage(0, id_list, 10)["output"];
    let results2 = [];
    if (gallery.length < 1) {
      results2.push(emptyResult(Text.no_group_media_result));
    } else {
      results2 = gallery;
    }
    return results2;
  },
  /** Do the littermates info in the family section */
  litter: function(info) {
    const heading = document.createElement("h4");
    heading.className = `litterHeading ${environment_default.language}`;
    heading.classList.add(environment_default.language);
    heading.innerText = Gui.litter[environment_default.language];
    const ul = document.createElement("ul");
    ul.className = `pandaList ${environment_default.language}`;
    for (const index in sortOldestToYoungest(info.litter)) {
      const animal = info.litter[index];
      const litter_link = animalLink(animal, fallback_name(animal), [
        "child_icon",
        "live_icon"
      ]);
      const li = document.createElement("li");
      li.appendChild(litter_link);
      ul.appendChild(li);
    }
    const litter = document.createElement("div");
    litter.className = "litter";
    litter.appendChild(heading);
    litter.appendChild(ul);
    return litter;
  },
  /**
   * Display a card of information for a single panda. Most missing elements
   * should not be displayed, but a few should be printed regardless 
   * (birthday / death)
   */
  panda: function(animal) {
    const info = acquirePandaInfo(animal);
    const carousel = new Carousel(info, "panda");
    carousel.displayPhoto();
    const frame = document.createElement("div");
    frame.className = "pandaPhoto";
    const image = carousel.image;
    const dogEar = carousel.displayPhotoNavigation();
    frame.appendChild(image);
    frame.appendChild(dogEar);
    frame.addEventListener("mouseover", () => dogEar.style.display = "block");
    frame.addEventListener("mouseout", () => dogEar.style.display = "none");
    const title = this.pandaName(info);
    const details = this.pandaDetails(info);
    const family = this.family(info);
    const dossier = document.createElement("div");
    dossier.className = "pandaDossier";
    dossier.appendChild(title);
    dossier.appendChild(details);
    dossier.appendChild(family);
    const result2 = document.createElement("div");
    result2.className = "pandaResult";
    result2.appendChild(frame);
    result2.appendChild(dossier);
    this.searchBar();
    return result2;
  },
  /** The purple results-page "dossier" information stripe for a panda. */
  pandaDetails: function(info) {
    const details = document.createElement("div");
    details.className = "pandaDetails";
    let search_context = void 0;
    if (info.search_context != void 0) search_context = info.search_context.query;
    let squelch_home_zoo = false;
    const [first_string, second_string] = birthday2(info);
    const born = document.createElement("p");
    born.innerText = first_string;
    details.appendChild(born);
    const second = document.createElement("p");
    second.innerText = second_string;
    if (info.age != void 0) details.appendChild(second);
    if (info.zoo != void 0 && search_context == "arrived") {
      const zoo = document.createElement("p");
      const target_zoo = graphId(info.search_context.from);
      const target_date = formatDate(info.search_context.move_date);
      const icon = Emoji.truck;
      const target_text = arrived_from_zoo(fallback_name(target_zoo), target_date);
      const zoo_link = zooLink(target_zoo, target_text, icon);
      zoo.appendChild(zoo_link);
      const location1 = document.createElement("p");
      const location_link = locationLink(target_zoo);
      location1.appendChild(location_link);
      details.appendChild(zoo);
      details.appendChild(location1);
      squelch_home_zoo = true;
    }
    if (info.zoo != void 0 && search_context == "departed") {
      const zoo = document.createElement("p");
      const target_zoo = graphId(info.search_context.to);
      const target_date = formatDate(info.search_context.move_date);
      const icon = Emoji.truck;
      const target_text = departed_to_zoo(fallback_name(target_zoo), target_date);
      const zoo_link = zooLink(target_zoo, target_text, icon);
      zoo.appendChild(zoo_link);
      const location1 = document.createElement("p");
      const location_link = locationLink(target_zoo);
      location1.appendChild(location_link);
      details.appendChild(zoo);
      details.appendChild(location1);
      squelch_home_zoo = true;
    }
    if (info.zoo != void 0 && search_context == "born_at") {
      const zoo = document.createElement("p");
      const target_zoo = graphId(info.search_context.at);
      const target_date = formatDate(info.search_context.move_date);
      let icon = Emoji.born_at;
      const target_text = fallback_name(target_zoo);
      const compare_text = info.zoo.name[environment_default.language];
      if (target_text == compare_text && info.death == Defaults.unknown[environment_default.language]) {
        squelch_home_zoo = true;
        icon = `${icon} ${Emoji.home}`;
      }
      if (info.death != Defaults.unknown[environment_default.language]) squelch_home_zoo = true;
      const zoo_link = zooLink(target_zoo, target_text, icon);
      zoo.appendChild(zoo_link);
      const location1 = document.createElement("p");
      const location_link = locationLink(target_zoo);
      location1.appendChild(location_link);
      details.appendChild(zoo);
      details.appendChild(location1);
    }
    if (info.zoo != void 0 && search_context == "born_or_lived") {
      const zoo = document.createElement("p");
      const target_zoo = graphId(info.search_context.at);
      const target_date = formatDate(info.search_context.move_date);
      let icon = Emoji.zoo;
      const target_text = fallback_name(target_zoo);
      const compare_text = info.zoo.name[environment_default.language];
      if (target_text == compare_text) {
        squelch_home_zoo = true;
        icon = Emoji.home;
      }
      const zoo_link = zooLink(target_zoo, target_text, icon);
      zoo.appendChild(zoo_link);
      const location1 = document.createElement("p");
      const location_link = locationLink(target_zoo);
      location1.appendChild(location_link);
      details.appendChild(zoo);
      details.appendChild(location1);
      for (const range of info.search_context.ranges) {
        const entry = document.createElement("p");
        let icon2 = Emoji.range_previous;
        if (range.length < 2 && info.death == Defaults.unknown[environment_default.language]) icon2 = Emoji.truck;
        const start_range = formatDate(range.shift());
        let end_range = range.shift();
        if (end_range == void 0 && info.death != Defaults.unknown[environment_default.language]) end_range = " \u2014 " + info.death;
        else if (end_range == void 0) end_range = "";
        else end_range = " \u2014 " + formatDate(end_range);
        entry.innerText = `${icon2} ${start_range}${end_range}`;
        details.appendChild(entry);
      }
      if (info.death != Defaults.unknown[environment_default.language]) squelch_home_zoo = true;
    }
    if (info.zoo != void 0 && squelch_home_zoo == false) {
      const zoo = document.createElement("p");
      const zoo_link = zooLink(info.zoo, fallback_name(info.zoo), Emoji.home);
      zoo.appendChild(zoo_link);
      const location1 = document.createElement("p");
      const location_link = locationLink(info.zoo);
      location1.appendChild(location_link);
      details.appendChild(zoo);
      details.appendChild(location1);
    }
    if (info.wild != void 0) {
      const wild = document.createElement("p");
      wild.innerText = Flags[info.wild["flag"]] + " " + info.wild.name[environment_default.language];
      details.appendChild(wild);
    }
    const credit2 = creditLink(info, "p");
    details.appendChild(credit2);
    if (info.photo_credit != void 0) {
      const other_photos = appleLink(info, "p");
      if (other_photos.children.length > 0) details.appendChild(other_photos);
    }
    return details;
  },
  /** 
   * Display the name and gender symbol for a single panda in the
   * results _title bar_
   * */
  pandaName: function(info) {
    const pandaGender = gender2(info);
    const name_div = document.createElement("div");
    name_div.className = "pandaName";
    if (environment_default.language == "ja") {
      name_div.innerText = info.name;
      const pandaFurigana = furigana(info.name, info.othernames);
      if (pandaFurigana != false) name_div.appendChild(pandaFurigana);
    } else {
      name_div.innerText = info.name;
    }
    const a = document.createElement("a");
    a.href = `#profile/${info._id}`;
    const title_div = document.createElement("div");
    title_div.className = "pandaTitle";
    title_div.appendChild(pandaGender);
    title_div.appendChild(name_div);
    a.appendChild(title_div);
    return a;
  },
  /** Do mom and dad's info in the family section */
  parents: function(info) {
    const heading = document.createElement("h4");
    heading.className = `parentsHeading ${environment_default.language}`;
    heading.innerText = Gui.parents[environment_default.language];
    const ul = document.createElement("ul");
    ul.className = `pandaList ${environment_default.language}`;
    const mom_links = [];
    if (info.mom.length > 0) {
      for (const mom of info.mom) {
        const icon_list = [
          "mom_icon",
          "live_icon"
        ];
        if (info.mom.length > 1) icon_list.push("question_icon");
        const mom_link = animalLink(mom, fallback_name(mom), icon_list);
        mom_links.push(mom_link);
      }
    } else {
      const mom_link = animalLink(Defaults.animal, Defaults.no_name[environment_default.language], [
        "mom_icon"
      ]);
      mom_links.push(mom_link);
    }
    for (const mom_link of mom_links) {
      const mom_li = document.createElement("li");
      mom_li.appendChild(mom_link);
      ul.appendChild(mom_li);
    }
    const dad_links = [];
    if (info.dad.length > 0) {
      for (const dad of info.dad) {
        const icon_list = [
          "dad_icon",
          "live_icon"
        ];
        if (info.dad.length > 1) icon_list.push("question_icon");
        var dad_link = animalLink(dad, fallback_name(dad), icon_list);
        dad_links.push(dad_link);
      }
    } else {
      const dad_link2 = animalLink(Defaults.animal, Defaults.no_name[environment_default.language], [
        "dad_icon"
      ]);
      dad_links.push(dad_link2);
    }
    for (const dad_link2 of dad_links) {
      const dad_li = document.createElement("li");
      dad_li.appendChild(dad_link2);
      ul.appendChild(dad_li);
    }
    const parents = document.createElement("div");
    parents.className = "parents";
    parents.appendChild(heading);
    parents.appendChild(ul);
    return parents;
  },
  /** Leaving a profile page? Turn this into a search bar again */
  searchBar: function() {
    const body = document.getElementsByTagName("body")[0];
    const focalBar = document.querySelector("#focalBar");
    if (focalBar && focalBar.classList.contains("nameBar")) {
      const topSearchBar = searchBar.render("topSearch", "focalBar");
      body.replaceChild(topSearchBar, focalBar);
      searchBar.action();
    }
  },
  /** Do the non-litter siblings info in the family section */
  siblings: function(info) {
    const heading = document.createElement("h4");
    heading.className = `siblingsHeading ${environment_default.language}`;
    heading.innerText = Gui.siblings[environment_default.language];
    const ul = document.createElement("ul");
    ul.className = `pandaList ${environment_default.language}`;
    for (const index in sortOldestToYoungest(info.siblings)) {
      const myself = graphId(info._id);
      const animal = info.siblings[index];
      const icon_list = [
        "child_icon",
        "live_icon"
      ];
      if (halfSiblings(myself, animal)) icon_list.push("half_icon");
      if (indeterminateSiblings(info._id, animal._id) == true) icon_list.push("question_icon");
      const siblings_link = animalLink(animal, fallback_name(animal), icon_list);
      const li = document.createElement("li");
      li.appendChild(siblings_link);
      ul.appendChild(li);
    }
    const siblings = document.createElement("div");
    siblings.className = "siblings";
    siblings.appendChild(heading);
    siblings.appendChild(ul);
    return siblings;
  },
  /** Display information for a zoo relevant to the red pandas */
  zoo: function(zoo) {
    const info = acquireZooInfo(zoo);
    const carousel = new Carousel(info, "zoo", "images/no-zoo.jpg");
    carousel.displayPhoto();
    const frame = document.createElement("div");
    frame.className = "zooPhoto";
    const image = carousel.image;
    const dogEar = carousel.displayPhotoNavigation();
    frame.appendChild(image);
    frame.appendChild(dogEar);
    frame.addEventListener("mouseover", () => dogEar.style.display = "block");
    frame.addEventListener("mouseout", () => dogEar.style.display = "none");
    const title = zooTitle(info);
    const details = this.zooDetails(info);
    const counts = this.zooCounts(info);
    const dossier = document.createElement("div");
    dossier.className = "zooDossier";
    dossier.appendChild(title);
    dossier.appendChild(details);
    dossier.appendChild(counts);
    const result2 = document.createElement("div");
    result2.className = "zooResult";
    result2.appendChild(frame);
    result2.appendChild(dossier);
    this.searchBar();
    return result2;
  },
  /**
   * Display the animals at a zoo as follows:
   * 1) Recently arrived or born animals at the zoo (if any exist)
   *   -- order them together by their sort_time field
   * 2) Recently departed or died animals at the zoo (if any exist)
   *   -- order them together by their sort_time field
   * 3) The other resident animals living at the zoo
   *   -- order them oldest to youngest
   */
  zooAnimals: function(zoo) {
    const animals_to_divs = (animals) => {
      const output_divs = [];
      animals.forEach((animal) => output_divs.push(this.panda(animal)));
      return output_divs;
    };
    const id = zoo._id;
    const deaths = searchPandaZooDied(id, 9);
    const arrivals2 = searchPandaZooArrived(id, 9);
    const born = searchPandaZooBorn(id, 9);
    const departures2 = searchPandaZooDeparted(id, 9);
    let residents2 = searchPandaZooCurrent(id);
    residents2 = removeElementsWithMatchingField(residents2, arrivals2, "_id");
    residents2 = removeElementsWithMatchingField(residents2, born, "_id");
    residents2 = sortOldestToYoungest(residents2);
    const leaving = sortByDate(departures2.concat(deaths), "sort_time", "descending");
    let coming = sortByDate(arrivals2.concat(born), "sort_time", "descending");
    coming = removeElementsWithMatchingField(coming, leaving, "_id");
    const headers = {
      "arrivals": arrivals(zoo, born),
      "departures": departures(zoo, deaths, leaving),
      "residents": residents(zoo)
    };
    let content_divs = [];
    if (coming.length > 0) {
      content_divs = content_divs.concat(headers.arrivals);
      content_divs = content_divs.concat(animals_to_divs(coming));
    }
    if (leaving.length > 0) {
      content_divs = content_divs.concat(headers.departures);
      content_divs = content_divs.concat(animals_to_divs(leaving));
    }
    if (residents2.length > 0) {
      if (leaving.length > 0 || coming.length > 0) {
        content_divs = content_divs.concat(headers["residents"]);
      }
      content_divs = content_divs.concat(animals_to_divs(residents2));
    }
    return content_divs;
  },
  /** The pink "animal counts" information stripe for a zoo */
  zooCounts: function(info) {
    const ul = document.createElement("ul");
    ul.className = "zooCounts";
    const li_items = {
      "living": document.createElement("li"),
      "born": document.createElement("li"),
      "departed": document.createElement("li"),
      "recorded": document.createElement("li")
    };
    const at_zoo = searchPandaZooCurrent(info._id).length;
    if (at_zoo < 1) {
      const text_node = document.createTextNode(Text.zoo_details_no_pandas_live_here[environment_default.language]);
      li_items["living"].appendChild(text_node);
    } else {
      let output_text = Text.zoo_details_pandas_live_here[environment_default.language].replace("<INSERTNUM>", `${at_zoo}`);
      output_text = unpluralize([
        output_text
      ])[0];
      const text_node = document.createTextNode(output_text);
      li_items["living"].appendChild(text_node);
    }
    const born_link = document.createElement("a");
    born_link.href = `#query/born at ${info._id}`;
    const born_at_zoo = searchPandaZooBornRecords(info._id, false);
    const born_known_birthdays = born_at_zoo.filter((panda) => panda.birthday && panda.birthday != "unknown");
    const born_count = born_at_zoo.length;
    const born_known_count = born_known_birthdays.length;
    if (born_known_count > 0) {
      const earliest_born_year = born_known_birthdays[born_known_count - 1]["birthday"].split("/")[0];
      let output_text = Text.zoo_details_babies[environment_default.language].replace("<INSERTBABIES>", `${born_count}`).replace("<INSERTYEAR>", earliest_born_year);
      output_text = unpluralize([
        output_text
      ])[0];
      const text_node = document.createTextNode(output_text);
      born_link.appendChild(text_node);
      li_items["born"].appendChild(born_link);
    }
    const departed_link = document.createElement("a");
    departed_link.href = "javascript:";
    const departed_link_id = `departures/zoo/${info._id}`;
    departed_link.addEventListener("click", function() {
      document.getElementById(departed_link_id)?.scrollIntoView(true);
    });
    const departed_zoo = searchPandaZooDeparted(info._id, 9);
    const died_at_zoo = searchPandaZooDied(info._id, 9);
    const departed_count = departed_zoo.length;
    const died_count = died_at_zoo.length;
    const total_departed = departed_count + died_count;
    if (total_departed > 0) {
      let output_text = Text.zoo_details_departures[environment_default.language].replace("<INSERTNUM>", `${total_departed}`);
      if (died_count > 0) output_text = output_text.concat(" " + Emoji.died);
      output_text = unpluralize([
        output_text
      ])[0];
      const text_node = document.createTextNode(output_text);
      departed_link.appendChild(text_node);
      li_items["departed"].appendChild(departed_link);
    }
    const total_zoo = searchPandaZooBornLived(info._id);
    const total_count = total_zoo.length;
    if (total_count > 0) {
      let earliest_year = -1;
      for (const animal of total_zoo) {
        for (const location1 of animal.locations) {
          const { _id: id, date: date2 } = location1;
          if (date2 != void 0 && id == info._id) {
            const year = parseInt(date2.split("/")[0]);
            if (earliest_year == -1 || year < earliest_year) {
              earliest_year = year;
            }
          }
        }
      }
      const total_link = document.createElement("a");
      total_link.href = `#query/lived at ${info._id}`;
      let output_text = Text.zoo_details_records[environment_default.language].replace("<INSERTNUM>", `${total_count}`).replace("<INSERTYEAR>", `${earliest_year}`);
      output_text = unpluralize([
        output_text
      ])[0];
      const text_node = document.createTextNode(output_text);
      total_link.appendChild(text_node);
      li_items["recorded"].appendChild(total_link);
    }
    for (const message in li_items) {
      if (li_items[message].childNodes.length > 0) {
        ul.appendChild(li_items[message]);
      }
    }
    return ul;
  },
  /** This is the purple "dossier" information stripe for a zoo. */
  zooDetails: function(info) {
    const address = document.createElement("p");
    const address_link = document.createElement("a");
    address_link.innerText = `${Emoji.travel} ${info.address}`;
    address_link.href = info.map;
    address_link.target = "_blank";
    address.appendChild(address_link);
    const zoo_page = document.createElement("p");
    const zoo_link = document.createElement("a");
    zoo_link.href = info.website;
    zoo_link.target = "_blank";
    zoo_link.innerText = `${Emoji.website} ${info.name}`;
    zoo_page.appendChild(zoo_link);
    const details = document.createElement("div");
    details.className = "zooDetails";
    if (info.closed != Defaults.zoo.closed) {
      const date2 = formatDate(info.closed);
      const closed2 = closed(date2);
      details.appendChild(closed2);
    }
    details.appendChild(address);
    details.appendChild(zoo_page);
    if (info.photo != Defaults.photo.url) {
      const credit2 = creditLink(info, "p");
      details.appendChild(credit2);
      const other_photos = appleLink(info, "p");
      if (other_photos.children.length > 0) details.appendChild(other_photos);
    }
    return details;
  }
};
var searchBar = {
  /** Set event listeners for the search bar */
  action: function() {
    const form = document.forms.namedItem("searchForm");
    if (form != null) form.addEventListener("submit", () => this.submit());
    const searchInput = document.querySelector("#searchInput");
    if (searchInput != null) searchInput.style.fontFamily = "sans-serif";
  },
  /** Unhide, enable, and set text cursor focus on the search bar if hidden */
  display: function() {
    const form = document.forms.namedItem("searchForm");
    if (form != null) {
      form.style.display = "block";
      this.enable();
    }
  },
  /**
   * Enable the search bar (i.e. if panda graph content has loaded), and
   * display the placeholder text in a localized way. If a page doesn't have
   * the searchbar, do nothing.
   */
  enable: function() {
    const form = document.forms.namedItem("searchForm");
    const searchInput = document.querySelector("#searchInput");
    if (form != null && searchInput != null) {
      searchInput.disabled = false;
      searchInput.placeholder = "\u27A4 " + Gui.search[environment_default.language];
      this.action();
    }
    if (!("ontouchstart" in window) && searchInput != null) setTimeout(() => searchInput.focus({
      preventScroll: true
    }));
  },
  /**
   * Remove the search bar when leaving profile mode. By default it will be the
   * bottom menu search bar that gets hidden.
   */
  remove: function(frame_id) {
    document.getElementById(frame_id)?.remove();
  },
  /**
   * Generate a search bar. Should be the same kind of bar that would appear
   * either at the top of the search results page, or at the bottom of the
   * profiles page. There can only be one on a page (id logic).
   * 
   * @param frame_class `top_search` or `bottom_search`
   */
  render: function(frame_class, frame_id) {
    const hidden_button = document.createElement("input");
    hidden_button.id = "searchSubmit";
    hidden_button.className = "search";
    hidden_button.type = "submit";
    const text_input = document.createElement("input");
    text_input.id = "searchInput";
    text_input.className = "search";
    text_input.placeholder = "\u27A4 " + Gui.search[environment_default.language];
    text_input.type = "search";
    const form = document.createElement("form");
    form.id = "searchForm";
    form.action = "javascript:";
    form.acceptCharset = "UTF-8";
    form.appendChild(hidden_button);
    form.appendChild(text_input);
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    shrinker.appendChild(form);
    const search_bar = document.createElement("div");
    search_bar.className = frame_class;
    search_bar.id = frame_id;
    search_bar.appendChild(shrinker);
    this.action();
    return search_bar;
  },
  /** JS actions for submiting a search */
  submit: function() {
    const searchInput = document.querySelector("#searchInput");
    if (searchInput == null) return;
    environment_default.current = results.render;
    searchInput.blur();
    const query = searchInput.value.replace(/\s+$/, "");
    window.location.href = `#query/${query}`;
    this.remove("bottomSearch");
    if (!("ontouchstart" in window)) setTimeout(() => searchInput.focus({
      preventScroll: true
    }));
    languageButton.hide();
    window.scrollTo(0, 0);
  },
  /**
   * Normally the search bar just appears at the top of the page. In `#profile`
   * mode, it's hidden unless the user opts to search for new pandas using the
   * Search Button at the bottom of the page.
   */
  toggle: function(frame_id) {
    const searchBar2 = document.getElementById(frame_id);
    if (searchBar2 == null) return false;
    const display = searchBar2.style.display;
    if (display == "none" || display == "") {
      searchBar2.style.display = "table";
      this.action();
      return true;
    } else {
      searchBar2.style.display = "none";
      return false;
    }
  }
};

// ts/touch.ts
var MinLength = 64;
function start(event, touch) {
  touch.fingerCount = event.touches.length;
  touch.timeStart = (/* @__PURE__ */ new Date()).getTime();
  if (touch.fingerCount == 1) {
    touch.startX = event.touches[0].pageX;
    touch.startY = event.touches[0].pageY;
  } else {
    cancel(touch);
  }
}
function move(event, touch) {
  event.preventDefault();
  if (event.touches.length == 1) {
    touch.curX = event.touches[0].pageX;
    touch.curY = event.touches[0].pageY;
    if (touch.xTurn == 0) {
      const newDeltaX = Math.abs(touch.curX - touch.startX);
      if (newDeltaX > touch.deltaX) {
        touch.deltaX = newDeltaX;
      } else {
        touch.xTurn = touch.curX;
        touch.diffHorz = touch.diffHorz + touch.deltaX;
        touch.deltaX = 0;
        touch.turnCount = touch.turnCount + 1;
      }
    } else {
      const newDeltaX = Math.abs(touch.xTurn - touch.curX);
      if (newDeltaX > touch.deltaX) {
        touch.deltaX = newDeltaX;
      } else {
        touch.diffHorz = touch.diffHorz + touch.deltaX;
        touch.xTurn = 0;
        touch.deltaX = 0;
        touch.turnCount = touch.turnCount + 1;
      }
    }
  } else {
    cancel(touch);
  }
}
function end(event, touch, gallery, elementId, callback) {
  event.preventDefault();
  touch.timeEnd = (/* @__PURE__ */ new Date()).getTime();
  if (touch.fingerCount == 1 && touch.curX != 0) {
    touch.swipeLength = Math.round(Math.sqrt(Math.pow(touch.curX - touch.startX, 2) + Math.pow(touch.curY - touch.startY, 2)));
    if (touch.swipeLength >= MinLength || touch.diffHorz > 2 * MinLength) {
      angle(touch);
      determine(touch);
      callback.apply(null, [
        touch,
        gallery,
        elementId
      ]);
    }
  }
  cancel(touch);
}
function cancel(touch) {
  touch.curX = 0;
  touch.curY = 0;
  touch.deltaX = 0;
  touch.diffHorz = 0;
  touch.fingerCount = 0;
  touch.startX = 0;
  touch.startY = 0;
  touch.swipeAngle = null;
  touch.swipeDirection = null;
  touch.swipeLength = 0;
  touch.timeEnd = 0;
  touch.timeStart = 0;
  touch.turnCount = 0;
  touch.xTurn = 0;
}
function angle(touch) {
  const X = touch.startX - touch.curX;
  const Y = touch.curY - touch.startY;
  const r = Math.atan2(Y, X);
  touch.swipeAngle = Math.round(r * 180 / Math.PI);
  if (touch.swipeAngle < 0) {
    touch.swipeAngle = 360 - Math.abs(touch.swipeAngle);
  }
}
function determine(touch) {
  if (touch.swipeAngle == null) {
    return;
  } else if (touch.swipeAngle <= 45 && touch.swipeAngle >= 0) {
    touch.swipeDirection = "left";
  } else if (touch.swipeAngle <= 360 && touch.swipeAngle >= 315) {
    touch.swipeDirection = "left";
  } else if (touch.swipeAngle >= 135 && touch.swipeAngle <= 225) {
    touch.swipeDirection = "right";
  } else if (touch.swipeAngle > 45 && touch.swipeAngle < 135) {
    touch.swipeDirection = "down";
  } else {
    touch.swipeDirection = "up";
  }
}
function processPhoto(touch, gallery, elementId) {
  const animalId = elementId.split("/")[0];
  const navigatorId = `${animalId}/navigator`;
  const navigator2 = document.getElementById(navigatorId);
  const span = navigator2?.childNodes[0];
  if (touch.diffHorz > 2 * MinLength && touch.turnCount > 0 && (touch.swipeDirection == "right" || touch.swipeDirection == "left")) {
    gallery.photoRandom(animalId);
    condenseDogEar(span);
    fade(navigator2);
    window.dispatchEvent(profile.qr_update);
  } else if (touch.swipeDirection == "right") {
    gallery.photoPrevious(animalId);
    condenseDogEar(span);
    fade(navigator2);
    window.dispatchEvent(profile.qr_update);
  } else if (touch.swipeDirection == "left") {
    gallery.photoNext(animalId);
    condenseDogEar(span);
    fade(navigator2);
    window.dispatchEvent(profile.qr_update);
  }
}
function addSwipeHandler(gallery, inputElement, callback) {
  const touch = {
    curX: 0,
    curY: 0,
    deltaX: 0,
    diffHorz: 0,
    fingerCount: 0,
    startX: 0,
    startY: 0,
    swipeAngle: null,
    swipeDirection: null,
    swipeLength: 0,
    timeEnd: 0,
    timeStart: 0,
    turnCount: 0,
    xTurn: 0
  };
  inputElement.addEventListener("touchstart", (event) => start(event, touch), true);
  inputElement.addEventListener("touchend", (event) => end(event, touch, gallery, inputElement.id, callback), true);
  inputElement.addEventListener("touchmove", (event) => move(event, touch), true);
  inputElement.addEventListener("touchcancel", () => cancel(touch), true);
}

// ts/gallery.ts
var Carousel = class {
  type = "panda";
  element_class = "pandaPhoto";
  fallback_url = Defaults.photo.url;
  image = document.createElement("img");
  index = 1;
  info;
  unique;
  constructor(info, type, fallback_url) {
    this.info = info;
    this.type = type;
    this.element_class = `${this.type}Photo`;
    this.index = "photo_index" in info ? info.photo_index : 1;
    this.unique = Math.random().toString(36).slice(2);
    if (fallback_url) this.fallback_url = fallback_url;
    this.image.setAttribute("loading", "lazy");
    if ("ontouchstart" in document.documentElement) {
      addSwipeHandler(this, this.image, processPhoto);
    }
  }
  /**
   * If the media exists for an entity, display it. If it's missing, display a
   * placeholder empty frame that takes up the same amount of space on the page.
   * Support using class variables by default, but allow the `photoSwap` function
   * to use unique parameters as it needs.
   */
  displayPhoto(image = this.image, photoUrl = this.info.photo, id = this.info._id, index = this.index) {
    if (photoUrl == void 0) {
      image.src = this.fallback_url;
    } else {
      image.id = `${this.unique}_${this.type}/${num(id)}/photo/${index}`;
      image.className = `${this.unique}_${this.type}/${num(id)}/photo`;
      url.process(image, photoUrl);
    }
    image.addEventListener("error", () => image.src = this.fallback_url);
  }
  /** The hover over or swipe menu for photo navigation */
  displayPhotoNavigation() {
    const span_link = document.createElement("a");
    span_link.className = "navigatorLink";
    span_link.id = `${this.unique}_${this.type}/${num(this.info._id)}/navigator`;
    span_link.href = "javascript:;";
    const span = document.createElement("span");
    span.className = "navigator";
    if (this.photoCount() < 2) {
      span.innerText = Emoji.no_more;
      span_link.addEventListener("contextmenu", (e) => e.preventDefault());
      span_link.addEventListener("auxclick", (e) => {
        if (e.button == 1) e.preventDefault();
      });
    } else {
      span.innerText = `${this.index}`;
      span_link.addEventListener("click", () => {
        this.photoNext(this.info._id);
        condenseDogEar(span);
        window.dispatchEvent(profile.qr_update);
      });
      span_link.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.photoPrevious(this.info._id);
        condenseDogEar(span);
        window.dispatchEvent(profile.qr_update);
      });
      span_link.addEventListener("auxclick", (e) => {
        if (e.button == 1) {
          e.preventDefault();
          this.photoRandom(this.info._id);
          condenseDogEar(span);
          window.dispatchEvent(profile.qr_update);
        }
      });
    }
    span_link.appendChild(span);
    condenseDogEar(span);
    return span_link;
  }
  /** Utility function to get the current number of photos */
  photoCount() {
    const entity = this.photoEntity();
    return entity.photos.length;
  }
  /** Utility function to get the proper entity for photo counts */
  photoEntity(entity_id = this.info._id) {
    switch (this.type) {
      case "panda":
        return graphId(entity_id);
      case "wild":
        return graphId(entity_id);
      case "zoo":
        return graphId(entity_id);
    }
  }
  /** Navigation input event -- load the next photo in the carousel */
  photoNext(entity_id = this.info._id) {
    const carousel_id = !entity_id.includes("_") ? `${this.unique}_${this.type}/${num(entity_id)}` : entity_id;
    const current_photo_element = document.querySelector(`.${carousel_id}/photo`);
    if (!current_photo_element) return;
    const current_photo_id = current_photo_element.id.split("/")[2];
    this.photoSwap(current_photo_element, parseInt(current_photo_id) + 1);
  }
  /** Navigation input event -- load the previous photo in the carousel */
  photoPrevious(entity_id = this.info._id) {
    const carousel_id = !entity_id.includes("_") ? `${this.unique}_${this.type}/${num(entity_id)}` : entity_id;
    const current_photo_element = document.querySelector(`.${carousel_id}/photo`);
    if (!current_photo_element) return;
    const current_photo_id = current_photo_element.id.split("/")[2];
    this.photoSwap(current_photo_element, parseInt(current_photo_id) - 1);
  }
  /** Navigation input event -- load a random-index photo of this animal */
  photoRandom(entity_id = this.info._id) {
    const carousel_id = !entity_id.includes("_") ? `${this.unique}_${this.type}/${num(entity_id)}` : entity_id;
    if (entity_id.includes("_")) entity_id = carousel_id.split("_").pop();
    const current_photo_element = document.querySelector(`.${carousel_id}/photo`);
    if (!current_photo_element) return;
    const current_photo_id = parseInt(current_photo_element.id.split("/")[2]);
    const entity = graphId(`panda.${entity_id}`);
    let next_id = current_photo_id;
    if (entity.photos.length > 1) while (next_id == current_photo_id) {
      const nextPhoto = randomChoice(entity.photos, 1)[0];
      next_id = entity.photos.indexOf(nextPhoto) + 1;
    }
    this.photoSwap(current_photo_element, next_id);
  }
  /** Switch the currently displayed photo to the next one in the list */
  photoSwap(photo, desired_index) {
    const span_link = photo.parentNode.childNodes[photo.parentNode.childNodes.length - 1];
    const [carousel_id, _, last_index] = photo.id.split("/");
    const max_index = this.photoCount();
    let new_index = 1;
    if (desired_index < 1) new_index = max_index;
    else if (desired_index > max_index) new_index = desired_index % max_index;
    else new_index = desired_index;
    this.index = new_index;
    if (max_index > 1) span_link.childNodes[0].innerText = `${this.index}`;
    else return;
    const entity_id = carousel_id.split("_").pop();
    const entity = this.photoEntity(entity_id);
    const newChoice = entity.photos[new_index - 1];
    this.displayPhoto(photo, newChoice.url, carousel_id, this.index);
    const info = profilePhoto(entity, new_index);
    this.singlePhotoCredit(info, parseInt(last_index), this.index);
    this.userApplePoints(info, parseInt(last_index), this.index);
  }
  /** Replace the photographer's credit info for a panda's photo */
  singlePhotoCredit(info, last_index, current_index) {
    const entity_id = info._id;
    const credit_link = document.querySelector(`#${this.type}/${num(entity_id)}/author/${last_index}`);
    if (!credit_link) return;
    credit_link.id = `${this.type}/${num(entity_id)}/author/${current_index}`;
    if (!Object.keys(Defaults.authors).includes(info.author)) credit_link.href = info.reference;
    else credit_link.removeAttribute("href");
    credit_link.target = "_blank";
    credit_link.innerText = `${Emoji.camera} ${info.author}`;
  }
  /** Replace the photographer's apple points (number of photos on the site) */
  userApplePoints(info, last_index, current_index) {
    const entity_id = info._id;
    const apple_link = document.querySelector(`#${this.type}/${num(entity_id)}/counts/${last_index}`);
    if (!apple_link) return;
    apple_link.id = `${this.type}/${num(entity_id)}/counts/${current_index}`;
    if (!Object.keys(Defaults.authors).includes(info.author)) {
      const apple_count = pandas_default.db._photo.credit[info.author];
      apple_link.href = `#credit/${info.author}`;
      apple_link.innerText = `${Emoji.gift} ${apple_count}`;
      if (apple_count >= 1e3) {
        apple_link.innerText = `${Emoji.megagift} ${apple_count}`;
      }
    } else {
      apple_link.innerText = "";
    }
  }
};
var url = {
  /** Get the thumbnail uri from self-hosting */
  codaworry: (image, input_uri) => {
    const uri_split = input_uri.split("/");
    const cwdc_locator = uri_split.pop();
    const cwdc_url = `https://www.codaworry.com/images/submitted/${cwdc_locator}`;
    image.src = cwdc_url;
  },
  /** Unroll various custom link formats into things that work as href */
  href: (uri) => {
    if (uri.indexOf("http") == 0) return uri;
    else if (uri.indexOf("ig") == 0) {
      const ig_locator = uri.split("/")[2];
      return `https://www.instagram.com/p/${ig_locator}`;
    } else if (uri.indexOf("cwdc") == 0) {
      const cwdc_locator = uri.split("/")[2];
      return `https://www.codaworry.com/images/submitted/${cwdc_locator}`;
    } else {
      return Defaults.photo.url;
    }
  },
  /** 
   * Support a colorful cast of formats for getting underlying image hrefs.
   * The `<img>` element is processed and eventually its `src` is updated
   */
  process: (image, uri) => {
    if (uri.indexOf("http") == 0) {
      image.src = uri;
    } else if (uri.indexOf("cwdc") == 0) {
      url.codaworry(image, uri);
    } else {
      image.src = Defaults.photo.url;
    }
  }
};
function birthdayPhotoCredits(photo_count = 3, max_animals = 5) {
  const birthday_div = document.createElement("div");
  let birthday_animals = searchBirthdayToday(true, photo_count);
  const birthday_count = birthday_animals.length;
  if (birthday_count > max_animals) {
    birthday_animals = searchBirthdayLitterBias(true, photo_count, max_animals);
    const overflow = birthday_overflow(birthday_count);
    birthday_div.appendChild(overflow);
  }
  for (const animal of birthday_animals) {
    const info = acquirePandaInfo(animal);
    const years_old = ageYears(animal);
    const message = birthday3(info.name, num(info._id), years_old);
    birthday_div.appendChild(message);
    const photos = searchPhotoTags([
      animal
    ], [
      "portrait"
    ], "photos", "first");
    for (const photo of randomChoice(photos, photo_count)) {
      const img_link = document.createElement("a");
      img_link.href = `#panda/${num(animal._id)}/photo/${photo.index}`;
      const img = document.createElement("img");
      img.setAttribute("loading", "lazy");
      url.process(img, photo.url);
      img_link.appendChild(img);
      const caption_link = document.createElement("a");
      caption_link.href = url.href(photo.reference);
      caption_link.target = "_blank";
      const caption = document.createElement("h5");
      caption.className = "caption birthdayMessage";
      const caption_span = document.createElement("span");
      caption_span.innerText = `${Emoji.camera} ${photo.author}`;
      caption.appendChild(caption_span);
      caption_link.appendChild(caption);
      const container = document.createElement("div");
      container.className = "photoSample quarterPage";
      container.appendChild(img_link);
      container.appendChild(caption_link);
      birthday_div.appendChild(container);
    }
  }
  return birthday_div;
}
function condenseDogEar(nav) {
  switch (nav.innerText.length) {
    case 3:
      nav.classList.remove("fourDigits");
      nav.classList.add("threeDigits");
      break;
    case 4:
      nav.classList.remove("threeDigits");
      nav.classList.add("fourDigits");
      break;
    default:
      nav.classList.remove("threeDigits");
      nav.classList.remove("fourDigits");
  }
}
function creditPhotos(results2, max_hits) {
  const photo_results = creditPhotosPage(0, results2, max_hits);
  const content_divs = photo_results["output"];
  const photo_count = photo_results["hit_count"];
  const header = results2.filter != void 0 ? creditSingleFilter(results2.subject, results2.filter, photo_count) : credit(results2.subject, photo_count);
  content_divs.unshift(header);
  return content_divs;
}
function creditPhotosPage(page, results2, max_hits) {
  let content_divs = [];
  const initial_max_hits = max_hits;
  const grab_photos = results2.hits.map((entity) => entity).flatMap((entity) => nodePhotoCredits(entity, results2.subject));
  const starting_point = page * environment_default.paging.results_count;
  let content_photos = grab_photos.slice(starting_point);
  const hit_count = content_photos.length;
  if (page == 0 && environment_default.paging.shown_pages > 1) max_hits = environment_default.paging.shown_pages * max_hits;
  if (hit_count <= max_hits) {
    environment_default.paging.display_button = false;
  } else {
    content_photos = content_photos.slice(0, max_hits);
    environment_default.paging.callback.function = creditPhotosPage;
    const pages_shown = initial_max_hits / environment_default.paging.results_count;
    environment_default.paging.callback.arguments = [
      page + pages_shown,
      results2,
      environment_default.paging.results_count
    ];
    environment_default.paging.callback.frame_id = "contentFrame";
  }
  content_photos.forEach(function(photo) {
    if (photo.type == "panda" || photo.type == "media") content_divs = content_divs.concat(pandaPhotoCreditSingle(photo));
    if (photo.type == "zoo") content_divs = content_divs.concat(zooPhotoCreditSingle(photo));
  });
  footer.redraw("results");
  return {
    "output": content_divs,
    "hit_count": grab_photos.length
  };
}
function familyProfilePhoto(animal, chosen_photo, relationship, frame_class, multiple = false) {
  const info = acquirePandaInfo(animal);
  const container = document.createElement("div");
  container.className = "photoSample";
  if (frame_class != void 0) container.classList.add(frame_class);
  const clickable_photo = document.createElement("a");
  clickable_photo.target = "_blank";
  if (chosen_photo && chosen_photo.url != Defaults.photo.url) clickable_photo.href = url.href(chosen_photo.url);
  const image = document.createElement("img");
  image.setAttribute("loading", "lazy");
  const photoUrl = chosen_photo ? chosen_photo.url : Defaults.photo.url;
  url.process(image, photoUrl);
  clickable_photo.appendChild(image);
  container.appendChild(clickable_photo);
  const animal_name = document.createElement("a");
  animal_name.href = `#profile/${animal._id}`;
  const animal_text = document.createElement("h5");
  animal_text.className = "caption familyName";
  animal_text.innerText = info.name;
  animal_name.appendChild(animal_text);
  animal_name.addEventListener("click", topButton.action);
  container.appendChild(animal_name);
  if (relationship != void 0) {
    const animal_relation = document.createElement("a");
    animal_relation.href = `#profile/${animal._id}`;
    const relation_text = document.createElement("h5");
    relation_text.className = "caption familyTitle";
    const gender3 = genderAnimal(animal, "caption gender");
    relation_text.appendChild(gender3);
    const span = document.createElement("span");
    const text = document.createTextNode(relationship);
    if (relationship == Gui.quadruplet["en"]) span.classList.add("condensed");
    span.appendChild(text);
    relation_text.appendChild(span);
    let emojis = "";
    if (relationship == Gui.me[environment_default.language]) emojis = "\u200A" + Emoji.profile;
    if (multiple == true) emojis = Emoji.question;
    if (animal.death != void 0) emojis = emojis + "\u200A" + Emoji.died;
    const emoji_text = document.createTextNode(emojis);
    relation_text.appendChild(emoji_text);
    animal_name.appendChild(relation_text);
  }
  return container;
}
function groupPhotos(id_list) {
  const photo_list = [];
  for (const id of id_list) {
    const entities = searchPandaMedia(id, true);
    for (const entity of entities) {
      const photos = entity.photos;
      for (const photo of photos) {
        photo_list.push({
          "entity": entity,
          "photo": photo
        });
      }
    }
  }
  return shuffleWithSeed(photo_list, environment_default.paging.seed);
}
function groupPhotosPage(page, id_list, photo_count) {
  const initial_photo_count = photo_count;
  if (page == 0 && environment_default.paging.shown_pages > 1) {
    photo_count = environment_default.paging.shown_pages * photo_count;
  }
  const entityPhotos = groupPhotos(id_list);
  let chosen = entityPhotos.slice(page * photo_count);
  if (chosen.length <= photo_count) environment_default.paging.display_button = false;
  else {
    chosen = chosen.slice(0, photo_count);
    environment_default.paging.callback.function = groupPhotosPage;
    environment_default.paging.callback.arguments = [
      page + 1,
      id_list,
      initial_photo_count
    ];
    environment_default.paging.callback.frame_id = "contentFrame";
  }
  const output = [];
  for (const entityPhoto of chosen) {
    const container = groupPhotoSingle(entityPhoto);
    output.push(container);
  }
  footer.redraw("profile");
  return {
    "output": output
  };
}
function groupPhotosIntersect(id_list) {
  const output = [];
  const entities = searchPandaMediaIntersect(id_list);
  for (const entity of entities) {
    const photos = entity.photos;
    for (const photo of photos) {
      output.push({
        "entity": entity,
        "photo": photo
      });
    }
  }
  return output;
}
function groupPhotosIntersectPage(page, id_list, photo_count) {
  const initial_photo_count = photo_count;
  if (page == 0 && environment_default.paging.shown_pages > 1) photo_count = environment_default.paging.shown_pages * photo_count;
  const entityPhotos = groupPhotosIntersect(id_list);
  let chosen = entityPhotos.slice(page * photo_count);
  if (chosen.length <= photo_count) environment_default.paging.display_button = false;
  else {
    chosen = chosen.slice(0, photo_count);
    environment_default.paging.callback.function = groupPhotosIntersectPage;
    environment_default.paging.callback.arguments = [
      page + 1,
      id_list,
      initial_photo_count
    ];
    environment_default.paging.callback.frame_id = "contentFrame";
  }
  const output = [];
  for (const entityPhoto of chosen) {
    const container = groupPhotoSingle(entityPhoto);
    output.push(container);
  }
  footer.redraw("profile");
  return {
    "output": output
  };
}
function groupPhotoSingle(entityPhoto) {
  const imgUrl = entityPhoto.photo.url;
  const img_link = document.createElement("a");
  img_link.href = url.href(imgUrl);
  const img = document.createElement("img");
  img.setAttribute("loading", "lazy");
  url.process(img, imgUrl);
  img_link.appendChild(img);
  const caption_names = document.createElement("h5");
  caption_names.className = "caption groupMediaName";
  const caption_names_span = document.createElement("span");
  caption_names_span.innerText = groupMediaCaption(entityPhoto.entity, entityPhoto.photo);
  caption_names.appendChild(caption_names_span);
  const caption_names_link = document.createElement("a");
  const panda_route = entityPhoto.entity["panda.tags"].join("/");
  caption_names_link.href = `#group/${panda_route}`;
  caption_names_link.appendChild(caption_names);
  const author = entityPhoto.photo.author;
  const caption_credit_link = document.createElement("a");
  caption_credit_link.href = `#credit/${author}`;
  const caption_credit = document.createElement("h5");
  caption_credit.className = "caption groupMediaAuthor";
  const caption_credit_span = document.createElement("span");
  caption_credit_span.innerText = `${Emoji.apple} ${author}`;
  caption_credit.appendChild(caption_credit_span);
  caption_credit_link.appendChild(caption_credit);
  const container = document.createElement("div");
  container.className = "photoSample";
  if (imgUrl.indexOf("/l") == imgUrl.length - 2 && imgUrl.indexOf("ig://") == 0) {
    container.classList.add("halfPage");
  } else if (imgUrl.indexOf("/m") == imgUrl.length - 2 && imgUrl.indexOf("ig://") == 0) {
    container.classList.add("quarterPage");
  } else if (imgUrl.indexOf("ig://") == -1) {
    container.classList.add("fullPage");
  } else {
    container.classList.add("quarterPage");
  }
  container.appendChild(img_link);
  container.appendChild(caption_names_link);
  container.appendChild(caption_credit_link);
  return container;
}
function memorialPhotoCredits(id_list, photo_count = 5, message_function) {
  const memorial_div = document.createElement("div");
  for (const id of id_list) {
    const animal = graphId(id);
    const info = acquirePandaInfo(animal);
    const message = message_function(info.name, num(info._id), info.birthday, info.death);
    memorial_div.appendChild(message);
    const photos = searchPhotoTags([
      animal
    ], [
      "portrait"
    ], "photos", "first");
    for (const photo of randomChoice(photos, photo_count)) {
      const img_link = document.createElement("a");
      img_link.href = `#panda/${num(animal._id)}/photo/${photo.index}`;
      const img = document.createElement("img");
      img.setAttribute("loading", "lazy");
      url.process(img, photo.url);
      img_link.appendChild(img);
      const caption_link = document.createElement("a");
      caption_link.href = url.href(photo.reference);
      caption_link.target = "_blank";
      const caption = document.createElement("h5");
      caption.className = "caption memorialMessage";
      const caption_span = document.createElement("span");
      caption_span.innerText = `${Emoji.camera} ${photo.author}`;
      caption.appendChild(caption_span);
      caption_link.appendChild(caption);
      const container = document.createElement("div");
      container.className = "photoSample quarterPage";
      container.appendChild(img_link);
      container.appendChild(caption_link);
      memorial_div.appendChild(container);
    }
  }
  return memorial_div;
}
function memorialPhotoCreditsGroup(group_id, id_list, photo_count = 5) {
  const memorial_div = document.createElement("div");
  const group2 = graphId(group_id);
  const id_link_string = id_list.join("/");
  const name_list = id_list.map((numId) => `panda.${numId}`).map((prefixId) => graphId(prefixId)).map((animal) => fallback_name(animal));
  const name_string = commaPhraseBare(name_list);
  const message = memorialGroup(name_string, id_link_string);
  memorial_div.appendChild(message);
  let photos = searchPhotoTags([
    group2
  ], [
    "portrait"
  ], "photos", "first");
  for (const id of id_list) {
    const animal = graphId(id);
    const individual_all = searchPhotoTags([
      animal
    ], [
      "portrait"
    ], "photos", "first");
    const individual_sample = randomChoice(individual_all, 2);
    photos = photos.concat(individual_sample);
  }
  photos = shuffle(photos);
  for (const photo of randomChoice(photos, photo_count)) {
    const img_link = document.createElement("a");
    img_link.href = `#group/${id_link_string}`;
    const img = document.createElement("img");
    img.setAttribute("loading", "lazy");
    url.process(img, photo.url);
    img_link.appendChild(img);
    const caption_link = document.createElement("a");
    caption_link.href = url.href(photo.reference);
    caption_link.target = "_blank";
    const caption = document.createElement("h5");
    caption.className = "caption memorialMessage";
    const caption_span = document.createElement("span");
    caption_span.innerText = `${Emoji.camera} ${photo.author}`;
    caption.appendChild(caption_span);
    caption_link.appendChild(caption);
    const container = document.createElement("div");
    container.className = "photoSample quarterPage";
    container.appendChild(img_link);
    container.appendChild(caption_link);
    memorial_div.appendChild(container);
  }
  return memorial_div;
}
function nodePhotoCredits(node, credit2) {
  if (!credit2) return [];
  const photos = [];
  for (const [index, photo] of node.photos.entries()) {
    if (photo.author == credit2) {
      photos.push({
        "_id": node._id,
        "author": photo.author,
        "coordinates": photo.coordinates ?? {},
        "index": index + 1,
        "reference": authorLink(photo.author, photo.source),
        "tags": [],
        "type": node.type,
        "url": photo.url
      });
    }
  }
  return photos;
}
function pandaPhotoCreditSingle(photo) {
  const img_link = document.createElement("a");
  const id = photo._id;
  img_link.href = url.href(photo.url);
  img_link.target = "_blank";
  const img = document.createElement("img");
  img.setAttribute("loading", "lazy");
  url.process(img, photo.url);
  img_link.appendChild(img);
  const caption_link = document.createElement("a");
  const caption = document.createElement("h5");
  caption.className = "caption pandaName";
  if (photo.type == "media") {
    const entity = graphId(id);
    caption.innerText = groupMediaCaption(entity, photo);
    const panda_route = entity["panda.tags"].join("/");
    caption_link.href = `#group/${panda_route}`;
  } else {
    const animal = graphId(id);
    const info = acquirePandaInfo(animal);
    caption.innerText = info.name;
    caption_link.href = `#panda/${num(id)}/photo/${photo.index}`;
  }
  caption_link.appendChild(caption);
  const container = document.createElement("div");
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  return container;
}
function tagPhotos(results2, max_hits, add_emoji) {
  const hit_count = results2.hits.length;
  const paging_data = tagPhotosPage(0, results2, max_hits, add_emoji);
  const content_divs = paging_data.output;
  const header = tagPhotoMessage(results2, hit_count);
  content_divs.unshift(header);
  return content_divs;
}
function tagPhotosPage(page, results2, max_hits, add_emoji) {
  let content_divs = [];
  const initial_max_hits = max_hits;
  const starting_point = page * environment_default.paging.results_count;
  let page_results = results2.hits.slice();
  page_results = shuffleWithSeed(page_results, environment_default.paging.seed);
  page_results = page_results.slice(starting_point);
  const hit_count = page_results.length;
  if (page == 0 && environment_default.paging.shown_pages > 1) {
    max_hits = environment_default.paging.shown_pages * max_hits;
  }
  if (hit_count <= max_hits) environment_default.paging.display_button = false;
  else {
    page_results = page_results.slice(0, max_hits);
    environment_default.paging.callback.function = tagPhotosPage;
    const pages_shown = initial_max_hits / environment_default.paging.results_count;
    environment_default.paging.callback.arguments = [
      page + pages_shown,
      results2,
      environment_default.paging.results_count,
      add_emoji
    ];
    environment_default.paging.callback.frame_id = "contentFrame";
  }
  footer.redraw("results");
  for (const photo of page_results) {
    if (photo.index != 0) content_divs = content_divs.concat(tagPhotoSingle(photo, add_emoji));
    else {
      page_results.splice(page_results.indexOf(photo), 1);
    }
  }
  return {
    "output": content_divs
  };
}
function tagPhotoMessage(results2, hit_count) {
  let header = void 0;
  if (hit_count == 0) {
    header = emptyResult(Text.no_subject_tag_result);
  } else if (results2.parsed == "set_tag" || results2.parsed == "set_tag_subject") {
    const tag = results2.tag != void 0 ? results2.tag : results2.query;
    const ctag = tagPrimary(tag);
    header = tag_subject(hit_count, results2.subject, Tags[ctag].emoji.join(""), ctag);
  } else if (results2.parsed == "set_baby_subject") {
    const tag = results2.tag != void 0 ? results2.tag : results2.query;
    const ctag = tagPrimary(tag);
    header = tag_subject(hit_count, results2.subject, Polyglots[ctag].emoji.join(""), ctag);
  } else if (results2.parsed == "set_tag_intersection") {
    const tag = results2.tag != void 0 ? results2.tag : results2.query;
    const emojis = tag.split(", ").flatMap((tag2) => Tags[tag2].emoji);
    header = tag_combo(hit_count, emojis);
  } else if (results2.parsed == "set_tag_intersection_subject") {
    const tag = results2.tag != void 0 ? results2.tag : results2.query;
    const emojis = tag.split(", ").flatMap((tag2) => Tags[tag2].emoji);
    header = tag_combo(hit_count, emojis);
  } else {
    header = emptyResult(Text.no_subject_tag_result);
  }
  return header;
}
function tagPhotoSingle(photo, add_emoji) {
  const content_divs = [];
  const node = graphId(photo._id);
  const img_link = document.createElement("a");
  img_link.href = url.href(photo.url);
  img_link.target = "_blank";
  const img = document.createElement("img");
  img.setAttribute("loading", "lazy");
  url.process(img, photo.url);
  img_link.appendChild(img);
  const caption_link = document.createElement("a");
  const caption = document.createElement("h5");
  caption.className = "caption updateTagName";
  if (node.type == "media") {
    caption.innerText = groupMediaCaption(node, photo);
    const panda_route = node["panda.tags"].join("/");
    caption_link.href = `#group/${panda_route}`;
  } else {
    const info = acquirePandaInfo(node);
    caption.innerText = info.name;
    caption_link.href = `#panda/${num(node._id)}/photo/${photo.index}`;
  }
  const tag_lookup = Tags[photo.tags[0]];
  if (tag_lookup != void 0 && add_emoji == true) {
    const emoji2 = tag_lookup["emoji"];
    caption.innerText = emoji2 + "\xA0" + caption.innerText;
  }
  caption_link.appendChild(caption);
  const container = document.createElement("div");
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  content_divs.push(container);
  return content_divs;
}
function updatedNewPhotoCredits(photo_count = 7) {
  const new_photos_div = document.createElement("div");
  const message = new_photos();
  new_photos_div.appendChild(message);
  const display_photos = updatedPhotoOrdering(photo_count);
  for (const photo of display_photos) {
    const img_link = document.createElement("a");
    img_link.href = url.href(photo.url);
    img_link.target = "_blank";
    const img = document.createElement("img");
    img.setAttribute("loading", "lazy");
    url.process(img, photo.url);
    img_link.appendChild(img);
    const caption_link = document.createElement("a");
    if (photo.type != "media") caption_link.href = `#panda/${num(photo._id)}/photo/${photo.index}`;
    const caption = document.createElement("h5");
    caption.className = "caption updateName";
    if (photo.classes) for (let caption_class of photo.classes) caption.classList.add(caption_class);
    const node = graphId(photo._id);
    let updateName = void 0;
    if (node.type == "media") {
      updateName = groupMediaCaption(node, photo);
      const panda_route = node["panda.tags"].join("/");
      caption_link.href = `#group/${panda_route}`;
    } else {
      const info = acquirePandaInfo(node);
      updateName = info.name;
    }
    if ("name_icon" in photo) updateName = `${photo.name_icon} ${updateName}`;
    caption.innerText = updateName;
    const author = document.createElement("h5");
    author.className = "caption updateAuthorCredit";
    const author_span = document.createElement("span");
    if ("credit_icon" in photo) {
      author_span.innerText = photo.credit_icon + "\xA0" + photo.author;
      caption.classList.add("newContributor");
    } else author_span.innerText = Emoji.camera + "\xA0" + photo.author;
    author.appendChild(author_span);
    caption_link.appendChild(caption);
    caption_link.appendChild(author);
    const container = document.createElement("div");
    container.className = "photoSample";
    container.appendChild(img_link);
    container.appendChild(caption_link);
    new_photos_div.appendChild(container);
  }
  return new_photos_div;
}
function updatedPhotoOrdering(photo_count) {
  const zoo_locators = pandas_default.db._updates.entities.filter((locator) => locator.indexOf("zoo.") == 0);
  const zoo_photos = uniqueField(locatorsToPhotos(zoo_locators), "_id").filter((photo) => {
    const pandas = searchPandaZoo(photo._id).filter((panda) => "photos" in panda);
    return pandas.length > 0;
  }).filter((photo) => {
    return !Object.keys(Defaults.authors).includes(photo.author);
  });
  let zoo_chosen = randomChoice(zoo_photos, photo_count);
  zoo_chosen = sortPhotosByName(zoo_chosen);
  const author_locators = pandas_default.db._updates.authors;
  const author_photos_all = locatorsToPhotos(author_locators).filter(function(photo) {
    return !Object.keys(Defaults.authors).includes(photo.author);
  });
  const author_photos = uniqueField(author_photos_all, "_id");
  let author_chosen = author_photos.slice();
  author_chosen = author_chosen.filter((photo) => photo.type != "zoo");
  author_chosen = randomChoice(author_chosen, photo_count);
  if (author_chosen.length > 3) {
    author_chosen = uniqueField(author_chosen, "credit");
  }
  author_chosen = sortPhotosByName(author_chosen);
  const new_panda_locators = pandas_default.db._updates.entities.filter((locator) => locator.indexOf("panda.") == 0).filter((locator) => !author_locators.includes(locator));
  const new_panda_photos = uniqueField(locatorsToPhotos(new_panda_locators), "_id").filter(function(photo) {
    return !Object.keys(Defaults.authors).includes(photo.author);
  });
  let new_panda_chosen = randomChoice(new_panda_photos, photo_count);
  new_panda_chosen = sortPhotosByName(new_panda_chosen);
  const panda_locators = pandas_default.db._updates.entities.filter((locator) => !zoo_locators.includes(locator));
  const panda_photos = uniqueField(locatorsToPhotos(panda_locators), "_id");
  const update_locators = pandas_default.db._updates.photos.filter((locator) => !pandas_default.db._updates.entities.includes(locator)).filter((locator) => !pandas_default.db._updates.authors.includes(locator)).filter((locator) => !locator.includes("zoo."));
  let update_photos = uniqueField(locatorsToPhotos(update_locators), "_id").filter(function(photo) {
    return !Object.keys(Defaults.authors).includes(photo.author);
  });
  const output_photos = [];
  const all_zoo_pandas = [];
  const zoo_classes = [
    "one",
    "two",
    "three",
    "four"
  ];
  let zoo_class_index = 0;
  for (const zoo_photo of zoo_chosen) {
    if (photo_count == 0) {
      return output_photos;
    }
    if (author_photos_all.map((photo) => photo.author).includes(zoo_photo.author)) {
      zoo_photo.credit_icon = Emoji.giftwrap;
    }
    if (pandas_default.db._photo.credit[zoo_photo.author] == 1) {
      zoo_photo.credit_icon = Emoji.giftwrap;
    }
    const class_list = [
      "zoo",
      zoo_classes[zoo_class_index % zoo_classes.length]
    ];
    zoo_photo.classes = class_list;
    output_photos.push(zoo_photo);
    const zoo_panda_ids = searchPandaZoo(zoo_photo._id).map((panda) => panda._id);
    let zoo_pandas = author_photos.concat(panda_photos).concat(update_photos).filter((panda) => zoo_panda_ids.includes(panda._id)).filter(function(panda) {
      const currenttime = (/* @__PURE__ */ new Date()).getTime();
      const commitdate = graphId(panda._id).commitdate;
      const committime = new Date(commitdate).getTime();
      const ms_per_week = 1e3 * 60 * 60 * 24 * 7;
      return currenttime - committime > ms_per_week;
    });
    zoo_pandas = uniqueField(zoo_pandas, "_id");
    zoo_pandas = sortPhotosByName(zoo_pandas);
    for (const zoo_panda of zoo_pandas) {
      zoo_panda.name_icon = Emoji.profile;
      if (author_photos_all.map((photo) => photo.author).includes(zoo_panda.author)) {
        zoo_panda.credit_icon = Emoji.giftwrap;
      }
      if (pandas_default.db._photo.credit[zoo_panda.author] == 1) {
        zoo_panda.credit_icon = Emoji.giftwrap;
      }
      zoo_panda.classes = class_list;
      output_photos.push(zoo_panda);
      all_zoo_pandas.push(zoo_panda);
      photo_count = photo_count - 1;
    }
    photo_count = photo_count - 1;
    zoo_class_index = zoo_class_index + 1;
  }
  for (const author_photo of author_chosen) {
    if (photo_count == 0) {
      return output_photos;
    }
    const all_zoo_panda_ids = all_zoo_pandas.map((x) => x._id);
    if (all_zoo_panda_ids.includes(author_photo._id)) {
      continue;
    }
    if (panda_photos.map((panda) => panda._id).includes(author_photo._id) && !author_photo._id.toString().includes("media")) {
      author_photo.name_icon = Emoji.profile;
    }
    author_photo.credit_icon = Emoji.giftwrap;
    output_photos.push(author_photo);
    photo_count = photo_count - 1;
  }
  for (const new_panda_photo of new_panda_chosen) {
    if (photo_count == 0) {
      return output_photos;
    }
    const all_zoo_panda_ids = all_zoo_pandas.map((x) => x._id);
    const new_panda_photo_id = new_panda_photo._id;
    if (all_zoo_panda_ids.includes(new_panda_photo_id)) {
      continue;
    }
    new_panda_photo.name_icon = Emoji.profile;
    output_photos.push(new_panda_photo);
    photo_count = photo_count - 1;
  }
  update_photos = update_photos.filter((photo) => !author_photos.concat(panda_photos).map((others) => others._id).includes(photo._id));
  let update_chosen = randomChoice(update_photos, photo_count);
  update_chosen = sortPhotosByName(update_chosen);
  for (const update_photo of update_chosen) {
    if (photo_count == 0) {
      return output_photos;
    }
    output_photos.push(update_photo);
    photo_count = photo_count - 1;
  }
  return output_photos;
}
function zooPhotoCreditSingle(photo) {
  const index = photo.index;
  const img_link = document.createElement("a");
  const id = photo._id;
  const entity = graphId(id);
  const info = acquireZooInfo(entity);
  img_link.href = url.href(photo.url);
  img_link.target = "_blank";
  const img = document.createElement("img");
  img.setAttribute("loading", "lazy");
  url.process(img, photo.url);
  img_link.appendChild(img);
  const caption_link = document.createElement("a");
  caption_link.href = `#zoo/${id}/photo/${index}`;
  const caption = document.createElement("h5");
  caption.className = "caption zooName";
  caption.innerText = info.name;
  caption_link.appendChild(caption);
  const container = document.createElement("div");
  container.className = "photoSample";
  container.appendChild(img_link);
  container.appendChild(caption_link);
  return container;
}
function taglist(photo_count = 5, taglist1, message_function) {
  const div = document.createElement("div");
  const message = message_function();
  div.appendChild(message);
  const animals_photos = searchPandaAnyPhotoMedia();
  const photos = searchPhotoTags(animals_photos, taglist1, "intersect", "none");
  for (const photo of randomChoice(photos, photo_count)) {
    const img_link = document.createElement("a");
    img_link.href = url.href(photo.url);
    const img = document.createElement("img");
    img.setAttribute("loading", "lazy");
    url.process(img, photo.url);
    img_link.appendChild(img);
    const name_caption_link = document.createElement("a");
    name_caption_link.href = `#panda/${num(photo._id)}/photo/${photo.index}`;
    const name_caption = document.createElement("h5");
    name_caption.className = "caption updateName";
    const name_caption_span = document.createElement("span");
    const node = graphId(photo._id);
    let updateName = void 0;
    if (node.type == "media") {
      updateName = groupMediaCaption(node, photo);
      const panda_route = node["panda.tags"].join("/");
      name_caption_link.href = `#group/${panda_route}`;
    } else {
      const info = acquirePandaInfo(node);
      updateName = info.name;
    }
    name_caption_span.innerText = updateName;
    name_caption.appendChild(name_caption_span);
    name_caption_link.appendChild(name_caption);
    const credit_caption_link = document.createElement("a");
    credit_caption_link.href = url.href(photo.reference);
    credit_caption_link.target = "_blank";
    const credit_caption = document.createElement("h5");
    credit_caption.className = "caption updateAuthor";
    const credit_caption_span = document.createElement("span");
    credit_caption_span.innerText = `${Emoji.camera} ${photo.author}`;
    credit_caption.appendChild(credit_caption_span);
    credit_caption_link.appendChild(credit_caption);
    const container = document.createElement("div");
    container.className = "photoSample quarterPage";
    container.appendChild(img_link);
    container.appendChild(name_caption_link);
    container.appendChild(credit_caption_link);
    div.appendChild(container);
  }
  return div;
}

// js/jsleri-1.1.15.js
var noop = function() {
};
var RE_LEFT_WHITESPACE = /^\s+/;
var RE_KEYWORDS = /^\w+/;
var RE_WHITESPACE = /\s+/;
var isFunction = function(obj) {
  return typeof obj === "function";
};
var buildReKeywords = function(re) {
  if (typeof re === "string" && re.indexOf("^", 0) !== 0) {
    re = "^" + re;
  }
  return new RegExp(re);
};
var sortOnStrLen = function(a, b) {
  return a.length < b.length;
};
var parse = function(element, str, tree2, reKeywords) {
  var expecting = new Expecting();
  var appendTree = function(tree3, node, pos) {
    if (pos > expecting.pos) {
      expecting.empty();
    }
    node.end = pos;
    node.str = str.substring(node.start, node.end);
    tree3.push(node);
  };
  var walk2 = function(element2, pos, tree3, rule, isRequired) {
    var s, isValid, nodeRes2, i, l, reMatch, children, node, mostGreedy;
    s = str.substring(pos).replace(RE_LEFT_WHITESPACE, "");
    node = new Node2(element2, str.length - s.length);
    expecting.setModeRequired(node.start, isRequired);
    if (element2 instanceof Choice) {
      mostGreedy = new NodeResult(false, node.start);
      for (i = 0, l = element2.elements.length; i < l; i++) {
        children = [];
        nodeRes2 = walk2(element2.elements[i], node.start, children, rule, true);
        if (nodeRes2.isValid && nodeRes2.pos > mostGreedy.pos) {
          node.children = children;
          mostGreedy = nodeRes2;
        }
      }
      if (mostGreedy.isValid) appendTree(tree3, node, mostGreedy.pos);
      return mostGreedy;
    }
    if (element2 instanceof Keyword) {
      reMatch = s.match(reKeywords);
      isValid = element2.ignCase ? Boolean(reMatch && reMatch[0].toLowerCase() === element2.keyword.toLowerCase()) : Boolean(reMatch && reMatch[0] === element2.keyword);
      if (isValid) appendTree(tree3, node, node.start + element2.keyword.length);
      else expecting.update(element2, node.start);
      return new NodeResult(isValid, node.end || node.start);
    }
    if (element2 instanceof List) {
      pos = node.start;
      for (i = 0, l = 0; ; ) {
        nodeRes2 = walk2(element2.element, pos, node.children, rule, i < element2.min);
        if (!nodeRes2.isValid) break;
        pos = nodeRes2.pos;
        i++;
        nodeRes2 = walk2(element2.delimiter, pos, node.children, rule, i < element2.min);
        if (!nodeRes2.isValid) break;
        pos = nodeRes2.pos;
        l++;
      }
      isValid = !(i < element2.min || element2.max && i > element2.max || !element2.opt && i && i == l);
      if (isValid) appendTree(tree3, node, pos);
      return new NodeResult(isValid, pos);
    }
    if (element2 instanceof Optional) {
      nodeRes2 = walk2(element2.element, node.start, node.children, rule, false);
      if (nodeRes2.isValid) appendTree(tree3, node, nodeRes2.pos);
      return new NodeResult(true, node.end || node.start);
    }
    if (element2 instanceof Prio) {
      if (rule._tested[node.start] === void 0) {
        rule._tested[node.start] = new NodeResult(false, node.start);
      }
      for (i = 0, l = element2.elements.length; i < l; i++) {
        children = [];
        nodeRes2 = walk2(element2.elements[i], node.start, children, rule, true);
        if (nodeRes2.isValid && nodeRes2.pos > rule._tested[node.start].pos) {
          node.children = children;
          rule._tested[node.start] = nodeRes2;
          rule._tree[node.start] = children;
        }
      }
      if (rule._tested[node.start].isValid) appendTree(tree3, node, rule._tested[node.start].pos);
      return rule._tested[node.start];
    }
    if (element2 instanceof Regex) {
      reMatch = s.match(element2._re);
      isValid = Boolean(reMatch);
      if (isValid) appendTree(tree3, node, node.start + reMatch[0].length);
      else expecting.update(element2, node.start);
      return new NodeResult(isValid, node.end || node.start);
    }
    if (element2 instanceof Repeat) {
      pos = node.start;
      for (i = 0; !element2.max || i < element2.max; i++) {
        nodeRes2 = walk2(element2.element, pos, node.children, rule, i < element2.min);
        if (!nodeRes2.isValid) break;
        pos = nodeRes2.pos;
      }
      isValid = i >= element2.min;
      if (isValid) appendTree(tree3, node, pos);
      return new NodeResult(isValid, pos);
    }
    if (element2 instanceof Rule) {
      element2._tested = {};
      element2._tree = {};
      nodeRes2 = walk2(element2.element, node.start, node.children, element2, true);
      if (nodeRes2.isValid) appendTree(tree3, node, nodeRes2.pos);
      return nodeRes2;
    }
    if (element2 instanceof Sequence) {
      pos = node.start;
      for (i = 0, l = element2.elements.length; i < l; i++) {
        nodeRes2 = walk2(element2.elements[i], pos, node.children, rule, true);
        if (nodeRes2.isValid) pos = nodeRes2.pos;
        else return nodeRes2;
      }
      appendTree(tree3, node, nodeRes2.pos);
      return nodeRes2;
    }
    if (element2 instanceof Token) {
      isValid = Boolean(s.indexOf(element2.token) === 0);
      if (isValid) appendTree(tree3, node, node.start + element2.token.length);
      else expecting.update(element2, node.start);
      return new NodeResult(isValid, node.end || node.start);
    }
    if (element2 instanceof Tokens) {
      for (i = 0, l = element2.tokens.length; i < l; i++) {
        if (s.indexOf(element2.tokens[i]) === 0) {
          appendTree(tree3, node, node.start + element2.tokens[i].length);
          return new NodeResult(true, node.end);
        }
      }
      expecting.update(element2, node.start);
      return new NodeResult(false, node.start);
    }
    if (element2 instanceof This) {
      if (rule._tested[node.start] === void 0) {
        rule._tested[node.start] = walk2(rule.element, node.start, node.children, rule, true);
        rule._tree[node.start] = node.children;
      } else {
        node.children = rule._tree[node.start];
      }
      if (rule._tested[node.start].isValid) appendTree(tree3, node, rule._tested[node.start].pos);
      return rule._tested[node.start];
    }
  };
  var nodeRes = walk2(element, 0, tree2, element, true);
  var rest = str.substring(nodeRes.pos).replace(RE_LEFT_WHITESPACE, "");
  if (nodeRes.isValid && rest) nodeRes.isValid = false;
  if (!expecting.required.length && rest) {
    expecting.setModeRequired(nodeRes.pos, true);
    expecting.update(EOS, nodeRes.pos);
  }
  nodeRes.expecting = expecting.getExpecting();
  if (!nodeRes.isValid) nodeRes.pos = expecting.pos;
  return nodeRes;
};
function Choice() {
  var obj = Jsleri.call(this, Choice, arguments);
  if (obj) return obj;
  this.elements = this.checkElements(this.args);
}
Choice.prototype = Object.create(Jsleri.prototype);
Choice.prototype.constructor = Choice;
function Keyword(keyword2, ignCase) {
  var obj = Jsleri.call(this, Keyword, arguments);
  if (obj) return obj;
  keyword2 = this.args[0];
  ignCase = this.args[1];
  this.keyword = keyword2;
  this.ignCase = Boolean(ignCase);
}
Keyword.prototype = Object.create(Jsleri.prototype);
Keyword.prototype.constructor = Keyword;
var List = function List2(element, delimiter, _min, _max, opt) {
  var obj = Jsleri.call(this, List2, arguments);
  if (obj) return obj;
  element = this.args[0];
  delimiter = this.args[1] === void 0 ? new Token(",") : this.args[1];
  _min = this.args[2];
  _max = this.args[3];
  opt = this.args[4];
  if (!(element instanceof Jsleri)) throw "(Jsleri-->List) first argument must be an instance of Jsleri; got " + typeof element;
  if (typeof delimiter !== "string" && !(delimiter instanceof Jsleri)) throw "(Jsleri-->List) second argument must be a string or instance of Jsleri; got " + typeof delimiter;
  this.element = element;
  this.delimiter = delimiter instanceof Jsleri ? delimiter : new Token(delimiter);
  this.min = _min === void 0 || _min === null ? 0 : _min;
  this.max = _max === void 0 || _max === null ? null : _max;
  this.opt = Boolean(opt);
};
List.prototype = Object.create(Jsleri.prototype);
List.prototype.constructor = List;
function Optional(element) {
  var obj = Jsleri.call(this, Optional, arguments);
  if (obj) return obj;
  element = this.args[0];
  if (!(element instanceof Jsleri)) throw "(Jsleri-->Optional) first argument must be an instance of Jsleri; got " + typeof element;
  this.element = element;
}
Optional.prototype = Object.create(Jsleri.prototype);
Optional.prototype.constructor = Optional;
function Prio() {
  var obj = Jsleri.call(this, Prio, arguments);
  if (obj) return obj;
  this.elements = this.checkElements(this.args);
  return new Rule(this);
}
Prio.prototype = Object.create(Jsleri.prototype);
Prio.prototype.constructor = Prio;
function Regex(re, ignCase) {
  var obj = Jsleri.call(this, Regex, arguments);
  if (obj) return obj;
  re = this.args[0];
  ignCase = this.args[1];
  this.re = re;
  this._re = new RegExp("^" + re, ignCase ? "i" : void 0);
}
Regex.prototype = Object.create(Jsleri.prototype);
Regex.prototype.constructor = Regex;
function Repeat(element, _min, _max) {
  var obj = Jsleri.call(this, Repeat, arguments);
  if (obj) return obj;
  element = this.args[0];
  _min = this.args[1];
  _max = this.args[2];
  if (!(element instanceof Jsleri)) throw "(Jsleri-->Repeat) first argument must be an instance of Jsleri; got " + typeof element;
  this.element = element;
  this.min = _min === void 0 || _min === null ? 0 : _min;
  this.max = _max === void 0 || _max === null ? null : _max;
}
Repeat.prototype = Object.create(Jsleri.prototype);
Repeat.prototype.constructor = Repeat;
var refSet = function(element) {
  if (!(element instanceof Jsleri)) throw "(Jsleri-->Ref-->set) first argument must be an instance of Jsleri; got " + typeof element;
  Object.assign(this, element);
};
function Ref(Cls) {
  var Construct = function() {
  };
  Construct.prototype = Cls.prototype;
  var obj = Jsleri.call(this, Construct, arguments);
  if (obj) {
    obj.set = refSet;
    return obj;
  }
}
Ref.prototype = Object.create(Jsleri.prototype);
Ref.prototype.constructor = Ref;
function Grammar(element, reKeywords) {
  var obj = Jsleri.call(this, Grammar, arguments);
  if (obj) return obj;
  element = this.args[0];
  reKeywords = this.args[1];
  var grammar = null;
  if (element === void 0) {
    element = this.constructor.START;
    grammar = this.constructor;
  } else if (element.START) {
    grammar = element;
    element = element.START;
  }
  if (grammar !== null) {
    Object.getOwnPropertyNames(grammar).forEach((name) => {
      if (grammar[name] instanceof Jsleri) {
        grammar[name].name = name;
      }
    });
  }
  if (!(element instanceof Jsleri)) throw "(Jsleri-->Optional) first argument must be an instance of Jsleri; got " + typeof element;
  this.reKeywords = reKeywords === void 0 ? RE_KEYWORDS : buildReKeywords(reKeywords);
  this.element = element;
  this.parse = function(str) {
    var tree2 = new Node2(this, 0, str.length, str);
    var nodeRes = parse(element, str, tree2.children, this.reKeywords);
    nodeRes.tree = tree2;
    return nodeRes;
  };
}
Grammar.prototype = Object.create(Jsleri.prototype);
Grammar.prototype.constructor = Grammar;
function Rule(element) {
  var obj = Jsleri.call(this, Rule, arguments);
  if (obj) return obj;
  element = this.args[0];
  if (!(element instanceof Jsleri)) throw "(Jsleri-->Rule) first argument must be an instance of Jsleri; got " + typeof element;
  this.element = element;
}
Rule.prototype = Object.create(Jsleri.prototype);
Rule.prototype.constructor = Rule;
function Sequence() {
  var obj = Jsleri.call(this, Sequence, arguments);
  if (obj) return obj;
  this.elements = this.checkElements(this.args);
}
Sequence.prototype = Object.create(Jsleri.prototype);
Sequence.prototype.constructor = Sequence;
var This = function() {
  if (!(this instanceof This)) return new This();
};
This.prototype = Object.create(Jsleri.prototype);
This.prototype.constructor = This;
var THIS = new This();
function Token(token) {
  var obj = Jsleri.call(this, Token, arguments);
  if (obj) return obj;
  token = this.args[0];
  if (typeof token !== "string") throw "(Jsleri-->Token) first argument must be a string; got " + typeof token;
  this.token = token;
}
Token.prototype = Object.create(Jsleri.prototype);
Token.prototype.constructor = Token;
function Tokens(tokens) {
  var obj = Jsleri.call(this, Tokens, arguments);
  if (obj) return obj;
  tokens = this.args[0];
  if (typeof tokens !== "string") throw "(Jsleri-->Tokens) first argument must be a string; got " + typeof tokens;
  this.tokens = tokens.trim().split(RE_WHITESPACE).sort(sortOnStrLen);
}
Tokens.prototype = Object.create(Jsleri.prototype);
Tokens.prototype.constructor = Tokens;
function EndOfStatement() {
  this.e = "End of statement";
}
EndOfStatement.prototype = Object.create(Jsleri.prototype);
EndOfStatement.prototype.constructor = EndOfStatement;
var EOS = new EndOfStatement();
function NodeResult(isValid, pos) {
  this.isValid = isValid;
  this.pos = pos;
  this.expecting = null;
}
function Node2(element, start2, end2, str) {
  this.element = element;
  this.start = start2;
  this.end = end2;
  this.str = str;
  this.children = [];
}
Node2.prototype.walk = function() {
  this.element.onEnter(this);
  for (var i = 0, l = this.children.length; i < l; i++) {
    this.children[i].walk();
  }
  this.element.onExit(this);
};
function Expecting() {
  this.required = [];
  this.optional = [];
  this.pos = 0;
  this._modes = [
    this.required
  ];
}
Expecting.prototype.setModeRequired = function(pos, isRequired) {
  if (this._modes[pos] !== this.optional) this._modes[pos] = isRequired === false ? this.optional : this.required;
};
Expecting.prototype.empty = function() {
  this.required.length = 0;
  this.optional.length = 0;
};
Expecting.prototype.update = function(element, pos) {
  if (pos > this.pos) {
    this.empty();
    this.pos = pos;
  }
  if (pos === this.pos && this._modes[pos].indexOf(element) === -1) this._modes[pos].push(element);
};
Expecting.prototype.getExpecting = function() {
  return this.required.concat(this.optional);
};
function Jsleri(Cls, args) {
  args = Array.prototype.slice.call(args);
  if (!(this instanceof Cls)) return new (Cls.bind.apply(Cls, [
    Cls
  ].concat(args)))();
  this.setCallbacks(args);
  this.args = args;
}
Jsleri.prototype.setCallbacks = function(args) {
  var first = args[0];
  if (first === void 0 || first === null || typeof first === "string" || first instanceof Jsleri || first.START !== void 0) return;
  if (isFunction(first.onEnter)) this.onEnter = first.onEnter;
  if (isFunction(first.onExit)) this.onExit = first.onExit;
  args.splice(0, 1);
};
Jsleri.prototype.onEnter = noop;
Jsleri.prototype.onExit = noop;
Jsleri.prototype.checkElements = function(a) {
  var i = 0, l = a.length;
  if (l === 0) throw "(Jsleri-->" + this.constructor.name + ") Need at least one Jsleri argument";
  for (; i < l; i++) if (!(a[i] instanceof Jsleri)) {
    a[i] = new Token(a[i]);
  }
  return a;
};
Jsleri.prototype.checkElement = function(a) {
  if (!(a instanceof Jsleri)) {
    a = new Token(a);
  }
  return a;
};

// ts/parse.ts
function searchTag(search_tag) {
  const ranges = Defaults.ranges["en"];
  const latin = ranges.some((range) => range.test(search_tag));
  if (latin == true) search_tag = search_tag.toLowerCase();
  for (const key of Object.keys(Tags)) {
    const terms = values(Tags[key]);
    if (terms.includes(search_tag)) return key;
  }
  for (const key of Object.keys(Polyglots)) {
    const terms = values(Polyglots[key]);
    if (terms.includes(search_tag)) return key;
  }
  throw new Error("TODO: search tag not found");
}
var keyword = {
  baby: {
    "en": [
      "aka-chan",
      "Aka-Chan",
      "Aka-chan",
      "baby",
      "Baby",
      "babies",
      "Babies"
    ],
    "ja": [
      "\u8D64",
      "\u8D64\u3061\u3083\u3093"
    ],
    "ko": [
      "\uC544\uAE30"
    ],
    "zh": [
      "\u5A74\u513F",
      "\u5A74"
    ]
  },
  born: {
    "en": [
      "born",
      "Born"
    ],
    "ja": [
      "\u751F\u307E\u308C"
    ],
    "ko": [
      "\uD0DC\uC5B4\uB09C",
      "\uCD9C\uC0DD"
    ],
    "zh": [
      "\u51FA\u751F"
    ]
  },
  born_at: {
    "en": [
      "born at",
      "Born at"
    ],
    "ja": [
      "\u751F\u307E\u308C"
    ],
    "ko": [
      "\uD0DC\uC5B4\uB09C \uC7A5\uC18C",
      "\uCD9C\uC0DD\uC9C0"
    ],
    "zh": [
      "\u51FA\u751F"
    ]
  },
  credit: {
    "en": [
      "author",
      "Author",
      "credit",
      "Credit",
      "ask",
      "Ask"
    ],
    "ja": [
      "\u8457\u8005"
    ],
    "ko": [
      "\uC800\uC790"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  dead: {
    "en": [
      "dead",
      "Dead",
      "died",
      "Died",
      "rainbow",
      "Rainbow"
    ],
    "ja": [
      "\u6B7B",
      "\u8679"
    ],
    "ko": [
      "\uC8FD\uC74C"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  died_at: {
    "en": [
      "died at",
      "Died at"
    ],
    "ja": [
      "TOWRITE"
    ],
    "ko": [
      "\uC8FD\uC740 \uC7A5\uC18C"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  family: {
    aunt: {
      "en": [
        "aunt",
        "Aunt"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC774\uBAA8"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    brother: {
      "en": [
        "brother",
        "Brother"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uD615\uC81C"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    cousin: {
      "en": [
        "cousin",
        "Cousin"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC0AC\uCD0C"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    children: {
      "en": [
        "children"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC790\uB140"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    dad: {
      "en": [
        "dad",
        "Dad",
        "father",
        "Father",
        "papa",
        "Papa"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC544\uBE60"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    grandma: {
      "en": [
        "grandma",
        "Grandma",
        "grandmother",
        "Grandmother"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uD560\uBA38\uB2C8"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    grandpa: {
      "en": [
        "grandpa",
        "Grandpa",
        "grandfather",
        "Grandfather"
      ],
      "ja": [
        "TORWITE"
      ],
      "ko": [
        "\uD560\uC544\uBC84\uC9C0"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    litter: {
      "en": [
        "litter",
        "Litter"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC30D\uB465\uC774"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    mate: {
      "en": [
        "husband",
        "Husband",
        "mate",
        "Mate",
        "partner",
        "Partner",
        "wife",
        "Wife"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uB0A8\uD3B8"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    mom: {
      "en": [
        "mam",
        "Mam",
        "mama",
        "Mama",
        "mom",
        "Mom",
        "mommy",
        "Mommy",
        "mother",
        "Mother"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC5C4\uB9C8"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    nephew: {
      "en": [
        "nephew",
        "Nephew"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC870\uCE74(\uB0A8)"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    niece: {
      "en": [
        "niece",
        "Niece"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC870\uCE74(\uC5EC)"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    parents: {
      "en": [
        "parent",
        "Parent",
        "parents",
        "Parents"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uBD80\uBAA8"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    relatives: {
      "en": [
        "family",
        "Family",
        "relatives",
        "Relatives"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uAC00\uC871"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    siblings: {
      "en": [
        "sibling",
        "Sibling",
        "siblings",
        "Siblings"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uD615\uC81C\xB7\uC790\uB9E4"
      ],
      "zh": [
        "TOWRITE"
      ]
    },
    uncle: {
      "en": [
        "uncle",
        "Uncle"
      ],
      "ja": [
        "TOWRITE"
      ],
      "ko": [
        "\uC0BC\uCD0C"
      ],
      "zh": [
        "TOWRITE"
      ]
    }
  },
  lived_at: {
    "en": [
      "lived at",
      "Lived at"
    ],
    "ja": [
      "TOWRITE"
    ],
    "ko": [
      "\uC0B4\uC558\uB358 \uACF3",
      "\uAC70\uC8FC\uC9C0"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  nearby: {
    "en": [
      "near",
      "Near",
      "nearby",
      "Nearby"
    ],
    "ja": [
      "\u8FD1\u304F",
      "\u8FD1\u304F\u306E\u52D5\u7269\u5712"
    ],
    "ko": [
      "\uADFC\uCC98",
      "\uAC00\uAE4C\uC6B4",
      "\uC8FC\uBCC0"
    ],
    "zh": [
      "\u9644\u8FD1"
    ]
  },
  panda: {
    "en": [
      "panda",
      "Panda",
      "red panda",
      "Red panda",
      "Red Panda"
    ],
    "ja": [
      "\u30D1\u30F3\u30C0",
      "\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0"
    ],
    "ko": [
      "\uD310\uB2E4",
      "\uB808\uC11C\uD310\uB2E4"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  tag: {
    "en": [
      "label",
      "labels",
      "Label",
      "Labels",
      "tag",
      "Tag",
      "tags",
      "Tags"
    ],
    "ja": [
      "TOWRITE"
    ],
    "ko": [
      "\uD0DC\uADF8"
    ],
    "zh": [
      "TOWRITE"
    ]
  },
  zoo: {
    "en": [
      "zoo",
      "Zoo"
    ],
    "ja": [
      "\u52D5\u7269\u5712"
    ],
    "ko": [
      "\uB3D9\uBB3C\uC6D0"
    ],
    "zh": [
      "\u52A8\u7269\u56ED"
    ]
  }
};
var group = {
  /** Valid _baby_ keywords */
  baby: values([
    keyword.baby
  ]),
  /** Valid _born_ keywords */
  born: values([
    keyword.born
  ]),
  /** Valid _born at_ keywords */
  born_at: values([
    keyword.born_at
  ]),
  /** Valid _credit_ keywords */
  credit: values([
    keyword.credit
  ]),
  /** Valid _dead_ keywords */
  dead: values([
    keyword.dead
  ]),
  /** Valid _died at_ keywords */
  died_at: values([
    keyword.died_at
  ]),
  /** Valid _family_ keywords */
  family: values([
    keyword.family
  ]),
  /** Valid keywords _of any type_ */
  keywords: values([
    keyword
  ]),
  /** Valid _lived at_ keywords */
  lived_at: values([
    keyword.lived_at
  ]),
  /** Valid _nearby_ keywords */
  nearby: values([
    keyword.nearby
  ]),
  /** Valid _panda_ keywords */
  panda: values([
    keyword.panda
  ]),
  /** Aggregate of all possible tag values */
  tags: values([
    Tags
  ]),
  /** Keywords that take some kind of author or contributor name */
  takes_subject_author: values([
    keyword.credit
  ]),
  /** Keywords that take some form of arbitrary string name */
  takes_subject_name: values([
    Tags,
    keyword.baby,
    keyword.credit,
    keyword.family,
    keyword.panda,
    keyword.zoo
  ]),
  /** Keywords that take some form of numeric ID value */
  takes_subject_number: values([
    Tags,
    keyword.born_at,
    keyword.died_at,
    keyword.lived_at,
    keyword.family,
    keyword.panda,
    keyword.zoo
  ]),
  /** Keywords that take some kind of numeric year value */
  takes_subject_year: values([
    keyword.baby,
    keyword.born,
    keyword.dead
  ]),
  /** Keywords that take some kind of full date string */
  takes_subject_date: values([
    keyword.baby,
    keyword.born,
    keyword.dead
  ]),
  /** Single keywords that represent queries on their own */
  zeroary: values([
    Tags,
    keyword.baby,
    keyword.dead,
    keyword.nearby
  ]),
  /** Valid _zoo_ keywords */
  zoo: values([
    keyword.zoo
  ])
};
var regex = {
  /** Any number, positive or negative */
  id: "(?:^[-0-9][0-9]*)",
  /** Any sequence of strings separated by spaces */
  name: "(?:^[^\n]+)",
  /** Any year matching 19XX or 2XXX */
  year: "(?:19[0-9]{2}|2[0-9]{3})",
  date: {
    // Default to mm_yy, but allow flexibility if the meaning is unambiguous
    aa_bb: "(?:[0-9]{1,2}[^s\n][0-9]{1,2}[^s\n]?)",
    // Default to a locale-appropriate date format, falling back to dd_mm_yy
    aa_bb_cc: "(?:[0-9]{1,2}[^s\n][0-9]{1,2}[^s\n][0-9]{1,2}[^s\n]?)",
    aa_bb_yyyy: "(?:[0-9]{1,2}[^s\n][0-9]{1,2}[^s\n][0-9]{4}[^s\n]?)",
    // Unambiguous month and year
    mm_yyyy: "(?:[0-9]{1,2}[^s\n][0-9]{4}[^s\n]?)",
    // Unambiguous and standard date parsing
    yyyy_mm_dd: "(?:[0-9]{4}[^s\n][0-9]{1,2}[^s\n][0-9]{1,2}[^s\n]?)"
  }
};
var Lexer = class {
  terms = {
    names: {
      list: [],
      max_spaces: 0
    },
    keywords: {
      list: [],
      max_spaces: 0
    },
    tags: {
      list: [],
      max_spaces: 0
    }
  };
  /** Build a wordlist of terms with spaces in them */
  build_wordlist() {
    const word_filter = (token, list_name) => {
      if (token.includes(" ")) {
        const space_count = token.replace(/\S/g, "").length;
        if (space_count > this.terms[list_name].max_spaces) {
          this.terms[list_name].max_spaces = space_count;
        }
        return token;
      }
    };
    this.terms.keywords.list = group.keywords.filter((kw) => word_filter(kw, "keywords")).sort();
    this.terms.tags.list = group.tags.filter((tag) => word_filter(tag, "tags")).sort();
    this.terms.names.list = pandas_default.db._lexer.names.filter((name) => word_filter(name, "names")).sort();
  }
  /**
   * Generate a lexed (tokenized) string. Support normal spaces and Japanese
   * ideographic spaces. If we need more, make a new function. The search bar
   * doesn't support newlines, so that's a natural delimiter to use here
   */
  generate(input) {
    const wordListLength = this.terms.keywords.list.length + this.terms.names.list.length + this.terms.tags.list.length;
    if (wordListLength == 0) this.build_wordlist();
    const split_input = this.split(input);
    let delimited_input = split_input.join("\n");
    const space_tokens = this.process(input);
    for (const space_token of space_tokens) {
      const newline_token = space_token.replace(/ /g, "\n");
      const newline_regexp = new RegExp(newline_token, "i");
      delimited_input = delimited_input.replace(newline_regexp, space_token);
    }
    return delimited_input;
  }
  possible_tokens(input, max_spaces, list_name) {
    const tokenlist = [];
    const input_split = this.split(input);
    for (let n = max_spaces; n > 0; n--) {
      for (let i = 0; i < input_split.length - n; i++) {
        let token = input_split.slice(i, i + n + 1).join(" ");
        if (list_name == "names") token = capitalNames(token);
        tokenlist.push(token);
      }
    }
    return tokenlist;
  }
  /**
   * Find all valid tokens in the search input that have spaces, and return
   * them in a newline-separated way. Also convert Japanese ideographic (wide)
   * spaces. Prioritize panda names, then tag names, then keywords.
   */
  process(input) {
    const ordering = [
      "names",
      "tags",
      "keywords"
    ];
    const input_spaces = input.replace(/\S/g, "").length;
    let found_tokens = [];
    for (const list_name of ordering) {
      let lexlist = this.terms[list_name].list;
      let max_spaces = this.terms[list_name].max_spaces;
      if (max_spaces > input_spaces) {
        max_spaces = input_spaces;
      }
      lexlist = lexlist.filter((l) => l.replace(/\S/g, "").length <= max_spaces);
      const tokens = this.possible_tokens(input, max_spaces, list_name).filter((t) => lexlist.includes(t));
      found_tokens = found_tokens.concat(tokens);
    }
    return found_tokens;
  }
  /** Split a string by spaces, assuming only one kind */
  split(input) {
    if (input.includes("\u3000")) return input.split("\u3000");
    else if (input.includes(" ")) return input.split(" ");
    else return [
      input
    ];
  }
};
var lexer = new Lexer();
var Tree = class {
  keyword = [
    "keyword",
    "tag",
    "type"
  ];
  sets = [
    "set_babies_year_list",
    "set_baby_subject",
    "set_credit_photos",
    "set_credit_photos_filtered",
    "set_family_list",
    "set_keyword",
    "set_keywords",
    "set_keyword_subject",
    "set_keyword_date",
    "set_keyword_year",
    "set_matching_tags_photos",
    "set_nearby_zoo",
    "set_only_subjects",
    "set_subject",
    "set_panda_id",
    "set_tag",
    "set_tag_intersection",
    "set_tag_intersection_subject",
    "set_tag_subject",
    "set_zoo_id"
  ];
  subject = [
    "subject_author",
    "subject_date",
    "subject_id",
    "subject_name",
    "subject_panda_id",
    "subject_year",
    "subject_zoo_id"
  ];
  types = {
    composite: [
      "choice",
      "composite",
      "contains",
      "sequence"
    ].concat(this.sets),
    keyword: this.keyword,
    subject: this.subject,
    subject_author: [
      "subject_author"
    ],
    subject_filter: [
      "subject_id",
      "subject_name"
    ],
    singular: this.keyword.concat(this.subject)
  };
  tests = {
    composite: this.types.composite.map((t) => ({
      "type": t
    })),
    keyword: this.types.keyword.map((t) => ({
      "type": t
    })),
    sets: this.sets.map((t) => ({
      "type": t
    })),
    singular: this.types.singular.map((t) => ({
      "type": t
    })),
    subject: this.types.subject.map((t) => ({
      "type": t
    })),
    subject_author: this.types.subject_author.map((t) => ({
      "type": t
    })),
    subject_filter: this.types.subject_filter.map((t) => ({
      "type": t
    }))
  };
  /** Build a grammar for making parse trees with. */
  build_grammar() {
    const Choice2 = Choice;
    const Grammar2 = Grammar;
    const Keyword2 = Keyword;
    const Prio2 = Prio;
    const Regex2 = Regex;
    const Repeat2 = Repeat;
    const Sequence2 = Sequence;
    function Choices(keyword_list) {
      return Choice2.apply(Choice2, keyword_list.map((kw) => Keyword2(kw, true)));
    }
    function Reversible(a, b) {
      return Choice2(Sequence2(a, b), Sequence2(b, a));
    }
    const r_id = Regex2(regex.id);
    const r_name = Regex2(regex.name);
    const r_year = Regex2(regex.year);
    const r_date_aa_bb = Regex2(regex.date.aa_bb);
    const r_date_aa_bb_cc = Regex2(regex.date.aa_bb_cc);
    const r_date_aa_bb_yyyy = Regex2(regex.date.aa_bb_yyyy);
    const r_date_mm_yyyy = Regex2(regex.date.mm_yyyy);
    const r_date_yyyy_mm_dd = Regex2(regex.date.yyyy_mm_dd);
    const c_k_zeroary = Choices(group.zeroary);
    const c_k_unary_name = Reversible(Choices(group.takes_subject_name), r_name);
    const c_k_unary_number = Reversible(Choices(group.takes_subject_number), r_id);
    const c_k_unary_year = Reversible(Choices(group.takes_subject_year), r_year);
    const c_k_unary_date_aa_bb = Reversible(Choices(group.takes_subject_date), r_date_aa_bb);
    const c_k_unary_date_aa_bb_cc = Reversible(Choices(group.takes_subject_date), r_date_aa_bb_cc);
    const c_k_unary_date_aa_bb_yyyy = Reversible(Choices(group.takes_subject_date), r_date_aa_bb_yyyy);
    const c_k_unary_date_mm_yyyy = Reversible(Choices(group.takes_subject_date), r_date_mm_yyyy);
    const c_k_unary_date_yyyy_mm_dd = Reversible(Choices(group.takes_subject_date), r_date_yyyy_mm_dd);
    const c_k_unary_credit_author_and_name = Reversible(Sequence2(Choices(group.takes_subject_author), r_name), r_name);
    const c_k_unary_credit_author_and_id = Reversible(Sequence2(Choices(group.takes_subject_author), r_name), r_id);
    const c_k_group_ids = Repeat2(r_id);
    const c_k_group_tags = Repeat2(Choices(group.tags), 2);
    const c_k_group_tags_name = Reversible(Repeat2(Choices(group.tags), 2), r_name);
    const c_k_group_tags_id = Reversible(Repeat2(Choices(group.tags), 2), r_id);
    const START = Prio2(
      r_id,
      r_date_yyyy_mm_dd,
      r_date_aa_bb_yyyy,
      r_date_aa_bb_cc,
      r_date_mm_yyyy,
      r_date_aa_bb,
      c_k_zeroary,
      c_k_group_tags,
      c_k_group_tags_name,
      c_k_group_tags_id,
      c_k_group_ids,
      c_k_unary_credit_author_and_name,
      c_k_unary_credit_author_and_id,
      c_k_unary_year,
      c_k_unary_number,
      c_k_unary_date_yyyy_mm_dd,
      c_k_unary_date_aa_bb_yyyy,
      c_k_unary_date_aa_bb_cc,
      c_k_unary_date_mm_yyyy,
      c_k_unary_date_aa_bb,
      c_k_unary_name,
      // Sequence('(', THIS, ')'),   // Bracketed expressions
      // Sequence(THIS, c_k_binary_logical, THIS),
      r_name
    );
    this.grammar = new Grammar2(START, "^[^\n]+");
  }
  /** 
   * After performing the parse, navigate through the tree and do subsequent
   * node type classification and resolution. These node types will identify
   * where the query resolution code should do graph searches and build sets of
   * results to display.
   */
  classify(tree2) {
    const subject_nodes = this.filter(tree2, this.tests.subject);
    const keyword_nodes = this.filter(tree2, this.tests.keyword);
    if (subject_nodes.length == 1 && keyword_nodes.length == 0) {
      this.classify_subject_only(subject_nodes[0]);
    } else if (subject_nodes.length == 0 && keyword_nodes.length == 1) {
      this.classify_keyword_only(keyword_nodes[0]);
    } else if (subject_nodes.length == 0 && keyword_nodes.length > 1) {
      this.classify_plural(keyword_nodes);
    } else {
      this.classify_plural(subject_nodes);
    }
  }
  classify_keyword_only(keyword_node) {
    if (keyword_node.type == "tag") {
      keyword_node.parent.type = "set_tag";
    } else {
      keyword_node.parent.type = "set_keyword";
    }
  }
  classify_subject_only(subject_node) {
    subject_node.parent.type = "set_subject";
  }
  classify_plural(plural_nodes) {
    const container_nodes = plural_nodes.map((n) => this.walk_to_subject_container(n));
    for (const container_node of container_nodes) {
      const value_nodes = this.filter(container_node, this.tests.singular);
      this.node_type_specific_ids(container_node, value_nodes);
    }
  }
  /**
   * Filter all nodes of a tree and return a list of nodes that match a given
   * condition that we care about. Tests are an array of dict, and each dict
   * has field names and values. If any one of the tests match, it's a node we
   * want.
   */
  filter(node, tests) {
    let results2 = [];
    outer: for (const test of tests) {
      for (const field in test) {
        if (node.hasOwnProperty(field)) {
          const value = test[field];
          if (node[field] == value) {
            results2.push(node);
            break outer;
          }
        }
      }
    }
    results2 = results2.concat(node.children.flatMap((c) => this.filter(c, tests)));
    return results2;
  }
  /** 
   * Takes the result from parsing a grammar, and builds a parse tree with our
   * own node details and formatting, based on jsleri's
   */
  generate(parse_input) {
    if (this.grammar == void 0) this.build_grammar();
    if (!this.grammar || this.grammar.parse == void 0) throw new Error("TODO: search grammar failure");
    const result2 = this.grammar.parse(parse_input);
    let start2 = result2.tree;
    if (result2.tree.hasOwnProperty("children")) start2 = result2.tree.children[0];
    const tree2 = this.node_props(start2, this.get_children(start2.children));
    this.link_parents(tree2);
    this.classify(tree2);
    return tree2;
  }
  /** Convert jsleri parse tree to our desired format, one child at a time */
  get_children(children) {
    return children.map((c) => this.node_props(c, this.get_children(c.children)));
  }
  /** 
   * Add parent node connectivity to the tree after the basic tree is generated
   */
  link_parents(current) {
    current.children.forEach((c) => c.parent = current);
    current.children.forEach((c) => this.link_parents(c));
  }
  /** Define our ideal tree node, using jsleri's as a base */
  node_props(node, children) {
    return {
      "start": node.start,
      "end": node.end,
      "type": this.node_type(node, children),
      "str": node.str,
      "children": children
    };
  }
  /** 
   * Identify the nodes by simple types, for later processing into query sets.
   * This is the first-level of parse-tree node identification.
   */
  node_type(node, children) {
    if (children == void 0) return node.type;
    if (children.length != 0) return "composite";
    if (node.element.hasOwnProperty("keyword")) {
      if (group.tags.includes(node.element.keyword)) return "tag";
      else return "keyword";
    }
    if (node.element.hasOwnProperty("re")) {
      if (node.element.re == regex.id) return "subject_id";
      if (node.element.re == regex.name) return "subject_name";
      if (node.element.re == regex.year) return "subject_year";
      if (Object.values(regex.date).includes(node.element.re)) return "subject_date";
    }
    return node.type;
  }
  /** 
   * Starting with subject nodes, go up the tree and categorize nodes based on
   * their children. Figure out what a node is based on its composite types.
   * This is the second-level of parse-tree node identification.
   */
  node_type_composite_ids(node) {
    const singulars = this.filter(node, this.tests.singular).map((n) => n.type).sort();
    if (singulars.length == 1) return "contains";
    if (singulars.length == 2) {
      if (singulars[0] == "keyword" && singulars[1] == "keyword") return "set_keywords";
      if (singulars[0].indexOf("subject") == 0 && singulars[1] == "tag") return "set_tag_subject";
      if (singulars[0] == "keyword" && singulars[1].startsWith("subject")) return "set_keyword_subject";
      if (singulars[0] == "tag" && singulars[1] == "tag") return "set_tag_intersection";
      if (singulars[0].startsWith("subject") && singulars[1].startsWith("subject")) return "set_only_subjects";
    }
    if (singulars.length == 3) {
      if (singulars[0] == "keyword" && singulars[1].startsWith("subject") && singulars[2].startsWith("subject")) {
        return "set_credit_photos_filtered";
      }
    }
    if (singulars.length > 2) {
      if (distinct(singulars).length == 1 && singulars[0] == "tag") return "set_tag_intersection";
      if (distinct(singulars).length == 2 && singulars[0].startsWith("subject") && singulars[1] == "tag") {
        return "set_tag_intersection_subject";
      }
      if (distinct(singulars).length == 1 && singulars[0].startsWith("subject")) return "set_only_subjects";
    }
    return "composite";
  }
  /** 
   * Identify nodes intended to form a set of results. Based on the combination
   * of nodes, and possibly order, choose by default whether or not a keyword
   * is parsed as a type or a tag, disambiguating. This is the third-level of
   * parse-tree node identification.
   */
  node_type_specific_ids(container_node, value_nodes) {
    if (container_node.type == "set_keywords") {
      const keywords = value_nodes.map((n) => n.str);
      const keywords_tags = keywords.filter((k) => group.tags.includes(k));
      if (keywords.length == keywords_tags.length) {
        container_node.type = "set_matching_tags_photos";
        value_nodes.forEach((n) => n.type = "tag");
      }
    }
    if (container_node.type == "set_keyword_subject") {
      const keyword_node = this.filter(container_node, this.tests.keyword)[0];
      const subject_node = this.filter(container_node, this.tests.subject)[0];
      if (group.baby.includes(keyword_node.str) && subject_node.type == "subject_year") {
        container_node.type = "set_babies_year_list";
        keyword_node.type = "type";
      } else if (group.baby.includes(keyword_node.str) && subject_node.type == "subject_name") {
        container_node.type = "set_baby_subject";
        keyword_node.type = "tag";
      } else if (group.credit.includes(keyword_node.str)) {
        container_node.type = "set_credit_photos";
        subject_node.type = "subject_author";
      } else if (group.family.includes(keyword_node.str) && subject_node.type == "subject_year") {
        container_node.type = "set_family_list";
        subject_node.type = "subject_panda_id";
      } else if (group.takes_subject_year.includes(keyword_node.str) && subject_node.type == "subject_id") {
        container_node.type = "set_keyword_year";
        subject_node.type = "subject_year";
      } else if (group.takes_subject_date.includes(keyword_node.str) && subject_node.type == "subject_date") {
        container_node.type = "set_keyword_date";
        subject_node.type = "subject_date";
      } else if (group.nearby.includes(keyword_node.str) && subject_node.type == "subject_id") {
        container_node.type = "set_nearby_zoo";
        subject_node.type = "subject_zoo_id";
      } else if (group.panda.includes(keyword_node.str) && (subject_node.type == "subject_id" || subject_node.type == "subject_year")) {
        container_node.type = "set_panda_id";
        keyword_node.type = "type";
        subject_node.type = "subject_panda_id";
      } else if (group.zoo.indexOf(keyword_node.str) != -1 && (subject_node.type == "subject_id" || subject_node.type == "subject_year")) {
        container_node.type = "set_zoo_id";
        keyword_node.type = "type";
        subject_node.type = "subject_zoo_id";
      }
    }
  }
  /**
   * Start with leaf nodes containing type: "subject_*" in the parse tree, and
   * then work your way up until you're looking at the parser's stanza where it
   * parsed that subject in context of another keyword. Re-classify any nodes
   * you run into along the way.
   */
  walk_to_subject_container(node) {
    const parent_type = this.node_type_composite_ids(node.parent);
    node.parent.type = parent_type;
    if (parent_type.startsWith("contains")) {
      return this.walk_to_subject_container(node.parent);
    } else {
      return node.parent;
    }
  }
};
var tree = new Tree();

// ts/query.ts
function clear() {
  environment_default.preserve_case = false;
  environment_default.output_mode = "entities";
  environment_default.specific_photo = void 0;
}
function result(input_string) {
  const lexed_input = lexer.generate(input_string);
  const parse_tree = tree.generate(lexed_input);
  const set_nodes = tree.filter(parse_tree, tree.tests.sets);
  if (set_nodes.length == 0) {
    return {
      "hits": [],
      "parsed": "no_results",
      "query": input_string
    };
  }
  const singular_nodes = tree.filter(set_nodes[0], tree.tests.singular);
  if (set_nodes.length == 1 && singular_nodes.length == 1) {
    return single(set_nodes[0], singular_nodes[0]);
  }
  if (set_nodes.length == 1 && singular_nodes.length == 2) {
    return pair(set_nodes[0]);
  }
  if (set_nodes.length == 1 && singular_nodes.length > 2) {
    return group_one_set(set_nodes[0]);
  }
  if (set_nodes.length == 2 && singular_nodes.length > 2) {
    const start_node = set_nodes.reduce((prev, current) => prev.end - prev.start > current.end - current.start ? prev : current);
    return filter_set(start_node);
  }
  return {
    "hits": [],
    "parsed": "no_results",
    "query": input_string
  };
}
function filter_set(set_node) {
  let hits = [];
  let search_word;
  let filter_word;
  let parsed = set_node.type;
  if (set_node.type == "set_credit_photos_filtered") {
    const author_node = tree.filter(set_node, tree.tests.subject_author)[0];
    const filter_node = tree.filter(set_node, tree.tests.subject_filter)[0];
    search_word = author_node.str;
    filter_word = filter_node.str;
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    const filter_ids = searchPandaMedia(filter_word).map((n) => n._id);
    if (filter_ids.length == 0) {
      parsed = "set_credit_photos";
      filter_word = void 0;
    } else if (parseInt(filter_word) > 0) {
      filter_word = fallback_name(graphId(filter_word));
    }
    hits = searchPhotoCredit(search_word, filter_ids);
  }
  return {
    "filter": filter_word,
    "hits": hits,
    "parsed": parsed,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word
  };
}
function group_one_set(set_node) {
  let hits = [];
  const keyword_nodes = tree.filter(set_node, tree.tests.keyword);
  let search_word = void 0;
  let tag = void 0;
  if (set_node.type == "set_tag_intersection_subject") {
    const subject_node = tree.filter(set_node, tree.tests.subject)[0];
    search_word = subject_node.str;
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    const tags = keyword_nodes.map((keyword_node) => searchTag(keyword_node.str));
    tag = tags.join(", ");
    hits = searchPhotoTags(searchPandaMedia(search_word), tags, "intersect", "none");
  }
  if (set_node.type == "set_tag_intersection") {
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    const tags = keyword_nodes.map((keyword_node) => searchTag(keyword_node.str));
    tag = tags.join(", ");
    hits = searchPhotoTags(allAnimalsAndMedia(), tags, "intersect", "none");
  }
  if (set_node.type == "set_only_subjects") {
    environment_default.output_mode = "group";
    const ids = set_node.str.split("\n");
    hits = searchPandaMediaIntersect(ids);
    if (hits.length > 0) {
      environment_default.paging.display_button = true;
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
    "tag": tag
  };
}
function pair(set_node) {
  let hits = [];
  const keyword_node = tree.filter(set_node, tree.tests.keyword)[0];
  const subject_node = tree.filter(set_node, tree.tests.subject)[0];
  if (keyword_node == void 0 || subject_node == void 0) throw new Error("TODO: pair set processing error");
  const search_word = subject_node.str;
  let tag;
  if (set_node.type == "set_keyword_date") {
    if (group.born.includes(keyword_node.str)) {
      hits = searchBirthdayList(search_word);
    }
    if (group.dead.includes(keyword_node.str)) {
      hits = searchDiedList(search_word);
    }
  }
  if (set_node.type == "set_keyword_subject") {
    if (group.born_at.includes(keyword_node.str)) {
      hits = searchPandaZooBornRecords(search_word, true);
    }
    if (group.died_at.includes(keyword_node.str)) {
      hits = searchPandaZooDied(search_word, 0);
    }
    if (group.lived_at.includes(keyword_node.str)) {
      hits = searchPandaZooBornLived(search_word, true);
    }
    if (group.zoo.includes(keyword_node.str)) {
      hits = searchZooName(search_word);
    }
    if (group.panda.includes(keyword_node.str)) {
      hits = searchPandaName(search_word);
    }
    if (group.dead.includes(keyword_node.str)) {
      hits = searchDead(search_word);
    }
  }
  if (set_node.type == "set_panda_id") {
    hits = [
      graphId(search_word)
    ];
  }
  if (set_node.type == "set_zoo_id") {
    hits = [
      graphId(search_word)
    ];
  }
  if (set_node.type == "set_credit_photos") {
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    hits = searchPhotoCredit(search_word);
  }
  if (set_node.type == "set_babies_year_list") {
    hits = searchBabies(search_word);
  }
  if (set_node.type == "set_tag_subject" || set_node.type == "set_baby_subject") {
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    tag = searchTag(keyword_node.str);
    const animals = searchPandaMedia(search_word);
    hits = searchPhotoTags(animals, [
      tag
    ], "photos", "none");
  }
  if (set_node.type == "set_tag_intersection") {
    environment_default.output_mode = "photos";
    environment_default.paging.display_button = true;
    const tags = tree.filter(set_node, tree.tests.keyword).map((keyword_node2) => searchTag(keyword_node2.str));
    tag = tags.join(", ");
    hits = searchPhotoTags(allAnimalsAndMedia(), tags, "intersect", "none");
  }
  if (set_node.type == "set_only_subjects") {
    environment_default.output_mode = "group";
    const ids = set_node.str.split("\n");
    hits = searchPandaMediaIntersect(ids);
    if (hits.length > 0) {
      environment_default.paging.display_button = true;
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " "),
    "subject": search_word,
    "tag": tag
  };
}
function single(set_node, singular_node) {
  let hits = [];
  const search_word = singular_node.str;
  if (set_node.type == "set_subject") {
    if (singular_node.type == "subject_id") hits = [
      graphId(search_word)
    ];
    if (singular_node.type == "subject_name") {
      const panda_hits = searchPandaName(search_word);
      const zoo_hits = searchZooName(search_word);
      hits = panda_hits.length >= zoo_hits.length ? panda_hits : zoo_hits;
    }
    if (singular_node.type == "subject_date") hits = searchBirthdayList(search_word);
  }
  if (set_node.type == "set_keyword") {
    if (group.baby.includes(search_word)) hits = searchBabies();
    if (group.nearby.includes(search_word)) {
      environment_default.output_mode = "nearby";
      if (state.resolved == false) getNaiveLocation();
    }
    if (group.dead.includes(search_word)) hits = searchDead();
  }
  if (set_node.type == "set_tag") {
    if (group.tags.includes(search_word)) {
      environment_default.output_mode = "photos";
      environment_default.paging.display_button = true;
      const tag = searchTag(search_word);
      hits = searchPhotoTags(allAnimalsAndMedia(), [
        tag
      ], "photos", "none");
    }
  }
  return {
    "hits": hits,
    "parsed": set_node.type,
    "query": set_node.str.replace(/\n/g, " ")
  };
}

// ts/page.ts
function color(class_name) {
  const body = document.getElementsByTagName("body")[0];
  body.classList.remove("results");
  body.classList.remove("profile");
  body.classList.add(class_name);
}
function redraw(callback) {
  if (callback == void 0) return;
  if (window.location.hash.length > 0 && pandas_default.db != void 0 && callback == results.render) {
    callback();
  }
  if (window.location.hash.length > 0 && pandas_default.db != void 0 && callback == profile.render) {
    callback();
  }
  if (window.location.hash.length > 0 && pandas_default.db != void 0 && callback == media.render) {
    callback();
  }
  if (window.location.hash.length > 0 && callback != results.render && callback != profile.render && callback != media.render && callback != links.render) {
    callback();
  }
  if (window.location.hash.length == 0 && callback == home.render) {
    callback();
  }
}
var AboutPage = class {
  loaded = new Event("about_loaded");
  /** 
   * Fetch the about page contents, and add the event listeners for how section
   * buttons load different parts of the about page.
   */
  fetch() {
    const fetch_url = `/fragments/${environment_default.language}/about.html`;
    const request = new XMLHttpRequest();
    request.open("GET", fetch_url);
    request.responseType = "document";
    request.send();
    request.onload = () => {
      const response = request.response;
      this.content = response.querySelector("#contentFrame");
      this.language = environment_default.language;
      window.dispatchEvent(this.loaded);
    };
  }
  /** Find all image links on instagram, and replace their URIs with fetches */
  fetchImages() {
    const replace_images = document.getElementsByClassName("replace");
    for (const img of replace_images) {
      if (img.src.startsWith("https://www.instagram.com/p/")) {
        const shortcode = img.src.split("/")[4];
        const size = img.src.split("/")[6].split("=")[1];
        const ig_url = `ig://${shortcode}/${size}`;
        url.process(img, ig_url);
      }
    }
  }
  /** 
   * The about page hashchange results in needing to draw or fetch the page
   * initialize its menus, or at the very least, scroll to the top of the page
   */
  hashchange = () => {
    if (this.language != environment_default.language && this.language != void 0) this.fetch();
    else {
      this.render();
      this.sectionButtonEventHandlers();
      this.sectionShow(window.sessionStorage.getItem("aboutPageMenu"));
      this.instructions();
      mediaQuery().addEventListener("change", this.instructions);
      this.tags();
      environment_default.current = this.render;
    }
    window.scrollTo(0, 0);
  };
  /** 
   * Use media queries to determine whether to display instructions for mobile
   * visitors or for PC visitors
   */
  instructions() {
    const desktopInstructions = document.querySelector(".pandaAbout.onlyDesktop");
    const mobileInstructions = document.querySelector(".pandaAbout.onlyMobile");
    if (desktopInstructions && mobileInstructions) {
      if (mediaQuery().matches) {
        desktopInstructions.style.display = "none";
        mobileInstructions.style.display = "block";
      } else {
        mobileInstructions.style.display = "none";
        desktopInstructions.style.display = "block";
      }
    }
  }
  /** 
   * Displays the about page when the button is clicked. Load content from a
   * static file based on the given language, and display it in a frame with
   * `#contentFrame.about`. By defining as an arrow function, we guarantee
   * `this` is scoped to the `AboutPage` class if invoked as a callback.
   */
  render = () => {
    environment_default.paging.display_button = false;
    if (!this.language || this.language != environment_default.language) this.fetch();
    else {
      this.sectionMenuDefaults();
      if (this.content) document.getElementById("contentFrame")?.replaceWith(this.content);
      footer.redraw("results");
    }
    resultsMenus.language();
    aboutMenu.render();
    resultsPage.searchBar();
    color("results");
    if (history.scrollRestoration) {
      history.scrollRestoration = "auto";
    }
  };
  /**
   * When someone clicks the about button, either show the about page, or
   * return to the last page shown before the about page
   */
  routing() {
    if (environment_default.current == this.render) {
      if (routes.fixed.includes(environment_default.lastSearch) == false) window.location.href = environment_default.lastSearch;
      else window.location.href = "#home";
    } else {
      if (routes.fixed.includes(window.location.hash) == false) environment_default.lastSearch = window.location.hash;
      window.location.href = "#about";
    }
  }
  /** 
   * Hydrate the section buttons on the About page, to change between a
   * handful of section views with different information
   */
  sectionButtonEventHandlers() {
    const buttons = Array.from(document.querySelectorAll(".sectionButton"));
    buttons.forEach((button) => button.addEventListener("click", () => {
      const show_section_id = button.id.split("_")[0];
      this.sectionShow(show_section_id);
      window.sessionStorage.setItem("aboutPageMenu", show_section_id);
    }));
  }
  /**
   * Use session storage (lost when browser closes) for menu state.
   *  "aboutPageMenu" can be set to (usage|pandas|contributions)
   */
  sectionMenuDefaults() {
    if (window.sessionStorage.getItem("aboutPageMenu") == null) {
      window.sessionStorage.setItem("aboutPageMenu", "usageGuide");
    }
  }
  /** 
   * For pages with hidden sections, get a list of the section containers, and
   * hide all of them but the one provided. This requires an id convention
   * where sections are id'ed `name` and the buttons that activate those
   * sections are id'ed `name_button`
   */
  sectionShow(section_id) {
    if (section_id == null) {
      this.sectionMenuDefaults();
      section_id = window.sessionStorage.getItem("aboutPageMenu");
    }
    const desired = document.getElementById(section_id);
    const desired_button = document.getElementById(`${section_id}_button`);
    const sections = document.getElementsByClassName("section");
    const shown = Array.from(sections).filter((el) => el.classList.contains("hidden") == false).shift();
    if (shown != void 0) {
      const shown_button = document.getElementById(`${shown.id}_button`);
      shown.classList.add("hidden");
      shown_button?.classList.remove("selected");
    }
    desired?.classList.remove("hidden");
    desired_button?.classList.add("selected");
    this.fetchImages();
  }
  /** 
   * Take all available tags for this language, and draw a sorted list of tags
   * by the current `this.language`
   */
  tags() {
    const container = document.querySelector(".pandaAbout.aboutTags");
    if (!container) return;
    if (container.hasChildNodes() == true) return;
    const tagList = document.createElement("ul");
    tagList.classList.add("tagList");
    tagList.classList.add("multiColumn");
    const tagKeys = Object.keys(Tags);
    const primaryTags = {};
    for (const key of tagKeys) {
      const primaryTag = Tags[key][this.language][0];
      primaryTags[primaryTag] = key;
    }
    const sortedTags = Object.keys(primaryTags).sort();
    for (const thisTag of sortedTags) {
      const lookup = primaryTags[thisTag];
      const thisEmoji = Tags[lookup]["emoji"];
      const tagLi = document.createElement("li");
      const tagLink = document.createElement("a");
      tagLink.href = `#query/${thisTag}`;
      tagLink.innerText = `${thisEmoji} ${thisTag}`;
      tagLi.appendChild(tagLink);
      tagList.appendChild(tagLi);
    }
    container.appendChild(tagList);
  }
};
var about = new AboutPage();
var FooterComponent = class {
  /** Add or refresh the footer at the bottom of the page */
  redraw(page_mode = "results") {
    const body = document.getElementsByTagName("body")[0];
    const footer_test = document.getElementById("footer");
    if (footer_test == null) {
      const footer2 = this.render(environment_default.language, page_mode);
      const bottomMenu = page_mode == "profile" ? profileMenus.bottom.render() : resultsMenus.bottom.render();
      body.appendChild(bottomMenu);
      body.appendChild(footer2);
    } else {
      const footer2 = this.render(environment_default.language, page_mode);
      const bottomMenu = page_mode == "profile" ? profileMenus.bottom.render() : resultsMenus.bottom.render();
      if (footer_test.previousElementSibling && footer_test.previousElementSibling.id != "pageBottom") body.insertBefore(bottomMenu, footer_test);
      body.replaceChild(footer2, footer_test);
    }
  }
  /** Remove the footer and bottom menu if returning to the home page */
  remove() {
    const body = document.getElementsByTagName("body")[0];
    const footer_test = body.lastElementChild;
    if (footer_test && footer_test.id == "footer") {
      const bottomMenu_test = document.getElementsByClassName("bottomMenu")[0];
      body.removeChild(bottomMenu_test);
      body.removeChild(footer_test);
    }
  }
  /** Draw a footer with the correct language and color (class) */
  render(language, class_name) {
    const p = document.createElement("p");
    const rpn_url = "https://www.redpandanetwork.org";
    const rpn_logo_link = document.createElement("a");
    rpn_logo_link.href = rpn_url;
    rpn_logo_link.target = "_blank";
    rpn_logo_link.rel = "noopener noreferrer";
    const rpn_logo = document.createElement("img");
    rpn_logo.className = "footerRpnLogo";
    rpn_logo.src = "images/rpn-logo.png";
    rpn_logo_link.appendChild(rpn_logo);
    p.appendChild(rpn_logo_link);
    let splitMessage = [
      Text.footer[language]
    ];
    const splitTokens = [
      "<INSERTLINK_RPN>",
      "<INSERTLINK_RPF>",
      "<INSERTLINK_WASHIMUMU>",
      "<INSERTLINK_WUMPWOAST>"
    ];
    splitTokens.forEach((token, index) => {
      const splitSection = splitMessage[index].split(token);
      splitMessage = index == 0 ? splitSection : splitMessage.slice(0, index).concat(splitSection);
    });
    p.appendChild(document.createTextNode(splitMessage[0].replaceAll(/\s+/, " ")));
    const rpn = document.createElement("a");
    rpn.href = rpn_url;
    rpn.target = "_blank";
    rpn.rel = "noopener noreferrer";
    rpn.innerText = Gui.footerLink_rpn[language];
    p.appendChild(rpn);
    p.appendChild(document.createTextNode(splitMessage[1].replaceAll(/\s+/, " ")));
    const rpf = document.createElement("a");
    rpf.href = "https://github.com/wwoast/redpanda-lineage";
    rpf.target = "_blank";
    rpf.rel = "noopener noreferrer";
    rpf.innerText = Gui.footerLink_rpf[language];
    p.appendChild(rpf);
    p.appendChild(document.createTextNode(splitMessage[2].replaceAll(/\s+/, " ")));
    const washimumu = document.createElement("a");
    washimumu.href = `https://ressapanda.com/${environment_default.language}`;
    washimumu.target = "_blank";
    washimumu.rel = "noopener noreferrer";
    washimumu.innerText = Gui.footerLink_washimumu[language];
    p.appendChild(washimumu);
    p.appendChild(document.createTextNode(splitMessage[3].replaceAll(/\s+/, " ")));
    const wumpwoast = document.createElement("a");
    wumpwoast.href = `https://www.instagram.com/wumpwoast`;
    wumpwoast.target = "_blank";
    wumpwoast.rel = "noopener noreferrer";
    wumpwoast.innerText = Gui.footerLink_wumpwoast[language];
    p.appendChild(wumpwoast);
    if (splitMessage.length > 4) p.appendChild(document.createTextNode(splitMessage[4].replaceAll(/\s+/, " ")));
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    shrinker.appendChild(p);
    const footer2 = document.createElement("div");
    footer2.className = "footer";
    footer2.classList.add(class_name);
    footer2.id = "footer";
    footer2.appendChild(shrinker);
    return footer2;
  }
};
var footer = new FooterComponent();
var HomePage = class {
  /** 
   * Render an instance of the redpandafinder landing/home page with
   * randomized content from the `redpanda.json` database. By defining as an
   * arrow function, we guarantee `this` is scoped to the `HomePage` class if
   * invoked as a callback.
   */
  render = () => {
    environment_default.paging.display_button = false;
    const old_content = document.getElementById("contentFrame");
    resultsMenus.language();
    landingMenus.top.render();
    if (pandas_default.db != void 0) {
      const new_content = document.createElement("div");
      new_content.className = "results birthdayPandas";
      new_content.id = "contentFrame";
      const memorial_ids = [
        "6"
      ];
      if (!Data.hideDeadPandas) {
        const departed = memorialPhotoCredits(memorial_ids, 3, memorial);
        new_content.appendChild(departed);
      }
      const min_photo_count = 3;
      const max_birthday_animals = 5;
      const birthday_count = searchBirthdayToday(true, min_photo_count).length;
      if (birthday_count > 0) {
        const birthday4 = birthdayPhotoCredits(min_photo_count, max_birthday_animals);
        new_content.appendChild(birthday4);
      }
      if (birthday_count + memorial_ids.length < 2) {
        const special_galleries = this.special_galleries();
        new_content.appendChild(special_galleries);
      }
      const nearby = findNearbyZoo();
      new_content.appendChild(nearby);
      const new_photos2 = updatedNewPhotoCredits();
      new_content.appendChild(new_photos2);
      old_content?.replaceWith(new_content);
      shrinkNames();
      footer.redraw("landing");
    } else {
      const new_content = document.createElement("img");
      new_content.src = "images/jiuzhaigou.jpg";
      new_content.className = "fullFrame";
      new_content.id = "contentFrame";
      old_content?.replaceWith(new_content);
      footer.remove();
    }
    resultsPage.searchBar();
    color("results");
    window.scrollTo(0, 0);
  };
  /**
   * Front page galleries to use whenever there are not lots of other
   * content to display.
   * TODO: for memorials, use Option.Data to hide this
   */
  special_galleries() {
    const date2 = /* @__PURE__ */ new Date();
    const choice = environment_default.paging.seed;
    if (date2.getDay() == choice % 7) {
      return this.special_memorial();
    } else {
      return this.special_tag_galleries();
    }
  }
  /** Special memorials that are important to redpandafinder */
  special_memorial() {
    const choice = environment_default.paging.seed;
    if (choice % 7 == 0) {
      const laila = memorialPhotoCredits([
        "60"
      ], 3, missing_you);
      return laila;
    } else if (choice % 5 == 0) {
      const kokin = memorialPhotoCredits([
        "23"
      ], 3, missing_you);
      return kokin;
    } else if (choice % 3 == 0) {
      const hokuto = memorialPhotoCredits([
        "58"
      ], 3, missing_you);
      return hokuto;
    } else {
      const kingin = memorialPhotoCreditsGroup("media.7.gin-kin", [
        "22",
        "17"
      ], 3);
      return kingin;
    }
  }
  /** Tag-based special galleries */
  special_tag_galleries() {
    const special_galleries = [
      {
        "message": lunch_time,
        "photo_count": 3,
        "taglist": [
          "bamboo",
          "bite",
          "portrait"
        ]
      },
      {
        "message": lunch_time,
        "photo_count": 3,
        "taglist": [
          "apple time",
          "dish",
          "portrait"
        ]
      },
      {
        "message": lunch_time,
        "photo_count": 3,
        "taglist": [
          "apple time",
          "portrait",
          "snow"
        ]
      },
      {
        "message": autumn,
        "photo_count": 3,
        "taglist": [
          "autumn",
          "portrait"
        ]
      },
      {
        "message": baby_photos,
        "photo_count": 3,
        "taglist": [
          "baby",
          "portrait"
        ]
      }
    ];
    const choice = environment_default.paging.seed % special_galleries.length;
    const special = taglist(special_galleries[choice].photo_count, special_galleries[choice].taglist, special_galleries[choice].message);
    return special;
  }
};
var home = new HomePage();
var LinksPage = class {
  /**
   * The links page hashchange results in needing to draw or fetch the links
   * page and initialize its menus, or at the very least, scroll to the top.
   */
  hashchange = () => {
    this.render();
    environment_default.current = this.render;
    window.scrollTo(0, 0);
  };
  /** 
   * By defining as an arrow function, we guarantee `this` is scoped to the
   * `LinksPage` class if invoked as a callback.
   */
  render = () => {
    environment_default.paging.display_button = false;
    this.sectionMenuDefaults();
    const chosen = window.sessionStorage.getItem("linksPageMenu");
    this.content = linksPage.body(chosen);
    document.getElementById("contentFrame")?.replaceWith(this.content);
    this.sectionButtonEventHandlers();
    footer.redraw("results");
    resultsMenus.language();
    linksMenus.top.render();
    resultsPage.searchBar();
    color("results");
  };
  /** Handle when someone clicks the links button */
  routing() {
    if (environment_default.current == this.render) {
      if (routes.fixed.includes(environment_default.lastSearch) == false) window.location.href = environment_default.lastSearch;
      else window.location.href = "#home";
    } else {
      if (!routes.fixed.includes(window.location.hash)) {
        environment_default.lastSearch = window.location.hash;
      }
      window.location.href = "#links";
    }
  }
  sectionButtonEventHandlers() {
    const buttons = Array.from(document.getElementsByClassName("sectionButton"));
    buttons.forEach((button) => button.addEventListener("click", () => {
      const old_section = window.sessionStorage.getItem("linksPageMenu");
      const show_section_id = button.id.split("_")[0];
      this.content = linksSections[show_section_id]();
      const old_content = document.getElementById(old_section);
      if (old_content) {
        old_content.replaceWith(this.content);
        window.sessionStorage.setItem("linksPageMenu", show_section_id);
        const old_button = document.getElementById(`${old_section}_button`);
        button.classList.add("selected");
        old_button?.classList.remove("selected");
      }
    }));
  }
  /**
   * Use session storage (lost when browser closes) for menu state.
   *   "linksPageMenu" can be set to (community|zoos|friends)
   */
  sectionMenuDefaults() {
    if (window.sessionStorage.getItem("linksPageMenu") == null) {
      window.sessionStorage.setItem("linksPageMenu", "redPandaCommunity");
    }
  }
};
var links = new LinksPage();
var MediaPage = class {
  /** 
   * By defining as an arrow function, we guarantee `this` is scoped to the
   * `MediaPage` class if invoked as a callback.
   */
  render = () => {
    const input = decodeURIComponent(window.location.hash);
    const results2 = routes.behavior(input);
    environment_default.paging.display_button = true;
    const pandaMedia = results2.hits[0];
    const gallery_div = mediaPage.gallery(pandaMedia);
    const new_content = document.createElement("div");
    new_content.className = "profile";
    new_content.id = "contentFrame";
    new_content.appendChild(gallery_div);
    document.getElementById("contentFrame")?.replaceWith(new_content);
    shrinkNames();
    mediaMenus.language();
    const pandaNumericId = num(pandaMedia._id);
    mediaMenus.top.render(pandaNumericId);
    footer.redraw("profile");
    color("profile");
    mediaPage.searchBar();
    window.scrollTo(0, 0);
  };
};
var media = new MediaPage();
var OptionsPage = class {
  /** Call this in a `hashchange` handler to make the Options page appear */
  hashchange = () => {
    this.render();
    environment_default.current = this.render;
    window.scrollTo(0, 0);
  };
  /**
   * Render the options page, and replace the exisitng page content. By
   * defining as an arrow function, we guarantee `this` is scoped to the
   * `OptionsPage` class if invoked as a callback.
   */
  render = () => {
    environment_default.paging.display_button = false;
    this.content = optionsPage.body();
    document.querySelector("#contentFrame")?.replaceWith(this.content);
    footer.redraw("results");
    resultsMenus.language();
    linksMenus.top.render();
    resultsPage.searchBar();
    color("results");
  };
};
var options = new OptionsPage();
var ProfilePage = class {
  qr_update = new Event("qr_update");
  /** 
   * By defining as an arrow function, we guarantee `this` is scoped to the
   * `ProfilePage` class if invoked as a callback.
   */
  render = () => {
    const input = decodeURIComponent(window.location.hash);
    environment_default.paging.display_button = false;
    const results2 = routes.behavior(input);
    const pandaProfile = results2.hits[0];
    const profile_div = profilePage.panda(pandaProfile);
    const where_divs = profilePage.where(pandaProfile);
    const family_divs = profilePage.family(pandaProfile);
    const children_divs = profilePage.children(pandaProfile);
    const siblings_divs = profilePage.siblings(pandaProfile);
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    shrinker.appendChild(profile_div);
    for (const content_div of where_divs.concat(family_divs).concat(children_divs).concat(siblings_divs)) {
      shrinker.appendChild(content_div);
    }
    const new_content = document.createElement("div");
    new_content.className = "profile";
    new_content.id = "contentFrame";
    new_content.appendChild(shrinker);
    document.getElementById("contentFrame")?.replaceWith(new_content);
    profileMenus.language();
    const pandaNumericId = num(pandaProfile._id);
    profileMenus.top.render(pandaNumericId);
    footer.redraw("profile");
    color("profile");
    profilePage.searchBar();
    window.dispatchEvent(this.qr_update);
    window.scrollTo(0, 0);
  };
};
var profile = new ProfilePage();
var ResultsPage = class {
  /** Given a search for pandas or zoos, output entity divs */
  entities(results2) {
    let content_divs = [];
    if (results2.hits.length == 0) {
      content_divs.push(emptyResult(Text.no_result));
    }
    results2.hits.map((entity) => entity).forEach((entity) => {
      if (entity.type == "zoo") {
        content_divs.push(resultsPage.zoo(entity));
        content_divs = content_divs.concat(resultsPage.zooAnimals(entity));
        content_divs.push(zooDivider("bear-bamboo"));
      } else if (entity.type == "panda") content_divs.push(resultsPage.panda(entity));
    });
    const last_element = content_divs[content_divs.length - 1];
    if (last_element.className == "zooDivider") {
      content_divs.pop();
    }
    return content_divs;
  }
  /** 
   * Given a search for N panda ids, return first the list of media photos all
   * of them  are in, or an error message saying they haven't been seen
   * together. Then, display the results for each one. This doesn't work yet
   * for names due to space/tokenizing and name resolution issues for duplicate
   * names... that will be much more work!
   */
  group(results2) {
    let content_divs = [];
    if (results2.hits.length == 0) {
      content_divs.push(emptyResult(Text.no_group_media_result));
      return content_divs;
    }
    const animal_ids = results2.query.split(" ");
    if (results2.hits.length > 0) content_divs = content_divs.concat(resultsPage.groupGallery(animal_ids));
    const animal_results = [];
    for (const id of animal_ids) {
      const entity = graphId(id);
      animal_results.push(resultsPage.panda(entity));
    }
    let insert = 0;
    if (content_divs.length > 4) insert = 2;
    for (const result2 of animal_results) {
      content_divs.splice(insert, 0, result2);
    }
    return content_divs;
  }
  /**
   * Given a search for nearest zoos, add zoo divs and the pandas that live there,
   * along with a header message of the zoos by proximity.
   */
  nearby(results2) {
    let content_divs = [];
    if (results2.parsed == "geolookup_in_progress") {
      content_divs.push(geolocationStart());
      return content_divs;
    }
    results2.hits.map((entity) => entity).forEach((entity) => {
      content_divs.push(resultsPage.zoo(entity));
      const animals = sortOldestToYoungest(searchPandaZooCurrent(entity._id));
      animals.forEach((animal) => content_divs.push(resultsPage.panda(animal)));
      content_divs.push(zooDivider("bear-bamboo"));
    });
    const last_element = content_divs[content_divs.length - 1];
    if (last_element.className == "zooDivider") content_divs.pop();
    environment_default.output_mode = "entities";
    return content_divs;
  }
  /** Photo results have a different structure from panda/zoo results */
  photos(results2) {
    let content_divs = [];
    const max_hits = environment_default.paging.results_count;
    if (results2.parsed == "set_tag" || results2.parsed == "set_tag_subject" || results2.parsed == "set_baby_subject") {
      content_divs = tagPhotos(results2, max_hits, true);
    } else if (results2.parsed.includes("set_tag_intersection")) {
      content_divs = tagPhotos(results2, max_hits, false);
    } else if (results2.parsed == "set_credit_photos" || results2.parsed == "set_credit_photos_filtered") {
      content_divs = creditPhotos(results2, max_hits);
    }
    clear();
    return content_divs;
  }
  /** 
   * By defining as an arrow function, we guarantee `this` is scoped to the
   * `ResultsPage` class if invoked as a callback.
   */
  render = () => {
    const input = decodeURIComponent(window.location.hash);
    environment_default.paging.display_button = false;
    const results2 = routes.behavior(input);
    let content_divs = [];
    const new_content = document.createElement("div");
    new_content.id = "contentFrame";
    switch (environment_default.output_mode) {
      case "entities":
        content_divs = this.entities(results2);
        break;
      case "photos":
        content_divs = this.photos(results2);
        new_content.style.textAlign = "center";
        break;
      case "group":
        content_divs = this.group(results2);
        new_content.style.textAlign = "center";
        break;
      case "nearby":
        content_divs = this.nearby(state.results);
        break;
    }
    const shrinker = document.createElement("div");
    shrinker.className = "shrinker";
    content_divs.forEach((content_div) => shrinker.appendChild(content_div));
    new_content.appendChild(shrinker);
    resultsPage.searchBar();
    document.getElementById("contentFrame")?.replaceWith(new_content);
    shrinkNames();
    resultsMenus.language();
    resultsMenus.top.render();
    footer.redraw("results");
    color("results");
    window.scrollTo(0, 0);
  };
};
var results = new ResultsPage();
var Routes = class {
  /** Flexible layout pages */
  dynamic = [
    "#credit",
    "#group",
    "#links",
    "#media",
    "#panda",
    "#profile",
    "#query",
    "#timeline",
    "#zoo"
  ];
  /** Fixed layout pages: about page, empty query page, and options page */
  fixed = [
    "#about",
    "#home",
    "#options"
  ];
  media = [
    "#media"
  ];
  no_footer = [
    "#home"
  ];
  profile = [
    "#profile",
    "#timeline"
  ];
  results = [
    "#about",
    "#credit",
    "#group",
    "#home",
    "#links",
    "#panda",
    "#query",
    "#zoo"
  ];
  /**
   * Each hashlink determines a different behavior for the page rendering. Do a
   * task based on what the route is. TODO: add tag search URIs
   */
  behavior(input) {
    let query_string = void 0;
    if (input.indexOf("#credit/") == 0 && input.split("/").length == 3) {
      const uri_items = input.slice(8);
      const [author, filter] = uri_items.split("/");
      environment_default.preserve_case = true;
      environment_default.output_mode = "photos";
      query_string = `credit ${author} ${filter}`;
    } else if (input.indexOf("#credit/") == 0 && input.split("/").length == 2) {
      const photo_author = input.slice(8);
      environment_default.preserve_case = true;
      environment_default.output_mode = "photos";
      query_string = `credit ${photo_author}`;
    } else if (input.indexOf("#panda/") == 0 && input.split("/").length == 4) {
      const uri_items = input.slice(7);
      const [panda, _, photo_id] = uri_items.split("/");
      environment_default.output_mode = "entities";
      environment_default.specific_photo = photo_id;
      query_string = `panda ${panda}`;
    } else if (input.indexOf("#panda/") == 0 && input.split("/").length == 2) {
      const panda = input.slice(7);
      environment_default.output_mode = "entities";
      query_string = `panda ${panda}`;
    } else if (input.indexOf("#group") == 0 && input.split("/").length >= 2 && input.split("/").length <= pandas_default.db._photo.group_max + 1) {
      const id_list = input.slice(7).split("/");
      environment_default.output_mode = "group";
      query_string = id_list.join(" ");
    } else if (input.indexOf("#profile/") == 0 && input.split("/").length == 4) {
      const uri_items = input.slice(9);
      const [panda, _, photo_id] = uri_items.split("/");
      environment_default.specific_photo = photo_id;
      query_string = `panda ${panda}`;
    } else if (input.indexOf("#profile/") == 0 && input.split("/").length == 2) {
      const panda = input.slice(9);
      query_string = `panda ${panda}`;
    } else if (input.indexOf("#media/") == 0 && input.split("/").length == 2) {
      const panda = input.slice(7);
      query_string = `panda ${panda}`;
    } else if (input.indexOf("#query/") == 0) {
      query_string = input.slice(7);
      environment_default.output_mode = "entities";
    } else if (input.indexOf("#zoo/") == 0 && input.split("/").length == 4) {
      const uri_items = input.slice(5);
      const [zoo, _, zoo_id] = uri_items.split("/");
      environment_default.output_mode = "entities";
      environment_default.specific_photo = zoo_id;
      query_string = `zoo ${zoo}`;
    } else if (input.indexOf("#zoo/") == 0 && input.split("/").length == 2) {
      const zoo = input.slice(5);
      environment_default.output_mode = "entities";
      query_string = `zoo ${zoo}`;
    } else {
      throw new Error("TODO: unrecognized route");
    }
    return result(query_string);
  }
  /**
   * On initial page load, look for specific hashes that represent special
   * buttons and queue up that page for loading if necessary.
   */
  check() {
    const mode = window.location.hash.split("/")[0];
    if (this.profile.includes(mode)) environment_default.current = profile.render;
    else if (this.media.includes(mode)) environment_default.current = media.render;
    else if (window.location.hash == "#about") environment_default.current = about.render;
    else if (window.location.hash == "#links") environment_default.current = links.render;
    else if (window.location.hash == "#options") environment_default.current = options.render;
    else if (this.dynamic.includes(mode)) environment_default.current = results.render;
    else environment_default.current = home.render;
  }
  /**
   * Determine if the current page route includes one of the routes
   * specified in the different routes lists above.
   */
  memberOf(routeList, current_route) {
    for (let route of routeList) {
      if (current_route.includes(route)) {
        return true;
      }
    }
    return false;
  }
};
var routes = new Routes();

// ts/language.ts
function init3() {
  for (const tag in Tags) {
    const en_tags = Tags[tag]["en"];
    const first_cap = en_tags.map((x) => capitalize(x, "first"));
    const all_cap = en_tags.map((y) => capitalize(y, "all"));
    Tags[tag]["en"] = en_tags.concat(first_cap).concat(all_cap).filter((value, index, self) => self.indexOf(value) === index);
  }
}
var alphabets = {
  "cjk": [
    "ja",
    "ko",
    "zh"
  ],
  "cyrillic": [
    "ru"
  ],
  "latin": [
    "da",
    "de",
    "en",
    "es",
    "fr",
    "nl",
    "pl",
    "pt",
    "sv"
  ]
};
var bias = {
  "en": [
    "latin"
  ],
  "es": [
    "latin"
  ],
  "ja": [
    "latin"
  ],
  "ko": [
    "latin"
  ],
  "ne": [
    "latin"
  ],
  "pt": [
    "latin"
  ],
  "zh": [
    "latin"
  ]
};
var charset = {
  "ja": {
    "hiragana": [
      "\u3042",
      "\u3044",
      "\u3046",
      "\u3048",
      "\u304A",
      "\u304B",
      "\u304D",
      "\u304F",
      "\u3051",
      "\u3053",
      "\u304C",
      "\u304E",
      "\u3050",
      "\u3052",
      "\u3054",
      "\u3055",
      "\u3057",
      "\u3059",
      "\u305B",
      "\u305D",
      "\u3056",
      "\u3058",
      "\u305A",
      "\u305C",
      "\u305E",
      "\u305F",
      "\u3061",
      "\u3064",
      "\u3066",
      "\u3068",
      "\u3060",
      "\u3062",
      "\u3065",
      "\u3067",
      "\u3069",
      "\u306A",
      "\u306B",
      "\u306C",
      "\u306D",
      "\u306E",
      "\u306F",
      "\u3072",
      "\u3075",
      "\u3078",
      "\u307B",
      "\u3070",
      "\u3073",
      "\u3076",
      "\u3079",
      "\u307C",
      "\u3071",
      "\u3074",
      "\u3077",
      "\u307A",
      "\u307D",
      "\u307E",
      "\u307F",
      "\u3080",
      "\u3081",
      "\u3082",
      "\u3084",
      "\u3086",
      "\u3088",
      "\u3089",
      "\u308A",
      "\u308B",
      "\u308C",
      "\u308D",
      "\u308F",
      "\u3090",
      "\u3091",
      "\u3092",
      "\u3093",
      "\u3041",
      "\u3043",
      "\u3045",
      "\u3047",
      "\u3049",
      "\u3083",
      "\u3085",
      "\u3087"
    ],
    "katakana": [
      "\u30A2",
      "\u30A4",
      "\u30A6",
      "\u30A8",
      "\u30AA",
      "\u30AB",
      "\u30AD",
      "\u30AF",
      "\u30B1",
      "\u30B3",
      "\u30AC",
      "\u30AE",
      "\u30B0",
      "\u30B2",
      "\u30B4",
      "\u30B5",
      "\u30B7",
      "\u30B9",
      "\u30BB",
      "\u30BD",
      "\u30B6",
      "\u30B8",
      "\u30BA",
      "\u30BC",
      "\u30BE",
      "\u30BF",
      "\u30C1",
      "\u30C4",
      "\u30C6",
      "\u30C8",
      "\u30C0",
      "\u30C2",
      "\u30C5",
      "\u30C7",
      "\u30C9",
      "\u30CA",
      "\u30CB",
      "\u30CC",
      "\u30CD",
      "\u30CE",
      "\u30CF",
      "\u30D2",
      "\u30D5",
      "\u30D8",
      "\u30DB",
      "\u30D0",
      "\u30D3",
      "\u30D6",
      "\u30D9",
      "\u30DC",
      "\u30D1",
      "\u30D4",
      "\u30D7",
      "\u30DA",
      "\u30DD",
      "\u30DE",
      "\u30DF",
      "\u30E0",
      "\u30E1",
      "\u30E2",
      "\u30E4",
      "\u30E6",
      "\u30E8",
      "\u30E9",
      "\u30EA",
      "\u30EB",
      "\u30EC",
      "\u30ED",
      "\u30EF",
      "\u30F0",
      "\u30F1",
      "\u30F2",
      "\u30F3",
      "\u30A1",
      "\u30A3",
      "\u30A5",
      "\u30A7",
      "\u30A9",
      "\u30E3",
      "\u30E5",
      "\u30E7"
    ]
  }
};
var fallback_blacklist = [
  "othernames",
  "nicknames"
];
function defaultDisplayLanguage() {
  Defaults.languages.forEach((option) => {
    if (navigator.languages.includes(option)) {
      environment_default.language = option;
    }
  });
  const test = window.localStorage.getItem("language");
  if (test != null) {
    if (Defaults.languages.includes(test)) {
      environment_default.language = test;
    }
  }
  if (environment_default.language == void 0) environment_default.language = "en";
  fallbackFlags();
}
function fallbackEntity(entity) {
  const output = entity;
  const order = currentOrder(language_order(entity), environment_default.language);
  const default_animal = saveEntityKeys(Defaults.animal, order);
  const default_zoo = saveEntityKeys(Defaults.zoo, order);
  const empty_values = [
    ...[
      void 0
    ],
    ...Object.values(Defaults.unknown),
    ...Object.values(default_animal),
    ...Object.values(default_zoo)
  ];
  const translatableKeys = listEntityKeys(entity, order);
  for (const key of translatableKeys) {
    if (fallback_blacklist.includes(key)) continue;
    for (const language of order) {
      if (entity[key][environment_default.language] == void 0) {
        if (language == environment_default.language) continue;
        if (!empty_values.includes(entity[key][language])) {
          output[key][environment_default.language] = entity[key][language];
          break;
        }
      }
    }
  }
  return output;
}
function fallbackFlags() {
  const us = "en-US";
  if (!navigator.languages.includes(us)) {
    Gui.flag["en"] = Flags["UK"];
  } else {
    for (const lang of navigator.languages) {
      if (lang.indexOf("en") == 0) {
        const commonwealthIndex = navigator.languages.indexOf(lang);
        const usIndex = navigator.languages.indexOf(us);
        if (commonwealthIndex < usIndex) {
          Gui.flag["en"] = Flags["UK"];
          break;
        }
      }
    }
  }
  const china = "zh-CN";
  const taiwan = "zh-TW";
  if (navigator.languages.includes(taiwan) && navigator.languages.includes(china) && navigator.languages.indexOf(taiwan) < navigator.languages.indexOf(china)) {
    Gui.flag["zh"] = Flags["Taiwan"];
  }
  const korean = "ko-KR";
  if (navigator.languages.includes(korean)) {
    Gui.flag["ko"] = Flags["South Korea"];
  }
  const brazil = "pt-BR";
  if (navigator.languages.includes(brazil)) {
    Gui.flag["pt"] = Flags["Brazil"];
  }
}
function fallbackInfo(info, original) {
  const bundle = structuredClone(info);
  const order = currentOrder(info.language_order, environment_default.language);
  const default_animal = saveEntityKeys(Defaults.animal, order);
  const default_zoo = saveEntityKeys(Defaults.zoo, order);
  const empty_values = [
    ...[
      void 0
    ],
    ...Object.values(Defaults.unknown),
    ...Object.values(default_animal),
    ...Object.values(default_zoo)
  ];
  const translatableKeys = listEntityKeys(original, order);
  for (const key of translatableKeys) {
    if (fallback_blacklist.includes(key)) continue;
    for (const language of order) {
      if (info[key] == void 0) {
        if (language == environment_default.language) continue;
        if (!empty_values.includes(original[key][language])) {
          bundle[key] = original[key][language];
          break;
        }
      }
    }
  }
  if (info.type == "panda" && bundle.type == "panda") {
    if (info.zoo != void 0 && info.zoo != Defaults.zoo) {
      bundle.zoo = fallbackEntity(info.zoo);
    }
    if (info.birthplace != void 0 && info.birthplace != Defaults.zoo && info.birthplace != Defaults.wild) {
      bundle.birthplace = fallbackEntity(info.birthplace);
    }
    for (const index in info.mom) {
      if (info.mom[index] != void 0 && info.mom[index] != Defaults.animal) {
        info.mom[index] = fallbackEntity(info.mom[index]);
      }
    }
    for (const index in info.dad) {
      if (info.dad[index] != void 0 && info.dad[index] != Defaults.animal) {
        info.dad[index] = fallbackEntity(info.dad[index]);
      }
    }
    for (const index in info.litter) {
      if (info.litter[index] != void 0 && info.litter[index] != Defaults.animal) {
        info.litter[index] = fallbackEntity(info.litter[index]);
      }
    }
    for (const index in info.siblings) {
      if (info.siblings[index] != void 0 && info.siblings[index] != Defaults.animal) {
        info.siblings[index] = fallbackEntity(info.siblings[index]);
      }
    }
    for (const index in info.children) {
      if (info.children[index] != void 0 && info.children[index] != Defaults.animal) {
        info.children[index] = fallbackEntity(info.children[index]);
      }
    }
  }
  return bundle;
}
function capitalNames(input) {
  let words = [];
  const output = [];
  if (input.includes(" ")) {
    words = input.split(" ");
  } else {
    words.push(input);
  }
  words.forEach(function(word) {
    const latin = testString(input, "Latin");
    if (latin == true && environment_default.preserve_case == false) {
      word = word.replace(/^\w/, (chr) => chr.toUpperCase());
      word = word.replace(/-./, (chr) => chr.toUpperCase());
      word = word.replace(/ ./, (chr) => chr.toUpperCase());
    }
    output.push(word);
  });
  return output.join(" ");
}
function capitalize(input, mode) {
  const words = input.split(" ").length;
  const output = mode == "first" || words == 1 ? input.charAt(0).toUpperCase() + input.slice(1) : input.replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  return output;
}
function commaPhrase(pieces) {
  const p = document.createElement("p");
  for (let i = 0; i < pieces.length; i++) {
    const m = document.createTextNode(pieces[i]);
    const c = document.createTextNode(Text.comma[environment_default.language]);
    const a = document.createTextNode(Text.and_words[environment_default.language]);
    p.appendChild(m);
    if (i < pieces.length - 3 && pieces.length > 3) {
      p.appendChild(c);
    }
    if (i == pieces.length - 3 && pieces.length > 3) {
      p.appendChild(c);
      p.appendChild(a);
    }
    if (i == pieces.length - 3 && pieces.length <= 3) {
      p.appendChild(a);
    }
  }
  return p;
}
function commaPhraseBare(pieces) {
  let o = "";
  for (let i = 0; i < pieces.length; i++) {
    const m = pieces[i];
    const c = Text.comma[environment_default.language] + " ";
    const a = Text.and_words[environment_default.language];
    o = o.concat(m);
    if (i < pieces.length - 2 && pieces.length > 2) {
      o = o.concat(c);
    }
    if (i == pieces.length - 2 && pieces.length > 2) {
      o = o.concat(c);
      o = o.concat(a);
    }
    if (i == pieces.length - 2 && pieces.length <= 2) {
      o = o.concat(a);
    }
  }
  o = o.replace(/\s\s+/g, " ");
  return o;
}
function currentOrder(currentList, currentLanguage) {
  let currentBias = bias[currentLanguage];
  let fallbackLanguages = [];
  if (currentBias[0] == "latin") {
    for (const lang of currentList) {
      if (alphabets["latin"].includes(lang)) {
        fallbackLanguages.push(lang);
      }
    }
  }
  return [
    currentLanguage
  ].concat(Array.from(currentList)).concat(fallbackLanguages).filter((value, index, self) => self.indexOf(value) === index);
}
function editDistance(a, b) {
  if (!a || !b) return (a || b).length;
  const m = [];
  for (let i = 0; i <= b.length; i++) {
    m[i] = [
      i
    ];
    if (i === 0) continue;
    for (var j = 0; j <= a.length; j++) {
      m[0][j] = j;
      if (j === 0) continue;
      m[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}
function fallback_name(entity) {
  const entity_order = entity["language.order"];
  const order = currentOrder(entity_order, environment_default.language);
  order.unshift(environment_default.language);
  for (const language of order) {
    const name = entity.name[language];
    if (name != void 0) return name;
  }
  switch (entity.type) {
    case "panda":
      return Defaults.animal.name[environment_default.language] ?? "";
    case "wild":
      return Defaults.wild.name[environment_default.language] ?? "";
    case "zoo":
      return Defaults.zoo.name[environment_default.language] ?? "";
    default:
      return Defaults.unknown[environment_default.language] ?? "";
  }
}
function hiraganaToKatakana(input) {
  const japaneseCharacters = Defaults.ranges["ja"];
  const source_range = japaneseCharacters[1];
  const test = source_range.test(input);
  let output = "";
  if (test == false) {
    return input;
  } else {
    for (let char of input) {
      const index = charset["ja"].hiragana.indexOf(char);
      if (index > -1) {
        const swap = charset["ja"].katakana[index];
        output += swap;
      } else {
        output += char;
      }
    }
  }
  return output;
}
function katakanaToHiragana(input) {
  const japaneseCharacters = Defaults.ranges["ja"];
  const source_range = japaneseCharacters[2];
  const test = source_range.test(input);
  let output = "";
  if (test == false) {
    return input;
  } else {
    for (let char of input) {
      const index = charset["ja"].katakana.indexOf(char);
      if (index > -1) {
        const swap = charset["ja"].hiragana[index];
        output += swap;
      } else {
        output += char;
      }
    }
    return output;
  }
}
function listEntityKeys(entity, order) {
  const languages = new Set(order.concat(Defaults.languages));
  const filtered = Object.keys(entity).filter((key) => {
    const subObject = entity[key];
    if (typeof subObject !== "object") return false;
    const maybeLanguageKeys = new Set(Object.keys(subObject));
    if (maybeLanguageKeys.size == 0) return false;
    if (maybeLanguageKeys.isSubsetOf(languages)) return true;
    else return false;
  });
  return filtered;
}
function saveEntityKeys(entity, order) {
  return listEntityKeys(entity, order).reduce(function(obj, key) {
    obj[key] = entity[key];
    return obj;
  }, {});
}
function tagPrimary(input) {
  const lang_values = [
    ...Defaults.languages,
    "emoji"
  ];
  for (const ctag in Tags) {
    for (const lang of lang_values) {
      if (Tags[ctag][lang].includes(input)) {
        return ctag;
      }
    }
  }
  for (const ctag in Polyglots) {
    for (const lang of lang_values) {
      if (Polyglots[ctag][lang].includes(input)) {
        return ctag;
      }
    }
  }
  throw new Error(`TODO: primary tag for ${input} not found`);
}
function testString(input, test) {
  const japaneseCharacters = Defaults.ranges["ja"];
  const latinCharacters = Defaults.ranges["en"];
  if (test == "Hiragana") {
    const range = japaneseCharacters[1];
    return range.test(input);
  }
  if (test == "Katakana") {
    const range = japaneseCharacters[2];
    return range.test(input);
  }
  if (test == "Latin" || test == "English") {
    const latin = latinCharacters.some((range) => range.test(input));
    return latin;
  }
  return false;
}
function unpluralize(pieces) {
  const output = [];
  if (environment_default.language == "en") {
    for (let input of pieces) {
      input = input.replace(/\b1 photos/, "one photo").replace(/\b1 new photos/, "one new photo").replace(/\b1 boys/, "one boy").replace(/\b1 girls/, "one girl").replace(/\b1 brothers/, "one brother").replace(/\b1 sisters/, "one sister").replace(/\b1 sons/, "one son").replace(/\b1 daughters/, "one daughter").replace(/\b1 newborns/, "one newborn").replace(/\b1 new red pandas/, "one new red panda").replace(/\b1 baby siblings/, "one baby sibling").replace(/\b1 current red pandas/, "one current red panda").replace(/\b1 red pandas live/, "one red panda lives").replace(/\b1 cubs/, "one cub").replace(/\b1 recorded in the database/, "one record in the database").replace(/\b1 recent departures/, "one recent departure").replace(/\b1 new contributors/, "one new contributor").replace(/\bcombo: 1 photos/, "combo: one photo").replace(/\bphotos tagged/, "photo tagged").replace(/^([^A-Za-z0-9]+)one\s/, "$1 One ").replace(/^one\s/, "One ");
      output.push(input);
    }
    return output;
  } else if (environment_default.language == "es") {
    for (let input of pieces) {
      input = input.replace(/\b1 fotos/, "una foto").replace(/\b1 niños/, "un ni\xF1o").replace(/\b1 niñas/, "una ni\xF1a").replace(/\b1 hermanos/, "un hermano").replace(/\b1 hermanas/, "una hermana").replace(/\b1 hijos/, "un hijo").replace(/\b1 hijas/, "una hija").replace(/\b1 hermanitos/, "un hermanito").replace(/\b1 machos/, "un macho").replace(/\b1 hembras/, "una hembra").replace(/\b1 nuevos pandas rojos/, "un nuevo panda rojo").replace(/\b1 hermanos pequeños/, "un hermano peque\xF1o").replace(/\b1 panda rojos en/, "un panda rojo en").replace(/\b1 cachorros nacidos/, "un cachorro nacido").replace(/\b1 registrados aquí/, "un registrado aqu\xED").replace(/\b1 partidas recientes/, "un partida reciente").replace(/\b1 nuevos contribuyentes/, "uno nuevo contribuyente").replace(/\bcombo: 1 fotos/, "combo: una foto").replace(/\bfotos etiquetadas/, "foto etiquetada").replace(/^([^A-Za-z0-9]+)un\s/, "$1 Un ").replace(/^([^A-Za-z0-9]+)uno\s/, "$1 Uno ").replace(/^([^A-Za-z0-9]+)una\s/, "$1 Una ").replace(/^un\s/, "Un ").replace(/^uno\s/, "Uno ").replace(/^una\s/, "Una ");
      output.push(input);
    }
    return output;
  } else if (environment_default.language == "ko") {
    for (let input of pieces) {
      input = input.replace(/(\d+) 사진들/, "$1 \uC0AC\uC9C4").replace(/(\d+) 동물들/, "$1 \uB3D9\uBB3C").replace(/(\d+) 판다들/, "$1 \uD310\uB2E4").replace(/새로운 (\d+) 기여자들/, "\uC0C8\uB85C\uC6B4 $1 \uAE30\uC5EC\uC790").replace(/사진 태그들/, "\uC0AC\uC9C4 \uD0DC\uADF8");
      output.push(input);
    }
    return output;
  } else if (environment_default.language == "pt") {
    for (let input of pieces) {
      input = input.replace(/\b1 fotos/, "uma foto").replace(/\b1 novas fotos/, "uma nova foto").replace(/\b1 meninos/, "um menino").replace(/\b1 meninas/, "uma menina").replace(/\b1 irmãos/, "um irm\xE3o").replace(/\b1 irmãs/, "uma irm\xE3").replace(/\b1 filhos/, "um filho").replace(/\b1 filhas/, "uma filha").replace(/\b1 recém-nascidos(as)/, "um(a) rec\xE9m-nascido(a)").replace(/\b1 novos pandas-vermelhos/, "um novo panda-vermelho").replace(/\b1 irmãos(ãs) bebês/, "um(a) irm\xE3o(\xE3) beb\xEA").replace(/\b1 pandas-vermelhos atualmente/, "um panda-vermelho atualmente").replace(/\b1 pandas-vermelhos moram/, "um panda-vermelho mora").replace(/\b1 filhotes nascidos/, "um filhote nascido").replace(/\b1 registrados na base de dados/, "um registrado na base de dados").replace(/\b1 partidas recentes/, "uma partida recente").replace(/\b1 novos contribuintes/, "um novo contribuinte").replace(/\bcombo: 1 fotos/, "combo: uma foto").replace(/\bfotos etiquetadas/, "foto etiquetada").replace(/^([^A-Za-z0-9]+)um\s/, "$1 Um ").replace(/^([^A-Za-z0-9]+)uma\s/, "$1 Uma ").replace(/^um\s/, "Um ").replace(/^uma\s/, "Uma ");
      output.push(input);
    }
    return output;
  } else {
    return pieces;
  }
}
function update2() {
  const menu_button_ids = [
    "languageButton",
    "aboutButton",
    "randomButton",
    "linksButton",
    "profileButton",
    "mediaButton",
    "timelineButton"
  ];
  const menu_button_elements = menu_button_ids.map((x) => document.getElementById(x)).filter((x) => x != void 0);
  for (const element of menu_button_elements) {
    const id = element.id;
    const lookup = id.replace("Button", "");
    const [icon, text] = Array.from(element.childNodes[0].childNodes).filter((node) => node instanceof HTMLDivElement);
    if (lookup == "language") {
      icon.innerText = Gui.flag[environment_default.language];
      text.innerText = LangNames[environment_default.language][environment_default.language];
    } else {
      text.innerText = Gui[lookup][environment_default.language];
    }
  }
  if (window.location.hash == "#links" && pandas_default.db != void 0) links.render();
  const form = document.forms.namedItem("searchForm");
  const searchInput = document.querySelector("#searchInput");
  if (form != null && searchInput != null) {
    if (pandas_default.db == void 0) searchInput.placeholder = Gui.loading[environment_default.language];
    else searchInput.placeholder = "\u27A4 " + Gui.search[environment_default.language];
  }
  document.title = Gui.title[environment_default.language];
  window.localStorage.setItem("language", environment_default.language);
}

// ts/message.ts
var Text = {
  "and": {
    "en": " & ",
    "es": " y ",
    "ja": "\u3068",
    "ko": " & ",
    "ne": " \u0930 ",
    "pt": " e ",
    "zh": "\u548C"
  },
  "and_words": {
    "en": " and ",
    "es": " y ",
    "ja": "\u3068",
    "ko": " \uADF8\uB9AC\uACE0 ",
    "ne": " \u0930 ",
    "pt": " e ",
    "zh": "\u548C"
  },
  "arrived_from_zoo": {
    "en": `<INSERTDATE>, from <INSERTZOO>`,
    "es": `<INSERTDATE> desde <INSERTZOO>`,
    "ja": `<INSERTDATE>\u3001<INSERTZOO>\u304B\u3089`,
    "ko": `<INSERTDATE>\uC5D0\uC11C<INSERTZOO>`,
    "ne": `<INSERTDATE> \u092C\u093E\u091F <INSERTZOO>`,
    "pt": `<INSERTDATE>, desde <INSERTZOO>`,
    "zh": `<INSERTDATE>\uFF0C\u6765\u81EA<INSERTZOO>`
  },
  "autumn": {
    "en": `${Emoji.autumn} Season of changing colors ${Emoji.autumn}`,
    "es": `${Emoji.autumn} Temporada de colores cambiantes ${Emoji.autumn}`,
    "ja": `${Emoji.autumn} \u8272\u304C\u5909\u308F\u308B\u5B63\u7BC0 ${Emoji.autumn}`,
    "ko": `${Emoji.autumn} \uC0C9\uC774 \uBCC0\uD558\uB294 \uACC4\uC808 ${Emoji.autumn}`,
    "ne": `${Emoji.autumn} \u0930\u0902\u0917 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928 \u0915\u094B \u092E\u094C\u0938\u092E ${Emoji.autumn}`,
    "pt": `${Emoji.autumn} Esta\xE7\xE3o de mudan\xE7a de cores ${Emoji.autumn}`,
    "zh": `${Emoji.autumn} \u53D8\u8272\u7684\u5B63\u8282 ${Emoji.autumn}`
  },
  "baby_photos": {
    "en": `${Emoji.baby} Precious little angels ${Emoji.baby}`,
    "es": `${Emoji.baby} Angelitos preciosos ${Emoji.baby}`,
    "ja": `${Emoji.baby} \u8CB4\u91CD\u306A\u5C0F\u3055\u306A\u5929\u4F7F ${Emoji.baby}`,
    "ko": `${Emoji.baby} \uC18C\uC911\uD55C \uC791\uC740 \uCC9C\uC0AC\uB4E4 ${Emoji.baby}`,
    "ne": `${Emoji.baby} \u092C\u0939\u0941\u092E\u0942\u0932\u094D\u092F \u0938\u093E\u0928\u093E \u0938\u094D\u0935\u0930\u094D\u0917\u0926\u0942\u0924\u0939\u0930\u0942 ${Emoji.baby}`,
    "pt": `${Emoji.baby} Anjinhos preciosos ${Emoji.baby}`,
    "zh": `${Emoji.baby} \u73CD\u8D35\u7684\u5C0F\u5929\u4F7F ${Emoji.baby}`
  },
  "birthday_overflow": {
    "en": `${Emoji.fireworks} <INSERTCOUNT> birthdays today!`,
    "es": `${Emoji.fireworks} \xA1<INSERTCOUNT> cumplea\xF1os hoy!`,
    "ja": `${Emoji.fireworks} \u4ECA\u65E5\u306F<INSERTCOUNT>\u6B73\u306E\u8A95\u751F\u65E5\uFF01`,
    "ko": `${Emoji.fireworks} \uC624\uB298 <INSERTCOUNT> \uC0DD\uC77C!`,
    "ne": `${Emoji.fireworks} \u0906\u091C <INSERTCOUNT> \u091C\u0928\u094D\u092E\u0926\u093F\u0928!"`,
    "pt": `${Emoji.fireworks} <INSERTCOUNT> anivers\xE1rios hoje!"`,
    "zh": `${Emoji.fireworks} \u4ECA\u5929<INSERTCOUNT>\u4E2A\u751F\u65E5\uFF01"`
  },
  "closed": {
    "en": `${Emoji.closed} Permanently closed on <INSERTDATE>`,
    "es": `${Emoji.closed} Cerrado permanentemente el <INSERTDATE>`,
    "ja": `${Emoji.closed} <INSERTDATE>\u306B\u9589\u696D`,
    "ko": `${Emoji.closed} <INSERTDATE> \uC601\uAD6C \uD3D0\uC1C4`,
    "ne": `${Emoji.closed} \u0938\u094D\u0925\u093E\u092F\u0940 \u0930\u0942\u092A\u092E\u093E <INSERTDATE> \u092C\u0928\u094D\u0926 \u092D\u092F\u094B`,
    "pt": `${Emoji.closed} Permanentemente fechado em <INSERTDATE>`,
    "zh": `${Emoji.closed} <INSERTDATE>\u6C38\u4E45\u5173\u95ED`
  },
  "comma": {
    "en": ", ",
    "es": ", ",
    "ja": "\u3068",
    "ko": ", ",
    "ne": ", ",
    "pt": ", ",
    "zh": "\u53CA"
  },
  "credit": {
    "en": `${Emoji.gift} *<INSERTUSER>* has contributed **<INSERTNUMBER>** photos.`,
    "es": `${Emoji.gift} *<INSERTUSER>* ha contribuido con **<INSERTNUMBER>** fotos.`,
    "ja": `${Emoji.gift} *<INSERTUSER>*\u306F**<INSERTNUMBER>**\u679A\u306E\u5199\u771F\u3092\u5BC4\u7A3F\u3057\u307E\u3057\u305F\u3002`,
    "ko": `${Emoji.gift} *<INSERTUSER>*\uC774(\uAC00) **<INSERTNUMBER>**\uC7A5\uC758 \uC0AC\uC9C4\uC744 \uC81C\uACF5\uD588\uC2B5\uB2C8\uB2E4.`,
    "ne": `${Emoji.gift} *<INSERTUSER>* \u0932\u0947 **<INSERTNUMBER>** \u092B\u094B\u091F\u094B \u092F\u094B\u0917\u0926\u093E\u0928 \u0917\u0930\u0947\u0915\u094B \u091B`,
    "pt": `${Emoji.gift} *<INSERTUSER>* contribuiu com **<INSERTNUMBER>** fotos.`,
    "zh": `${Emoji.gift} *<INSERTUSER>*\u63D0\u4F9B\u4E86**<INSERTNUMBER>**\u5F20\u7167\u7247\u3002`
  },
  "credit_animal_filter_single": {
    "en": `${Emoji.gift} *<INSERTUSER>* has contributed **<INSERTNUMBER>** photos of **<INSERTNAME>**.`,
    "es": `${Emoji.gift} *<INSERTUSER>* ha contribuido con **<INSERTNUMBER>** fotos de **<INSERTNAME>**.`,
    "ja": `${Emoji.gift} *<INSERTUSER>*\u304C**<INSERTNAME>**\u306E\u5199\u771F\u3092*<INSERTNUMBER>*\u679A\u6295\u7A3F\u3057\u307E\u3057\u305F\u3002`,
    "ko": `${Emoji.gift} *<INSERTUSER>*\uC774(\uAC00) **<INSERTNAME>**\uC758 \uC0AC\uC9C4\uC744**<INSERTNUMBER>**\uC7A5 \uC81C\uACF5\uD588\uC2B5\uB2C8\uB2E4.`,
    "ne": `${Emoji.gift} *<INSERTUSER>* **<INSERTNUMBER>** **<INSERTNAME>** \u092B\u094B\u091F\u094B\u0939\u0930\u0941 \u092F\u094B\u0917\u0926\u093E\u0928 \u0917\u0930\u0947\u0915\u094B \u091B`,
    "pt": `${Emoji.gift} *<INSERTUSER>* contribuiu com **<INSERTNUMBER>** fotos de **<INSERTNAME>**.`,
    "zh": `${Emoji.gift} *<INSERTUSER>*\u63D0\u4F9B\u4E86**<INSERTNUMBER>**\u5F20**<INSERTNAME>**\u7167\u7247\u3002`
  },
  "departed_to_zoo": {
    "en": `<INSERTZOO> on <INSERTDATE>`,
    "es": `<INSERTZOO> al <INSERTDATE>`,
    "ja": `<INSERTDATE>\u306B<INSERTZOO>\u306B\u884C\u304D\u307E\u3057\u305F`,
    "ko": `<INSERTZOO>\uC5D0\uC11C<INSERTDATE>`,
    "ne": `<INSERTZOO> <INSERTDATE> \u092E\u093E`,
    "pt": `<INSERTZOO> em <INSERTDATE>`,
    "zh": `<INSERTDATE>\u53BB<INSERTZOO>`
  },
  "find_a_nearby_zoo": {
    "en": `${Emoji.globe_americas} Find a zoo nearby!`,
    "es": `${Emoji.globe_americas} \xA1Encuentra un zool\xF3gico cerca de ti!`,
    "ja": `${Emoji.globe_asia} \u8FD1\u304F\u306E\u52D5\u7269\u5712\u3092\u898B\u3064\u3051\u308B`,
    "ko": `${Emoji.globe_asia} \uC8FC\uBCC0 \uB3D9\uBB3C\uC6D0 \uCC3E\uAE30`,
    "ne": `${Emoji.globe_asia} \u0928\u091C\u093F\u0915\u0948 \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E \u0916\u094B\u091C\u094D\u0928\u0941\u0939\u094B\u0938\u094D`,
    "pt": `${Emoji.globe_americas} Encontre um zool\xF3gico pr\xF3ximo!`,
    "zh": `${Emoji.globe_asia} \u5BFB\u627E\u9644\u8FD1\u7684\u52A8\u7269\u56ED`
  },
  "footer": {
    "en": `If you love red pandas, please support <INSERTLINK_RPN>, as well as your local zoos. 
           Lineage data courtesy of the <INSERTLINK_RPF> project, but linked media remains property 
           of its creators. Design \xA9\xA02026 <INSERTLINK_WASHIMUMU> & <INSERTLINK_WUMPWOAST>.`,
    "es": `Si te encantan los pandas rojos, apoya a <INSERTLINK_RPN> y a los zool\xF3gicos locales. 
           Los datos sobre el linaje son cortes\xEDa del proyecto <INSERTLINK_RPF> pero los medios ,
           vinculados siguen siendo propiedad de sus creadores. Dise\xF1o \xA9\xA02026 
           <INSERTLINK_WASHIMUMU> y <INSERTLINK_WUMPWOAST>.`,
    "ja": `\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0\u304C\u597D\u304D\u306A\u4EBA\u306F\u3001\u5730\u5143\u306E\u52D5\u7269\u5712\u3060\u3051\u3067\u306A\u304F<INSERTLINK_RPN>\u3082\u30B5\u30DD\u30FC\u30C8\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u7CFB\u7D71\u30C7\u30FC\u30BF\u306F
           <INSERTLINK_RPF>\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u597D\u610F\u306B\u3088\u308A\u63D0\u4F9B\u3055\u308C\u3066\u3044\u307E\u3059\u304C\u3001\u30EA\u30F3\u30AF\u3055\u308C\u305F\u30E1\u30C7\u30A3\u30A2\u306F\u5F15\u304D\u7D9A\u304D\u4F5C\u6210\u8005\u306E\u6240\u6709\u7269\u3067\u3059\u3002
           \u8A2D\u8A08\xA92026<INSERTLINK_WASHIMUMU>\u3068<INSERTLINK_WUMPWOAST>`,
    "ko": `\uB808\uC11C\uD310\uB2E4\uB97C \uC0AC\uB791\uD55C\uB2E4\uBA74, \uAF2D \uC751\uC6D0\uACFC \uD6C4\uC6D0\uC744 \uBD80\uD0C1\uB4DC\uB824\uC694! <INSERTLINK_RPN> \uC5EC\uB7EC\uBD84\uC774 \uAC00\uAE4C\uC774\uC5D0\uC11C \uBC29\uBB38\uD560 \uC218 \uC788\uB294 \uC9C0\uC5ED 
           \uB3D9\uBB3C\uC6D0\uB3C4 \uC751\uC6D0\uD574 \uC8FC\uC138\uC694. <INSERTLINK_RPF> \uB370\uC774\uD130\uB294 \uBCF8 \uD504\uB85C\uC81D\uD2B8\uC758 \uD611\uC870\uB85C \uC81C\uACF5\uB418\uBA70, \uC5F0\uACB0\uB41C \uBBF8\uB514\uC5B4 \uC790\uB8CC\uC758 \uC800\uC791\uAD8C\uC740 
           \uAC01 \uC81C\uC791\uC790\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4. \uB808\uC774\uC544\uC6C3 \uBC0F \uB514\uC790\uC778 \xA9\xA02026 <INSERTLINK_WASHIMUMU> & <INSERTLINK_WUMPWOAST>.`,
    "ne": `\u092F\u0926\u093F \u0924\u092A\u093E\u0908\u0902 \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u092E\u0928 \u092A\u0930\u093E\u0909\u0928\u0941\u0939\u0941\u0928\u094D\u091B, \u0915\u0943\u092A\u092F\u093E <INSERTLINK_RPN> \u0938\u093E\u0925\u0948 \u0924\u092A\u093E\u0908\u0902\u0915\u094B \u0938\u094D\u0925\u093E\u0928\u0940\u092F \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E\u0932\u093E\u0908 \u0938\u092E\u0930\u094D\u0925\u0928 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964 
           <INSERTLINK_RPF> \u092A\u094D\u0930\u094B\u091C\u0947\u0915\u094D\u091F\u0915\u094B \u0935\u0902\u0936 \u0921\u093E\u091F\u093E \u0936\u093F\u0937\u094D\u091F\u093E\u091A\u093E\u0930, \u0924\u0930 \u092E\u093F\u0921\u093F\u092F\u093E \u092F\u0938\u0915\u094B \u0938\u093F\u0930\u094D\u091C\u0928\u093E\u0915\u0930\u094D\u0924\u093E\u0939\u0930\u0942\u0915\u094B \u0938\u092E\u094D\u092A\u0924\u094D\u0924\u093F \u0930\u0939\u0928\u094D\u091B\u0964 \u0932\u0947\u0906\u0909\u091F \u0930 \u0921\u093F\u091C\u093E\u0907\u0928 \u092A\u094D\u0930\u0924\u093F\u0932\u093F\u092A\u093F 
           \u0905\u0927\u093F\u0915\u093E\u0930 \u0968\u0966\u0968\u096C <INSERTLINK_WASHIMUMU> \u0930 <INSERTLINK_WUMPWOAST> \u0926\u094D\u0935\u093E\u0930\u093E\u0964`,
    "pt": `Se voc\xEA ama pandas-vermelhos, por favor apoie a <INSERTLINK_RPN> bem como seus zool\xF3gicos 
           locais. Dados de linhagem s\xE3o uma cortesia do projeto <INSERTLINK_RPF>, mas as m\xEDdias linkadas 
           seguem sendo propriedade de seus criadores. Design \xA9\xA02026 <INSERTLINK_WASHIMUMU> e 
           <INSERTLINK_WUMPWOAST>.`,
    "zh": `\u5982\u679C\u4F60\u559C\u7231\u5C0F\u718A\u732B\uFF0C\u8BF7\u652F\u6301\u5C0F\u718A\u732B\u7F51\u7EDC\uFF08<INSERTLINK_RPN>\uFF09\u4EE5\u53CA\u4F60\u5F53\u5730\u7684\u52A8\u7269\u56ED\u3002\u65CF\u8C31\u6570\u636E\u5F52\u5C5E\u4E8E<INSERTLINK_RPF>
           \u4F46\u76F8\u5173\u5A92\u4ECB\u5185\u5BB9\uFF08\u5982\u56FE\u7247\u7B49\uFF09\u7248\u6743\u5F52\u5C5E\u4E8E\u539F\u4F5C\u8005\u3002\u5E03\u5C40\u4E0E\u8BBE\u8BA1\xA92026<INSERTLINK_WASHIMUMU>\u548C<INSERTLINK_WUMPWOAST>`
  },
  // TODO-UI: translate ja, ne, zh
  "found_animal": {
    "en": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME> has been found and is safe!`,
    "es": `${Emoji.flower} ${Emoji.see_and_say} \xA1<INSERTNAME> ha sido encontrado y est\xE1 a salvo!`,
    "ja": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME> has been found and is safe!`,
    "ko": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME>\uC774(\uAC00) \uBC1C\uACAC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`,
    "ne": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME> has been found and is safe!`,
    "pt": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME> foi encontrado(a) e est\xE1 a salvo!`,
    "zh": `${Emoji.flower} ${Emoji.see_and_say} <INSERTNAME> has been found and is safe!`
  },
  "goodbye": {
    "en": `Good-bye, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "es": `Hasta siempre, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "ja": `\u3042\u308A\u304C\u3068\u3046, <INSERTNAME>\u3002${Emoji.died}\uFF08<INSERTBIRTH> \u2014 <INSERTDEATH>\uFF09`,
    "ko": `\uC548\uB155... \uC798 \uAC00,<INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "ne": `\u0935\u093F\u0926\u093E\u0908, <INSERTNAME> ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "pt": `Adeus, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "zh": `\u540E\u4F1A\u6709\u671F, <INSERTNAME>\u3002${Emoji.died}\uFF08<INSERTBIRTH> \u2014 <INSERTDEATH>\uFF09`
  },
  "happy_birthday": {
    "en": `${Emoji.birthday} Happy Birthday, <INSERTNAME>! (<INSERTNUMBER>)`,
    "es": `${Emoji.birthday} \xA1Feliz cumplea\xF1os, <INSERTNAME>! (<INSERTNUMBER>)`,
    "ja": `${Emoji.birthday} <INSERTNAME>\u3001\u8A95\u751F\u65E5\u304A\u3081\u3067\u3068\u3046\uFF01\uFF08<INSERTNUMBER>\u6B73\uFF09`,
    "ko": `${Emoji.birthday} <INSERTNAME>\uC758 \uC0DD\uC77C\uC744 \uCD95\uD558\uD569\uB2C8\uB2E4! (<INSERTNUMBER>\uC138)`,
    "ne": `${Emoji.birthday} \u091C\u0928\u094D\u092E\u0926\u093F\u0928\u0915\u094B \u0936\u0941\u092D\u0915\u093E\u092E\u0928\u093E, <INSERTNAME>! (<INSERTNUMBER>)`,
    "pt": `${Emoji.birthday} Feliz anivers\xE1rio, <INSERTNAME>! (<INSERTNUMBER>)`,
    "zh": `${Emoji.birthday} <INSERTNAME>\u751F\u65E5\u5FEB\u4E50\uFF01\uFF08<INSERTNUMBER>\u5C81\uFF09`
  },
  "landing_mothersday": {
    "en": "Happy Mother\u2019s Day!",
    "es": "\xA1Feliz D\xEDa de la Madre!",
    "ja": "\u6BCD\u306E\u65E5\u304A\u3081\u3067\u3068\u3046",
    "ko": "\uC5B4\uBA38\uB2C8\uC758 \uB0A0!",
    "ne": "\u0916\u0941\u0938\u0940 \u0906\u092E\u093E\u0915\u094B \u0926\u093F\u0928!",
    "pt": "Feliz Dia das M\xE3es!",
    "zh": "\u6BCD\u4EB2\u8282\u5FEB\u4E50"
  },
  "list_comma": {
    "en": ", ",
    "es": ", ",
    "ja": "\u3001",
    "ko": ", ",
    "ne": ", ",
    "pt": ", ",
    "zh": "\u3001"
  },
  // TODO-UI: translate ja ko ne zh values
  "lost_animal": {
    "en": `${Emoji.alert} ${Emoji.see_and_say} If you see <INSERTNAME>, contact <ZOONAME>: <ZOOCONTACT>`,
    "es": `${Emoji.alert} ${Emoji.see_and_say} Si ves a <INSERTNAME> contact a <ZOONAME>: <ZOOCONTACT>`,
    "ja": `${Emoji.alert} ${Emoji.see_and_say} If you see <INSERTNAME>, contact <ZOONAME>: <ZOOCONTACT>`,
    "ko": `${Emoji.alert} ${Emoji.see_and_say} If you see <INSERTNAME>, contact <ZOONAME>: <ZOOCONTACT>`,
    "ne": `${Emoji.alert} ${Emoji.see_and_say} If you see <INSERTNAME>, contact <ZOONAME>: <ZOOCONTACT>`,
    "pt": `${Emoji.alert} ${Emoji.see_and_say} Se vir <INSERTNAME>, contacte <ZOONAME>: <ZOOCONTACT>`,
    "zh": `${Emoji.alert} ${Emoji.see_and_say} If you see <INSERTNAME>, contact <ZOONAME>: <ZOOCONTACT>`
  },
  "lunch_time": {
    "en": `${Emoji.paws} What's for lunch? ${Emoji.greens}`,
    "es": `${Emoji.paws} \xBFQu\xE9 hay de comer? ${Emoji.greens}`,
    "ja": `${Emoji.paws} \u663C\u98DF\u306F\u4F55\u3067\u3059\u304B\uFF1F ${Emoji.greens}`,
    "ko": `${Emoji.paws} \uC624\uB298 \uC810\uC2EC \uBA54\uB274\uB294 \uBB34\uC5C7\uC778\uAC00\uC694? ${Emoji.greens}`,
    "ne": `${Emoji.paws} \u0916\u093E\u091C\u093E\u0915\u094B \u0932\u093E\u0917\u093F \u0915\u0947 \u0939\u094B? ${Emoji.greens}`,
    "pt": `${Emoji.paws} O que tem para o almo\xE7o? ${Emoji.greens}`,
    "zh": `${Emoji.paws} \u5348\u996D\u5403\u4EC0\u4E48\uFF1F ${Emoji.greens}`
  },
  "missing_you": {
    "en": `We miss you, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "es": `Te extra\xF1amos, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "ja": `\u3042\u306A\u305F\u304C\u3044\u306A\u304F\u3066\u3068\u3066\u3082\u5BC2\u3057\u3044, <INSERTNAME>\u3002${Emoji.died}\uFF08<INSERTBIRTH> \u2014 <INSERTDEATH>\uFF09`,
    "ko": `\uBCF4\uACE0 \uC2F6\uC5B4, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "ne": `\u0939\u093E\u092E\u0940 \u0924\u093F\u092E\u0940\u0932\u093E\u0908 \u0938\u092E\u094D\u091D\u093F\u0928\u094D\u091B\u094C\u0902 <INSERTNAME> ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "pt": `Saudades de voc\xEA, <INSERTNAME>. ${Emoji.died} (<INSERTBIRTH> \u2014 <INSERTDEATH>)`,
    "zh": `\u6211\u4EEC\u60F3\u4F60, <INSERTNAME>\u3002${Emoji.died}\uFF08<INSERTBIRTH> \u2014 <INSERTDEATH>\uFF09`
  },
  // TODO-UI: crunch newlines and space
  "nearby_zoos": {
    "en": `${Emoji.website} ${Emoji.home} Finding nearby zoos. If geolocation fails, try 
           searching for your city.`,
    "es": `${Emoji.website} ${Emoji.home} Encontrar zool\xF3gicos cercanos. Si la 
           geolocalizaci\xF3n falla, intente buscar su ciudad.`,
    "ja": `${Emoji.website} ${Emoji.home} \u8FD1\u304F\u306E\u52D5\u7269\u5712\u3092\u898B\u4E0A\u3052\u307E\u3059\u3002\u30B8\u30AA\u30ED\u30B1\u30FC\u30B7\u30E7\u30F3\u304C\u5931\u6557\u3057\u305F\u5834\u5408\u306F\u3001
           \u90FD\u5E02\u3092\u691C\u7D22\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002`,
    "ko": `${Emoji.website} ${Emoji.home} \uAC00\uAE4C\uC6B4 \uB3D9\uBB3C\uC6D0\uC744 \uCC3E\uACE0 \uC788\uC5B4\uC694. \uC704\uCE58 \uC815\uBCF4\uAC00 \uC2E4\uD328\uD558\uBA74, 
           \uB3C4\uC2DC \uC774\uB984\uC73C\uB85C \uAC80\uC0C9\uD574\uBCF4\uC138\uC694.`,
    "ne": `${Emoji.website} ${Emoji.home} \u0928\u091C\u093F\u0915\u0915\u093E \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E\u0939\u0930\u0942 \u092D\u0947\u091F\u094D\u091F\u093E\u0909\u0901\u0926\u0948\u0964 \u092F\u0926\u093F \u092D\u094C\u0917\u094B\u0932\u093F\u0915 \u0938\u094D\u0925\u093E\u0928 \u0905\u0938\u092B\u0932 \u092D\u092F\u094B \u092D\u0928\u0947, 
           \u0906\u092B\u094D\u0928\u094B \u0936\u0939\u0930\u0915\u094B \u0932\u093E\u0917\u093F \u0916\u094B\u091C\u0940 \u092A\u094D\u0930\u092F\u093E\u0938 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D\u0964`,
    "pt": `${Emoji.website} ${Emoji.home} Procurando zool\xF3gicos pr\xF3ximos. Se a geolocaliza\xE7\xE3o 
           falhar, tente pesquisar sua cidade.`,
    "zh": `${Emoji.website} ${Emoji.home} \u67E5\u627E\u9644\u8FD1\u7684\u52A8\u7269\u56ED\u3002\u5982\u679C\u5730\u7406\u4F4D\u7F6E\u5931\u8D25\uFF0C\u8BF7\u5C1D\u8BD5\u641C\u7D22\u60A8\u7684\u57CE\u5E02\u3002`
  },
  "new_content_contributors": {
    "en": `${Emoji.giftwrap} <INSERTCOUNT> new contributors`,
    "es": `${Emoji.giftwrap} <INSERTCOUNT> nuevos contribuyentes`,
    "ja": `${Emoji.giftwrap} <INSERTCOUNT>\u4EBA\u306E\u65B0\u3057\u3044\u8CA2\u732E\u8005`,
    "ko": `${Emoji.giftwrap} <INSERTCOUNT>\uC0C8 \uAE30\uC5EC\uC790`,
    "ne": `${Emoji.giftwrap} <INSERTCOUNT> \u092F\u094B\u0917\u0926\u093E\u0928\u0915\u0930\u094D\u0924\u093E\u0939\u0930\u0942 \u0928\u092F\u093E\u0901`,
    "pt": `${Emoji.giftwrap} <INSERTCOUNT> novos contribuintes`,
    "zh": `${Emoji.giftwrap} <INSERTCOUNT>\u65B0\u8D21\u732E\u8005`
  },
  "new_content_pandas": {
    "en": `${Emoji.profile} <INSERTCOUNT> new red pandas`,
    "es": `${Emoji.profile} <INSERTCOUNT> nuevos pandas rojos`,
    "ja": `${Emoji.profile} <INSERTCOUNT>\u3064\u306E\u65B0\u3057\u3044\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0`,
    "ko": `${Emoji.profile} <INSERTCOUNT>\uC0C8\uB85C\uC6B4 \uB808\uC11C\uD310\uB2E4\uAC00 \uCC3E\uC544\uC654\uC5B4\uC694`,
    "ne": `${Emoji.profile} <INSERTCOUNT> \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u0928\u092F\u093E\u0901`,
    "pt": `${Emoji.profile} <INSERTCOUNT> novos pandas-vermelhos`,
    "zh": `${Emoji.profile} <INSERTCOUNT>\u53EA\u65B0\u5C0F\u718A\u732B`
  },
  "new_content_photos": {
    "en": `<INSERTCOUNT> new photos`,
    "es": `<INSERTCOUNT> fotos nuevas `,
    "ja": `<INSERTCOUNT>\u679A\u306E\u65B0\u3057\u3044\u5199\u771F`,
    "ko": `<INSERTCOUNT>\uC7A5\uC758 \uC0C8\uB85C\uC6B4 \uC0AC\uC9C4`,
    "ne": `<INSERTCOUNT> \u091B\u0935\u093F \u0928\u092F\u093E\u0901`,
    "pt": `<INSERTCOUNT> novas fotos`,
    "zh": `<INSERTCOUNT>\u5F20\u65B0\u7167\u7247`
  },
  "new_content_suffix": {
    "en": ` this week!`,
    "es": ` esta semana.`,
    "ja": `\u4ECA\u9031\uFF01`,
    "ko": ` \uC774\uBC88 \uC8FC\uC5D0 \uCD94\uAC00\uB428!`,
    "ne": `\u092F\u094B \u0939\u092A\u094D\u0924\u093E`,
    "pt": ` esta semana!`,
    "zh": `\u672C\u661F\u671F\uFF01`
  },
  "new_content_zoos": {
    "en": `${Emoji.zoo} <INSERTCOUNT> new zoos`,
    "es": `${Emoji.zoo} <INSERTCOUNT> nuevos zool\xF3gicos`,
    "ja": `${Emoji.zoo}<INSERTCOUNT>\u3064\u306E\u65B0\u3057\u3044\u52D5\u7269\u5712`,
    "ko": `${Emoji.zoo} <INSERTCOUNT>\uC0C8\uB85C\uC6B4 \uB3D9\uBB3C\uC6D0`,
    "ne": `${Emoji.zoo} <INSERTCOUNT> \u0928\u092F\u093E\u0901 \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E`,
    "pt": `${Emoji.zoo} <INSERTCOUNT> novos zool\xF3gicos`,
    "zh": `${Emoji.zoo} <INSERTCOUNT>\u4E2A\u65B0\u52A8\u7269\u56ED`
  },
  "no_result": {
    "en": `No Pandas Found`,
    "es": `No Se Encontr\xF3 Ning\xFAn Panda`,
    "ja": `\u30D1\u30F3\u30C0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`,
    "ko": `\uAC80\uC0C9\uB41C \uB808\uC11C\uD310\uB2E4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.`,
    "ne": `\u0915\u0941\u0928\u0948 \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928`,
    "pt": `Nenhum panda encontrado`,
    "zh": `\u6CA1\u6709\u627E\u5230\u8FD9\u53EA\u5C0F\u718A\u732B`
  },
  "no_group_media_result": {
    "en": `No Group Photos Found`,
    "es": `No Se Encontraron Fotos de Grupos`,
    "ja": `\u96C6\u5408\u5199\u771F\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F`,
    "ko": `\uAC80\uC0C9\uB41C \uC0AC\uC9C4\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`,
    "ne": `\u0915\u0941\u0928\u0948 \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u0938\u092E\u0942\u0939 \u092D\u0947\u091F\u093F\u090F\u0928`,
    "pt": `Nenhuma foto de grupo encontrada`,
    "zh": `\u627E\u4E0D\u5230\u5408\u5F71`
  },
  "no_subject_tag_result": {
    "en": `No Tagged Photos`,
    "es": `Sin Fotos Etiquetadas`,
    "ja": `\u3053\u306E\u30D1\u30F3\u30C0\u306E\u30BF\u30B0\u4ED8\u3051\u3055\u308C\u305F\u5199\u771F\u306F\u3042\u308A\u307E\u305B\u3093`,
    "ko": `\uD0DC\uADF8\uB41C \uC0AC\uC9C4\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`,
    "ne": `\u0915\u0941\u0928\u0948 \u092B\u094B\u091F\u094B\u0939\u0930\u0942 \u091F\u094D\u092F\u093E\u0917 \u091B\u0948\u0928\u0928\u094D`,
    "pt": `Nenhuma foto etiquetada`,
    "zh": `\u6CA1\u6709\u5173\u8054\u7167\u7247`
  },
  "no_zoos_nearby": {
    "en": `No Zoos Nearby`,
    "es": `No Hay Zool\xF3gicos Cerca`,
    "ja": `\u8FD1\u304F\u306B\u52D5\u7269\u5712\u306F\u3042\u308A\u307E\u305B\u3093`,
    "ko": `\uAC80\uC0C9\uB41C \uB3D9\uBB3C\uC6D0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.`,
    "ne": `\u0928\u091C\u093F\u0915\u0948 \u0915\u0941\u0928\u0948 \u091A\u093F\u0921\u093F\u092F\u093E\u0916\u093E\u0928\u093E \u091B\u0948\u0928`,
    "pt": `Nenhum zool\xF3gico pr\xF3ximo`,
    "zh": `\u9644\u8FD1\u6CA1\u6709\u52A8\u7269\u56ED`
  },
  // TODO-UI: determine if leading space is needed
  "overflow": {
    "en": ` First <INSERTLIMIT> shown.`,
    "es": ` Se muestran los primeros <INSERTLIMIT>.`,
    "ja": `\u6700\u521D\u306E<INSERTLIMIT>\u3092\u8868\u793A`,
    "ko": `\uCC98\uC74C<INSERTLIMIT>\uAC1C\uB9CC \uD45C\uC2DC\uB429\uB2C8\uB2E4.`,
    "ne": ` <INSERTLIMIT> \u092E\u093E\u0924\u094D\u0930`,
    "pt": ` Mostrando os primeiros <INSERTLIMIT>.`,
    "zh": `\u663E\u793A\u524D<INSERTLIMIT>\u4E2A`
  },
  "profile_babies_children": {
    "en": `<INSERTNAME> has <INSERTBABIES> children.`,
    "es": `<INSERTNAME> tiene <INSERTBABIES> beb\xE9s.`,
    "ja": `<INSERTNAME>\u306E\u5B50\u4F9B<INSERTBABIES>\u4EBA`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTBABIES>\uB9C8\uB9AC\uC758 \uADC0\uC5EC\uC6B4 \uC790\uB140\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u0915\u094B <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941 \u091B\u0928\u094D`,
    "pt": `<INSERTNAME> tem <INSERTBABIES> filhos(as).`,
    "zh": `<INSERTNAME>\u6709<INSERTBABIES>\u4E2A\u5B69\u5B50`
  },
  "profile_babies_siblings": {
    "en": `<INSERTNAME> has <INSERTBABIES> baby siblings.`,
    "es": `<INSERTNAME> tiene <INSERTBABIES> hermanos peque\xF1os.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTBABIES>\u4EBA\u306E\u8D64\u3061\u3083\u3093\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTBABIES>\uB9C8\uB9AC\uC758 \uD615\uC81C\xB7\uC790\uB9E4\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0915\u093E \u092D\u093E\u0908 \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942 \u091B\u0928\u094D`,
    "pt": `<INSERTNAME> tem <INSERTBABIES> irm\xE3os(\xE3s) beb\xEAs.`,
    "zh": `<INSERTNAME>\u6709<INSERTBABIES>\u4E2A\u5B69\u5B50`
  },
  "profile_brothers": {
    "en": `<INSERTNAME> has <INSERTBROTHERS> brothers.`,
    "es": `<INSERTNAME> tiene <INSERTBROTHERS> hermanos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTBROTHERS>\u4EBA\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTBROTHERS>\uB9C8\uB9AC\uC758 \uD615\uC81C\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTBROTHERS> \u092D\u093E\u0907\u0939\u0930\u0941`,
    "pt": `<INSERTNAME> tem <INSERTBROTHERS> irm\xE3os.`,
    "zh": `<INSERTNAME>\u6709<INSERTBROTHERS>\u4E2A\u5144\u5F1F`
  },
  "profile_brothers_babies": {
    "en": `<INSERTNAME> has <INSERTBROTHERS> brothers and <INSERTBABIES> newborn siblings.`,
    "es": `<INSERTNAME> tiene <INSERTBROTHERS> hermanos y <INSERTBABIES> hermanitos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTBROTHERS>\u4EBA\u306E\u5144\u5F1F\u3068<INSERTBABIES>\u4EBA\u306E\u8D64\u3061\u3083\u3093\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTBROTHERS>\uB9C8\uB9AC\uC758 \uD615\uC81C\uC640 <INSERTBABIES>\uB9C8\uB9AC\uC758 \uC544\uAE30\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTBROTHERS> \u092D\u093E\u0907\u0939\u0930\u0941 \u0930 <INSERTBABIES> \u0928\u0935\u091C\u093E\u0924 \u0936\u093F\u0936\u0941\u0939\u0930\u0942`,
    "pt": `<INSERTNAME> tem <INSERTBROTHERS> irm\xE3os e <INSERTBABIES> irm\xE3os(\xE3s) beb\xEAs.`,
    "zh": `<INSERTNAME>\u6709<INSERTBROTHERS>\u4E2A\u59D0\u59B9<INSERTBABIES>\u4E2A\u65B0\u751F\u513F`
  },
  "profile_children": {
    "en": `<INSERTNAME> has <INSERTTOTAL> children: <INSERTDAUGHTERS> girls and <INSERTSONS> boys!`,
    "es": `<INSERTNAME> tiene <INSERTTOTAL> hijos: <INSERTDAUGHTERS> ni\xF1as y <INSERTSONS> ni\xF1os.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTTOTAL>\u4EBA\u306E\u5B50\u4F9B\u304C\u3044\u307E\u3059\uFF1A<INSERTDAUGHTERS>\u4EBA\u306E\u5973\u306E\u5B50\u3068<INSERTSONS>\u4EBA\u306E\u7537\u306E\u5B50`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 \uCD1D <INSERTTOTAL>\uB9C8\uB9AC\uC758 \uC790\uB140\uAC00 \uC788\uC5B4\uC694. <INSERTDAUGHTERS>\uB9C8\uB9AC\uC758 \uB538, 
           <INSERTSONS>\uB9C8\uB9AC\uC758 \uC544\uB4E4\uC774 \uC788\uC5B4\uC694!`,
    "ne": `<INSERTNAME> \u091B <INSERTTOTAL> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941: <INSERTDAUGHTERS> \u091B\u094B\u0930\u0940\u0939\u0930\u0942 \u0930 <INSERTSONS> \u091B\u094B\u0930\u093E\u0939\u0930\u0942!`,
    "pt": `<INSERTNAME> tem <INSERTTOTAL> filhos: <INSERTDAUGHTERS> meninas e <INSERTSONS> meninos!`,
    "zh": `<INSERTNAME>\u4E00\u5171\u6709<INSERTTOTAL>\u4E2A\u5B69\u5B50: <INSERTDAUGHTERS>\u4E2A\u5973\u513F\u548C<INSERTSONS>\u4E2A\u513F\u5B50\uFF01`
  },
  "profile_children_babies": {
    "en": `<INSERTNAME> has <INSERTTOTAL> children: <INSERTDAUGHTERS> girls, <INSERTSONS> boys, 
           and <INSERTBABIES> newborns!`,
    "es": `<INSERTNAME> tiene <INSERTTOTAL> hijos: <INSERTDAUGHTERS> ni\xF1as, <INSERTSONS> ni\xF1os, 
           y <INSERTBABIES> reci\xE9n nacidos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTTOTAL>\u4EBA\u306E\u5B50\u4F9B\u304C\u3044\u307E\u3059\uFF1A<INSERTDAUGHTERS>\u4EBA\u306E\u5973\u306E\u5B50\u3068\u3001
           <INSERTSONS>\u4EBA\u306E\u7537\u306E\u5B50\u3001\u304A\u3088\u3073<INSERTBABIES>\u4EBA\u306E\u5B50\u4F9B`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 \uCD1D <INSERTTOTAL>\uB9C8\uB9AC\uC758 \uC790\uB140\uAC00 \uC788\uC5B4\uC694: <INSERTDAUGHTERS>\uB9C8\uB9AC\uC758 \uB538, 
           <INSERTSONS>\uB9C8\uB9AC\uC758 \uC544\uB4E4, \uADF8\uB9AC\uACE0 <INSERTBABIES>\uB9C8\uB9AC\uC758 \uAC13 \uD0DC\uC5B4\uB09C \uC544\uAE30\uC608\uC694!`,
    "ne": `<INSERTNAME> \u091B <INSERTTOTAL> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941: <INSERTDAUGHTERS> \u091B\u094B\u0930\u0940\u0939\u0930\u0942, <INSERTSONS> \u091B\u094B\u0930\u093E\u0939\u0930\u0942 \u0930 
           <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941!`,
    "pt": `<INSERTNAME> tem <INSERTTOTAL> filhos: <INSERTDAUGHTERS> meninas, <INSERTSONS> 
           meninos e <INSERTBABIES> rec\xE9m-nascidos(as)!`,
    "zh": `<INSERTNAME>\u4E00\u5171\u6709<INSERTTOTAL>\u4E2A\u5B69\u5B50: <INSERTDAUGHTERS>\u4E2A\u5973\u513F\uFF0C<INSERTSONS>\u4E2A\u513F\u5B50\uFF0C
          \u4EE5\u53CA<INSERTBABIES>\u4E2A\u65B0\u751F\u513F\uFF01`
  },
  "profile_daughters": {
    "en": `<INSERTNAME> has <INSERTDAUGHTERS> daughters.`,
    "es": `<INSERTNAME> tiene <INSERTDAUGHTERS> ni\xF1as.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTDAUGHTERS>\u4EBA\u306E\u5A18\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTDAUGHTERS>\uB9C8\uB9AC\uC758 \uB538\uC774 \uC788\uC5B4\uC694!`,
    "ne": `<INSERTNAME> \u091B <INSERTDAUGHTERS> \u091B\u094B\u0930\u0940\u0939\u0930\u0942`,
    "pt": `<INSERTNAME> tem <INSERTDAUGHTERS> filhas.`,
    "zh": `<INSERTNAME>\u6709<INSERTDAUGHTERS>\u4E2A\u5973\u513F`
  },
  "profile_daughters_babies": {
    "en": `<INSERTNAME> has <INSERTDAUGHTERS> daughters and <INSERTBABIES> newborns!`,
    "es": `<INSERTNAME> tiene <INSERTDAUGHTERS> ni\xF1as y <INSERTBABIES> reci\xE9n nacidos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTDAUGHTERS>\u4EBA\u306E\u5A18\u3068<INSERTBABIES>\u4EBA\u306E\u5B50\u4F9B\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTDAUGHTERS>\uB9C8\uB9AC\uC758 \uB538\uACFC, <INSERTBABIES>\uB9C8\uB9AC\uC758 \uAC13 \uD0DC\uC5B4\uB09C \uC544\uAE30\uAC00 \uC788\uC5B4\uC694!`,
    "ne": `<INSERTNAME> \u091B <INSERTDAUGHTERS> \u091B\u094B\u0930\u0940\u0939\u0930\u0942 \u0930 <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941`,
    "pt": `<INSERTNAME> tem <INSERTDAUGHTERS> filhas e <INSERTBABIES> rec\xE9m-nascidos(as)!`,
    "zh": `<INSERTNAME>\u6709<INSERTDAUGHTERS>\u4E2A\u5973\u513F\u548C<INSERTBABIES>\u4E2A\u65B0\u751F\u513F\uFF01`
  },
  "profile_family": {
    "en": `<INSERTNAME>\u2019s Immediate Family`,
    "es": `Familia inmediata de <INSERTNAME>`,
    "ja": `<INSERTNAME>\u306E\u76F4\u8FD1\u306E\u5BB6\u65CF`,
    "ko": `<INSERTNAME>\uC758 \uC9C1\uACC4 \uAC00\uC871`,
    "ne": `<INSERTNAME>\u0915\u094B \u0928\u093F\u0915\u091F \u092A\u0930\u093F\u0935\u093E\u0930`,
    "pt": `Fam\xEDlia imediata de <INSERTNAME>`,
    "zh": `<INSERTNAME>\u7684\u76F4\u7CFB\u4EB2\u5C5E`
  },
  "profile_sisters": {
    "en": `<INSERTNAME> has <INSERTSISTERS> sisters.`,
    "es": `<INSERTNAME> tiene <INSERTSISTERS> hermanas`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTSISTERS>\u306E\u59C9\u59B9\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC5D0\uAC8C\uB294 <INSERTSISTERS>\uB9C8\uB9AC\uC758 \uC790\uB9E4\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTSISTERS> \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942`,
    "pt": `<INSERTNAME> tem <INSERTSISTERS> irm\xE3s.`,
    "zh": `<INSERTNAME>\u6709<INSERTSISTERS>\u4E2A\u59D0\u59B9`
  },
  "profile_sisters_babies": {
    "en": `<INSERTNAME> has <INSERTSISTERS> sisters and <INSERTBABIES> newborn siblings.`,
    "es": `<INSERTNAME> tiene <INSERTSISTERS> hermanas y <INSERTBABIES> hermanitos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTSISTERS>\u306E\u59C9\u59B9\u3068<INSERTBABIES>\u4EBA\u306E\u8D64\u3061\u3083\u3093\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC740(\uB294) <INSERTSISTERS>\uC790\uB9E4\uC640 <INSERTBABIES>\uC544\uC774\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTSISTERS> \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942 \u0930 <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E \u092D\u093E\u0908 \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942`,
    "pt": `<INSERTNAME> tem <INSERTSISTERS> irm\xE3s e <INSERTBABIES> irm\xE3os(\xE3s) beb\xEAs.`,
    "zh": `<INSERTNAME>\u6709<INSERTSISTERS>\u4E2A\u59D0\u59B9\u548C<INSERTBABIES>\u4E2A\u65B0\u751F\u513F`
  },
  "profile_siblings": {
    "en": `<INSERTNAME> has <INSERTTOTAL> siblings: <INSERTSISTERS> sisters and 
           <INSERTBROTHERS> brothers!`,
    "es": `\xA1<INSERTNAME> tiene <INSERTTOTAL> hermanos: <INSERTSISTERS> hembras y 
           <INSERTBROTHERS> machos!`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTTOTAL>\u4EBA\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059\u3002<INSERTSISTERS>\u4EBA\u306E\u59C9\u59B9\u3068<INSERTBROTHERS>\u4EBA\u306E\u5144\u5F1F`,
    "ko": `<INSERTNAME>\uC740(\uB294) <INSERTTOTAL>\uD615\uC81C\xB7\uC790\uB9E4, <INSERTSISTERS>\uC790\uB9E4\uC640 <INSERTBROTHERS>\uD615\uC81C\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTTOTAL> \u092D\u093E\u0907\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942: <INSERTSISTERS> \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942 \u0930 <INSERTBROTHERS> \u092D\u093E\u0907\u0939\u0930\u0941`,
    "pt": `<INSERTNAME> tem <INSERTTOTAL> irm\xE3os: <INSERTSISTERS> f\xEAmeas e <INSERTBROTHERS> machos!`,
    "zh": `<INSERTNAME>\u6709<INSERTTOTAL>\u4E2A\u540C\u80DE: <INSERTSISTERS>\u4E2A\u59D0\u59B9\u548C<INSERTBROTHERS>\u4E2A\u5144\u5F1F\uFF01`
  },
  // TODO-UI: make the Korean consistent with the others
  "profile_siblings_babies": {
    "en": `<INSERTNAME> has <INSERTTOTAL> siblings: <INSERTSISTERS> sisters, <INSERTBROTHERS> 
           brothers, and <INSERTBABIES> newborn siblings!`,
    "es": `\xA1<INSERTNAME> tiene <INSERTTOTAL> hermanos: <INSERTSISTERS> hembras, <INSERTBROTHERS>
           machos, y <INSERTBABIES> hermanitos!`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTTOTAL>\u4EBA\u306E\u5144\u5F1F\u304C\u3044\u307E\u3059\uFF1A<INSERTSISTERS>\u4EBA\u306E\u59C9\u59B9\u3001<INSERTBROTHERS>
           \u4EBA\u306E\u5144\u5F1F\u3001\u304A\u3088\u3073<INSERTBABIES>\u4EBA\u306E\u8D64\u3061\u3083\u3093\u306E\u5144\u5F1F`,
    "ko": `<INSERTNAME>\uC740(\uB294) <INSERTTOTAL>\uD615\uC81C\xB7 \uC790\uB9E4\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTTOTAL> \u092D\u093E\u0907\u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942: <INSERTSISTERS> \u092C\u0939\u093F\u0928\u0940\u0939\u0930\u0942, <INSERTBROTHERS> \u092D\u093E\u0907\u0939\u0930\u0941 \u0930 
           <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941!`,
    "pt": `<INSERTNAME> tem <INSERTTOTAL> irm\xE3os: <INSERTSISTERS> f\xEAmeas, <INSERTBROTHERS> 
           machos e <INSERTBABIES> irm\xE3os(\xE3s) beb\xEAs!`,
    "zh": `<INSERTNAME>\u6709<INSERTTOTAL>\u4E2A\u540C\u80DE\uFF1A<INSERTSISTERS>\u4E2A\u59D0\u59B9\uFF0C<INSERTBROTHERS>\u4E2A\u5144\u5F1F\uFF0C\u4EE5\u53CA
           <INSERTBABIES>\u4E2A\u65B0\u751F\u513F\uFF01`
  },
  "profile_sons": {
    "en": `<INSERTNAME> has <INSERTSONS> sons.`,
    "es": `<INSERTNAME> tiene <INSERTSONS> ni\xF1os.`,
    "ja": `<INSERTNAME>\u306E\u606F\u5B50\u306F<INSERTSONS>\u4EBA\u3067\u3059`,
    "ko": `<INSERTNAME>\uC740(\uB294) <INSERTSONS>\uB0A8\uC790 \uC544\uC774\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTSONS> \u091B\u094B\u0930\u093E\u0939\u0930\u0942`,
    "pt": `<INSERTNAME> tem <INSERTSONS> filhos.`,
    "zh": `<INSERTNAME>\u6709<INSERTSONS>\u4E2A\u513F\u5B50`
  },
  "profile_sons_babies": {
    "en": `<INSERTNAME> has <INSERTSONS> sons and <INSERTBABIES> newborns!`,
    "es": `<INSERTNAME> tiene <INSERTSONS> ni\xF1os y <INSERTBABIES> reci\xE9n nacidos.`,
    "ja": `<INSERTNAME>\u306B\u306F<INSERTSONS>\u4EBA\u306E\u606F\u5B50\u3068<INSERTBABIES>\u4EBA\u306E\u5B50\u4F9B\u304C\u3044\u307E\u3059`,
    "ko": `<INSERTNAME>\uC740(\uB294) <INSERTSONS>\uB0A8\uC790 \uC544\uC774\uC640 <INSERTBABIES>\uC544\uC774\uAC00 \uC788\uC5B4\uC694.`,
    "ne": `<INSERTNAME> \u091B <INSERTSONS> \u091B\u094B\u0930\u093E\u0939\u0930\u0942 \u0930 <INSERTBABIES> \u092C\u091A\u094D\u091A\u093E\u0939\u0930\u0941!`,
    "pt": `<INSERTNAME> tem <INSERTSONS> filhos e <INSERTBABIES> rec\xE9m-nascidos(as)!`,
    "zh": `<INSERTNAME>\u6709<INSERTSONS>\u4E2A\u513F\u5B50\u548C<INSERTBABIES>\u4E2A\u65B0\u751F\u513F\uFF01`
  },
  "profile_where": {
    "en": `Where has <INSERTNAME> lived?`,
    "es": `Donde ha vivido <INSERTNAME>?`,
    "ja": `<INSERTNAME>\u306F\u3069\u3053\u306B\u4F4F\u3093\u3067\u3044\u307E\u3057\u305F\u304B\uFF1F`,
    "ko": `<INSERTNAME>\uC740(\uB294) \uC5B4\uB514\uC5D0\uC11C \uC0AC\uB098\uC694?`,
    "ne": `<INSERTNAME> \u0915\u0939\u093E\u0901 \u092C\u0938\u094D\u092F\u094B?`,
    "pt": `Onde <INSERTNAME> j\xE1 morou?`,
    "zh": `<INSERTNAME>\u4F4F\u5728\u54EA\u91CC\uFF1F`
  },
  "remembering_you_together": {
    "en": `${Emoji.hearts} <INSERTNAMES>: We will never forget you. ${Emoji.paws}`,
    "es": `${Emoji.hearts} <INSERTNAMES>: Nosotros nunca te olvidaremos. ${Emoji.paws}`,
    "ja": `${Emoji.hearts} <INSERTNAMES>\u301C\u79C1\u305F\u3061\u306F\u541B\u3092\u6C7A\u3057\u3066\u5FD8\u308C\u307E\u305B\u3093\u3002${Emoji.paws}`,
    "ko": `${Emoji.hearts} <INSERTNAMES>: \uC6B0\uB9AC\uB294 \uB108\uB97C \uC808\uB300 \uC78A\uC9C0 \uC54A\uC744 \uAC70\uC57C. ${Emoji.paws}`,
    "ne": `${Emoji.hearts} <INSERTNAMES>: \u0939\u093E\u092E\u0940 \u0924\u093F\u092E\u0940\u0932\u093E\u0908 \u0915\u0939\u093F\u0932\u094D\u092F\u0948 \u092C\u093F\u0930\u094D\u0938\u093F\u0928\u0947 \u091B\u0948\u0928\u094C\u0902\u0964 ${Emoji.paws}`,
    "pt": `${Emoji.hearts} <INSERTNAMES>: Nunca esqueceremos de voc\xEA. ${Emoji.paws}`,
    "zh": `${Emoji.hearts} <INSERTNAMES>: \u6211\u4EEC\u6C38\u8FDC\u4E0D\u4F1A\u5FD8\u8BB0\u4F60\u3002${Emoji.paws}`
  },
  "shovel_pandas": {
    "en": `${Emoji.dig} Searching for buried treasure! ${Emoji.treasure}`,
    "es": `${Emoji.dig} \xA1Buscando tesoros enterrados! ${Emoji.treasure}`,
    "ja": `${Emoji.dig} \u57CB\u8535\u91D1\u3092\u63A2\u3059 ${Emoji.treasure}`,
    "ko": `${Emoji.dig} \uC228\uACA8\uC9C4 \uBCF4\uBB3C\uC744 \uCC3E\uACE0 \uC788\uC5B4\uC694! ${Emoji.treasure}`,
    "ne": `${Emoji.dig} \u0917\u093E\u0921\u093F\u090F\u0915\u094B \u0916\u091C\u093E\u0928\u093E \u0916\u094B\u091C\u0940 \u0917\u0930\u094D\u0926\u0948 ${Emoji.treasure}`,
    "pt": `${Emoji.dig} Procurando o tesouro enterrado! ${Emoji.treasure}`,
    "zh": `${Emoji.dig} \u5BFB\u627E\u57CB\u85CF\u7684\u5B9D\u85CF ${Emoji.treasure}`
  },
  "tag_combo": {
    "en": ` combo: <INSERTNUM> photos.`,
    "es": ` combo: <INSERTNUM> fotos.`,
    "ja": `\u30B3\u30F3\u30DC\u691C\u7D22:<INSERTNUM>\u5199\u771F\u3002`,
    "ko": `\uCF64\uBCF4 \uAC80\uC0C9:<INSERTNUM>\uC0AC\uC9C4.`,
    "ne": `\u0915\u092E\u094D\u092C\u094B: <INSERTNUM> \u092B\u094B\u091F\u094B\u0939\u0930\u0942`,
    "pt": ` combo: <INSERTNUM> fotos.`,
    "zh": `\u7EC4\u5408\u641C\u7D22:<INSERTNUM>\u76F8\u7247\u3002`
  },
  "tag_subject": {
    "en": `<INSERTNUM> <INSERTNAME> photos tagged <INSERTEMOJI> <INSERTTAG>.`,
    "es": `<INSERTNUM> fotos <INSERTNAME> etiquetadas con la palabra <INSERTTAG>.`,
    "ja": `<INSERTNUM>\u679A\u306E<INSERTNAME>\u306E<INSERTEMOJI><INSERTTAG>\u3002`,
    "ko": `<INSERTNUM>\uC7A5\uC758 <INSERTNAME> \uC0AC\uC9C4\uC774 <INSERTEMOJI> <INSERTTAG>\uC73C\uB85C(\uB85C) \uD0DC\uADF8\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
    "ne": `<INSERTNUM> <INSERTNAME> \u092B\u094B\u091F\u094B\u0939\u0930\u0942 \u091F\u094D\u092F\u093E\u0917 \u0917\u0930\u093F\u092F\u094B <INSERTEMOJI> <INSERTTAG>\u0964`,
    "pt": `<INSERTNUM> <INSERTNAME> fotos etiquetadas com <INSERTEMOJI> <INSERTTAG>.`,
    "zh": `<INSERTNUM>\u5F20<INSERTNAME><INSERTEMOJI><INSERTTAG>\u7684\u7167\u7247`
  },
  "trick_or_treat": {
    "en": `${Emoji.pumpkin} Trick or Treat! ${Emoji.pumpkin}`,
    "es": `${Emoji.pumpkin} \xA1Truco o trato! ${Emoji.pumpkin}`,
    "ja": `${Emoji.pumpkin} \u4E0D\u6C17\u5473\u306A\u30AB\u30DC\u30C1\u30E3 ${Emoji.pumpkin}`,
    "ko": `${Emoji.pumpkin} \uC0AC\uD0D5 \uC548 \uC8FC\uBA74 \uC7A5\uB09C\uCE60 \uAC70\uC57C! ${Emoji.pumpkin}`,
    "ne": `${Emoji.pumpkin} \u0921\u0930\u0932\u093E\u0917\u094D\u0926\u094B \u0915\u0926\u094D\u0926\u0941 ${Emoji.pumpkin}`,
    "pt": `${Emoji.pumpkin} Gostosuras ou travessuras ${Emoji.pumpkin}`,
    "zh": `${Emoji.pumpkin} \u602A\u5F02\u7684\u5357\u74DC ${Emoji.pumpkin}`
  },
  "zoo_details_babies": {
    "en": `${Emoji.baby} <INSERTBABIES> cubs born since <INSERTYEAR>`,
    "es": `${Emoji.baby} <INSERTBABIES> cachorros nacidos desde <INSERTYEAR>`,
    "ja": `${Emoji.baby} <INSERTYEAR>\u5E74\u304B\u3089\u751F\u307E\u308C\u305F<INSERTBABIES>\u4EBA\u306E\u8D64\u3061\u3083\u3093`,
    "ko": `${Emoji.baby} <INSERTYEAR>\uB144\uC5D0 \uD0DC\uC5B4\uB09C \uC544\uAE30\uB294 <INSERTBABIES>\uB9C8\uB9AC\uC608\uC694.`,
    "ne": `${Emoji.baby} <INSERTBABIES> \u092A\u091B\u093F \u092C\u091A\u094D\u091A\u093E \u091C\u0928\u094D\u092E\u0947 <INSERTYEAR>`,
    "pt": `${Emoji.baby} <INSERTBABIES> filhotes nascidos desde <INSERTYEAR>`,
    "zh": `${Emoji.baby} \u81EA<INSERTYEAR>\u5E74\u4EE5\u6765\u51FA\u751F\u7684<INSERTBABIES>\u540D\u5A74\u513F`
  },
  "zoo_details_departures": {
    "en": `${Emoji.truck} <INSERTNUM> recent departures`,
    "es": `${Emoji.truck} <INSERTNUM> partidas recientes.`,
    "ja": `${Emoji.truck} \u6700\u8FD1\u306E<INSERTNUM>\u56DE\u306E\u51FA\u767A`,
    "ko": `${Emoji.truck} \uCD5C\uADFC\uC5D0 \uC774\uB3D9\uD55C <INSERTNUM>\uB9C8\uB9AC\uC758 \uB808\uC11C\uD310\uB2E4`,
    "ne": `${Emoji.truck} <INSERTNUM> \u092D\u0930\u094D\u0916\u0930\u0915\u094B \u092A\u094D\u0930\u0938\u094D\u0925\u093E\u0928`,
    "pt": `${Emoji.truck} <INSERTNUM> partidas recentes`,
    "zh": `${Emoji.truck} <INSERTNUM>\u6700\u8FD1\u51FA\u53D1`
  },
  "zoo_details_pandas_live_here": {
    "en": `${Emoji.panda} <INSERTNUM> red pandas live here`,
    "es": `${Emoji.panda} Hay <INSERTNUM> panda rojos en este zool\xF3gico`,
    "ja": `${Emoji.panda} \u3053\u3053\u306B<INSERTNUM>\u5339\u306E\u30EC\u30C3\u30B5\u30FC\u30D1\u30F3\u30C0\u304C\u4F4F\u3093\u3067\u3044\u307E\u3059`,
    "ko": `${Emoji.panda} \uC774\uACF3\uC5D0\uB294 <INSERTNUM>\uB9C8\uB9AC\uC758 \uB808\uC11C\uD310\uB2E4\uAC00 \uC0B4\uACE0 \uC788\uC5B4\uC694.`,
    "ne": `${Emoji.panda} <INSERTNUM> \u092A\u093E\u0902\u0921\u093E \u092F\u0939\u093E\u0901 \u092C\u0938\u094D\u091B\u0928\u094D`,
    "pt": `${Emoji.panda} <INSERTNUM> pandas-vermelhos moram aqui`,
    "zh": `${Emoji.panda} <INSERTNUM>\u53EA\u5927\u718A\u732B\u4F4F\u5728\u8FD9\u91CC`
  },
  "zoo_details_no_pandas_live_here": {
    "en": `${Emoji.panda} No red pandas currently here`,
    "es": `${Emoji.panda} Por ahora aqu\xED no hay pandas rojos.`,
    "ja": `${Emoji.panda} \u30D1\u30F3\u30C0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`,
    "ko": `${Emoji.panda} \uC774\uACF3\uC5D0\uB294 \uB808\uC11C\uD310\uB2E4\uAC00 \uC5C6\uC5B4\uC694.`,
    "ne": `${Emoji.panda} \u0915\u0941\u0928\u0948 \u0928\u093F\u0917\u0932\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E \u092B\u0947\u0932\u093E \u092A\u0930\u0947\u0928`,
    "pt": `${Emoji.panda} Nenhum panda-vermelho atualmente aqui`,
    "zh": `${Emoji.panda} \u6CA1\u6709\u627E\u5230\u8FD9\u53EA\u5C0F\u718A\u732B`
  },
  "zoo_details_records": {
    "en": `${Emoji.recordbook} <INSERTNUM> recorded in the database since <INSERTYEAR>`,
    "es": `${Emoji.recordbook} <INSERTNUM> registrados aqu\xED desde <INSERTYEAR>`,
    "ja": `${Emoji.recordbook} <INSERTYEAR>\u5E74\u304B\u3089\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u8A18\u9332\u3055\u308C\u305F<INSERTNUM>`,
    "ko": `${Emoji.recordbook} <INSERTYEAR>\uB144\uBD80\uD130 \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uC5D0 \uC800\uC7A5\uB41C <INSERTNUM>\uAC1C\uC758 \uAE30\uB85D\uC774 \uC788\uC5B4\uC694.`,
    "ne": `${Emoji.recordbook} <INSERTNUM> \u0930\u0947\u091A\u094B\u0930\u094D\u0921\u094D\u0938 \u0907\u0928 \u0926 \u0926\u0924\u093E\u092C\u0938\u0947 \u0938\u093F\u0928\u094D\u0915\u0947 <INSERTYEAR>`,
    "pt": `${Emoji.recordbook} <INSERTNUM> registrados na base de dados desde <INSERTYEAR>`,
    "zh": `${Emoji.recordbook} \u81EA<INSERTYEAR>\u5E74\u4EE5\u6765<INSERTNUM>\u4E2A\u8BB0\u5F55\u5728\u6570\u636E\u5E93\u4E2D`
  },
  "zoo_header_new_arrivals": {
    "en": `${Emoji.fireworks} New Arrivals`,
    "es": `${Emoji.fireworks} Los reci\xE9n llegados`,
    "ja": `${Emoji.fireworks} \u65B0\u7740`,
    "ko": `${Emoji.fireworks} \uC0C8\uB85C\uC6B4 \uCE5C\uAD6C\uB4E4`,
    "ne": `${Emoji.fireworks} \u0928\u092F\u093E\u0901 \u0906\u0917\u092E\u0928`,
    "pt": `${Emoji.fireworks} Novas chegadas`,
    "zh": `${Emoji.fireworks} \u65B0\u6765\u7684`
  },
  "zoo_header_other_pandas": {
    "en": `${Emoji.panda} Other Pandas at <INSERTZOO>`,
    "es": `${Emoji.panda} Otros pandas en <INSERTZOO>`,
    "ja": `${Emoji.panda} <INSERTZOO>\u306E\u4ED6\u306E\u30D1\u30F3\u30C0`,
    "ko": `${Emoji.panda} <INSERTZOO>\uC758 \uB2E4\uB978 \uB808\uC11C\uD310\uB2E4\uB4E4`,
    "ne": `${Emoji.panda} <INSERTZOO> \u0905\u0928\u094D\u092F \u092A\u094B\u0928\u094D\u092F\u093E`,
    "pt": `${Emoji.panda} Outros pandas em <INSERTZOO>`,
    "zh": `${Emoji.panda} <INSERTZOO>\u91CC\u7684\u5176\u4ED6\u5C0F\u718A\u732B`
  },
  "zoo_header_recently_departed": {
    "en": `${Emoji.truck} Recently Departed`,
    "es": `${Emoji.truck} Hace poco se fueron`,
    "ja": `${Emoji.truck} \u6700\u8FD1\u51FA\u767A\u3057\u307E\u3057\u305F`,
    "ko": `${Emoji.truck} \uCD5C\uADFC\uC5D0 \uB5A0\uB09C \uCE5C\uAD6C\uB4E4`,
    "ne": `${Emoji.truck} \u092D\u0930\u094D\u0916\u0930 \u092A\u094D\u0930\u0938\u094D\u0925\u093E\u0928`,
    "pt": `${Emoji.truck} Partiram recentemente`,
    "zh": `${Emoji.truck} \u6700\u8FD1\u79BB\u5F00`
  }
};
function arrivals(zoo, born) {
  const link = document.createElement("a");
  link.href = "javascript:";
  const linkId = `arrivals/zoo/${num(zoo._id)}`;
  link.id = linkId;
  link.addEventListener("click", function() {
    document.getElementById(linkId)?.scrollIntoView(true);
  });
  const p = document.createElement("p");
  const msgText = born.length > 0 ? `${Text.zoo_header_new_arrivals[environment_default.language]} ${Emoji.baby}` : Text.zoo_header_new_arrivals[environment_default.language];
  p.appendChild(document.createTextNode(msgText));
  link.appendChild(p);
  return shrinkBoxMessage("arrivalsHeader", link);
}
function arrived_from_zoo(zoo, date2) {
  return Text.arrived_from_zoo[environment_default.language].replace("<INSERTDATE>", date2).replace("<INSERTZOO>", zoo);
}
function autumn() {
  const link = document.createElement("a");
  link.href = "#query/autumn";
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.autumn[environment_default.language]);
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("tagSummary", link);
}
function baby_photos() {
  const link = document.createElement("a");
  link.href = "#query/baby";
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.baby_photos[environment_default.language]);
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("tagSummary", link);
}
function birthday3(name, animalId, years) {
  const link = document.createElement("a");
  link.href = `#panda/${animalId}`;
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.happy_birthday[environment_default.language].replace("<INSERTNAME>", name).replace("<INSERTNUMBER>", years));
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("birthdaySummary", link);
}
function birthday_overflow(count) {
  const p = document.createElement("p");
  p.className = "summaryEmphasis";
  const msg = document.createTextNode(Text.birthday_overflow[environment_default.language].replace("<INSERTCOUNT>", count.toString()));
  p.appendChild(msg);
  return shrinkBoxMessage("birthdaySummary", p);
}
function closed(date2) {
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.closed[environment_default.language].replace("<INSERTDATE>", date2));
  p.appendChild(msg);
  return p;
}
function credit(credit2, count) {
  if (credit2 == void 0) credit2 = Defaults.unknown[environment_default.language];
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.credit[environment_default.language].replace("<INSERTUSER>", credit2).replace("<INSERTNUMBER>", count.toString()).replace(Emoji.gift, () => {
    if (count >= 1e3) return Emoji.megagift;
    else return Emoji.gift;
  }));
  p.appendChild(msg);
  return shrinkBoxMessage("creditSummary", p);
}
function creditSingleFilter(credit2, filter, count) {
  if (credit2 == void 0) credit2 = Defaults.unknown[environment_default.language];
  filter = capitalNames(filter);
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.credit_animal_filter_single[environment_default.language].replace("<INSERTUSER>", credit2).replace("<INSERTNUMBER>", count.toString()).replace("<INSERTNAME>", filter));
  p.appendChild(msg);
  return shrinkBoxMessage("creditSummary", p);
}
function departed_to_zoo(zooName, date2) {
  return Text.departed_to_zoo[environment_default.language].replace("<INSERTDATE>", date2).replace("<INSERTZOO>", zooName);
}
function departures(zoo, deaths, leaving) {
  const link = document.createElement("a");
  link.href = "javascript:";
  const linkId = `departures/zoo/${num(zoo._id)}`;
  link.id = linkId;
  link.addEventListener("click", () => document.getElementById(linkId)?.scrollIntoView(true));
  const p = document.createElement("p");
  const msgText = deaths.length > 0 && leaving.length == deaths.length ? `${Text.zoo_header_recently_departed[environment_default.language]} ${Emoji.died}` : Text.zoo_header_recently_departed[environment_default.language];
  p.appendChild(document.createTextNode(msgText));
  link.appendChild(p);
  return shrinkBoxMessage("departuresHeader", link);
}
function findNearbyZoo() {
  const link = document.createElement("a");
  link.href = "#query/nearby";
  const p = document.createElement("p");
  p.className = "summaryEmphasis";
  const msg = document.createTextNode(Text.find_a_nearby_zoo[environment_default.language]);
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("frontPageSummary", link);
}
function geolocationStart() {
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.nearby_zoos[environment_default.language]);
  p.appendChild(msg);
  return shrinkBoxMessage("frontPageSummary", p);
}
function lunch_time() {
  const link = document.createElement("a");
  link.href = "#query/lunch time";
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.lunch_time[environment_default.language]);
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("tagSummary", link);
}
function memorial(name, animalId, birth, death) {
  const link = document.createElement("a");
  link.href = `#panda/${animalId}`;
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.goodbye[environment_default.language].replace("<INSERTNAME>", name).replace("<INSERTBIRTH>", birth).replace("<INSERTDEATH>", death));
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("memorialSummary", link);
}
function memorialGroup(nameString, idString) {
  const link = document.createElement("a");
  link.href = `#group/${idString}`;
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.remembering_you_together[environment_default.language].replace("<INSERTNAMES>", nameString));
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("memorialSummary", link);
}
function missing_you(name, animalId, birth, death) {
  const link = document.createElement("a");
  link.href = `#panda/${animalId}`;
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.missing_you[environment_default.language].replace("<INSERTNAME>", name).replace("<INSERTBIRTH>", birth).replace("<INSERTDEATH>", death));
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("memorialSummary", link);
}
function new_photos() {
  const counts = {
    "contributors": pandas_default.db._totals.updates.authors,
    "entities": pandas_default.db._totals.updates.entities,
    "photos": pandas_default.db._totals.updates.photos,
    "suffix": 1,
    "pandas": pandas_default.db._totals.updates.pandas,
    "zoos": pandas_default.db._totals.updates.zoos
  };
  if (counts["zoos"] == 0 && counts["entities"] == 0 && counts["photos"] == 0 && counts["pandas"] == 0) {
    return document.createElement("br");
  }
  let section_order = [];
  if (counts["pandas"] > 0 && counts["photos"] > 0) {
    section_order = [
      "pandas",
      "photos",
      "suffix"
    ];
  } else if (counts["pandas"] > 0) {
    section_order = [
      "pandas",
      "contributors",
      "suffix"
    ];
  } else if (counts["contributors"] > 0) {
    section_order = [
      "contributors",
      "photos",
      "suffix"
    ];
  } else {
    section_order = [
      "photos",
      "suffix"
    ];
  }
  let pieces = [];
  for (const part of section_order) {
    const count = counts[part];
    if (count == 0) {
      continue;
    }
    const message = Text[`new_content_${part}`][environment_default.language].replace("<INSERTCOUNT>", count.toString());
    pieces.push(message);
  }
  pieces = unpluralize(pieces);
  const p = commaPhrase(pieces);
  p.className = "updatePhotosMessage";
  return shrinkBoxMessage("frontPageSummary", p);
}
function profile_children(name, childrenCount, daughters, sons) {
  const p = document.createElement("p");
  let babies = 0;
  if (childrenCount != daughters + sons) {
    babies = childrenCount - daughters - sons;
  }
  let message = void 0;
  if (daughters > 0 && sons > 0 && babies > 0) {
    message = Text.profile_children_babies;
  } else if (daughters > 0 && sons > 0) {
    message = Text.profile_children;
  } else if (daughters > 0 && babies > 0) {
    message = Text.profile_daughters_babies;
  } else if (sons > 0 && babies > 0) {
    message = Text.profile_sons_babies;
  } else if (daughters > 0) {
    message = Text.profile_daughters;
  } else if (sons > 0) {
    message = Text.profile_sons;
  } else if (babies > 0) {
    message = Text.profile_babies_children;
  } else {
    message = Text.profile_children;
  }
  let output_text = message[environment_default.language].replace("<INSERTNAME>", name).replace("<INSERTTOTAL>", childrenCount.toString()).replace("<INSERTDAUGHTERS>", daughters.toString()).replace("<INSERTSONS>", sons.toString()).replace("<INSERTBABIES>", babies.toString());
  output_text = unpluralize([
    output_text
  ])[0];
  p.appendChild(document.createTextNode(output_text));
  return shrinkBoxMessage("profileSummary", p);
}
function profile_family(name) {
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.profile_family[environment_default.language].replace("<INSERTNAME>", name));
  p.appendChild(msg);
  const innerText = p.innerText;
  p.innerText = innerText.replace("s's", "s'");
  return shrinkBoxMessage("profileSummary", p);
}
function profile_siblings(name, siblingCount, sisters, brothers) {
  const p = document.createElement("p");
  let babies = 0;
  if (siblingCount != sisters + brothers) {
    babies = siblingCount - sisters - brothers;
  }
  let message = void 0;
  if (sisters > 0 && brothers > 0 && babies > 0) {
    message = Text.profile_siblings_babies;
  } else if (sisters > 0 && brothers > 0) {
    message = Text.profile_siblings;
  } else if (sisters > 0 && babies > 0) {
    message = Text.profile_sisters_babies;
  } else if (brothers > 0 && babies > 0) {
    message = Text.profile_brothers_babies;
  } else if (sisters > 0) {
    message = Text.profile_sisters;
  } else if (brothers > 0) {
    message = Text.profile_brothers;
  } else if (babies > 0) {
    message = Text.profile_babies_siblings;
  } else {
    message = Text.profile_siblings;
  }
  let output_text = message[environment_default.language].replace("<INSERTNAME>", name).replace("<INSERTTOTAL>", siblingCount.toString()).replace("<INSERTSISTERS>", sisters.toString()).replace("<INSERTBROTHERS>", brothers.toString()).replace("<INSERTBABIES>", babies.toString());
  output_text = unpluralize([
    output_text
  ])[0];
  p.appendChild(document.createTextNode(output_text));
  return shrinkBoxMessage("profileSummary", p);
}
function profile_where(name) {
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.profile_where[environment_default.language].replace("<INSERTNAME>", name));
  p.appendChild(msg);
  return shrinkBoxMessage("profileSummary", p);
}
function residents(zoo) {
  const link = document.createElement("a");
  link.href = "javascript:";
  const linkId = `residents/zoo/${num(zoo._id)}`;
  link.id = linkId;
  link.addEventListener("click", () => document.getElementById(linkId)?.scrollIntoView(true));
  const info = acquireZooInfo(zoo);
  const p = document.createElement("p");
  const msg = document.createTextNode(Text.zoo_header_other_pandas[environment_default.language].replace("<INSERTZOO>", info.name));
  p.appendChild(msg);
  link.appendChild(p);
  return shrinkBoxMessage("residentsHeader", p);
}
function tag_combo(num2, emojis) {
  const p = document.createElement("p");
  let output_text = Text.tag_combo[environment_default.language].replace("<INSERTNUM>", num2.toString());
  if (num2 == 1) output_text = unpluralize([
    output_text
  ]).join(" ");
  output_text = `${emojis.join(" ")} ${output_text}`;
  p.appendChild(document.createTextNode(output_text));
  return shrinkBoxMessage("tagSummary", p);
}
function tag_subject(num2, name, emoji2, tag) {
  if (name != void 0) name = capitalNames(name);
  if (name == void 0) if (environment_default.language == "ja") name = "\u679A";
  else name = Defaults.unknown[environment_default.language];
  let near_tag = void 0;
  if (tag in Tags) near_tag = Tags[tag][environment_default.language][0];
  else near_tag = Polyglots[tag][environment_default.language][0];
  const p = document.createElement("p");
  let msgText = Text.tag_subject[environment_default.language].replace("<INSERTNUM>", num2.toString()).replace("<INSERTNAME>", name).replace("<INSERTEMOJI>", emoji2).replace("<INSERTTAG>", near_tag);
  if (num2 == 1) msgText = unpluralize([
    msgText
  ]).join(" ");
  const msg = document.createTextNode(msgText);
  p.appendChild(msg);
  return shrinkBoxMessage("tagSummary", p);
}
function shrinkBoxMessage(messageClass, shrinkerChild) {
  const shrinker = document.createElement("div");
  shrinker.className = "shrinker";
  shrinker.appendChild(shrinkerChild);
  const message = document.createElement("div");
  message.className = messageClass;
  message.appendChild(shrinker);
  return message;
}

// ts/geolocate.ts
var state = {
  accuracy: false,
  closeResults: 10,
  earth: 0,
  latitude: 0,
  longitude: 0,
  maxResults: 5,
  resolved: false,
  /** List of zoos that match our search criteria */
  results: {
    "hits": [],
    "parsed": "geolookup_in_progress",
    "query": "nearby"
  },
  radius: 100,
  units: "km"
};
var geoEvents = {
  foundZoos: new Event("found_zoos"),
  resolvedLocation: new Event("resolved_location")
};
function init4() {
  if (navigator.language == "en-US") {
    state.earth = 3961;
    state.units = "mi";
  } else {
    state.earth = 6373;
    state.units = "km";
  }
}
function findClosest(maxDistance, maxResults) {
  const zoos = {};
  let hitList = [];
  for (let i = 1; graphId(`zoo.${i}`) != void 0; i++) {
    const z = graphId(`zoo.${i}`);
    const d = haversine(state.latitude, state.longitude, parseFloat(z.latitude), parseFloat(z.longitude));
    if (d < maxDistance) {
      z["distance"] = d.toFixed(1).toString() + state.units;
      zoos[d] = z;
    }
  }
  const closest = Object.keys(zoos).sort((a, b) => a < b ? -1 : 1).map((k) => parseInt(k));
  for (let distance of closest) {
    hitList.push(zoos[distance]);
  }
  hitList = hitList.slice(0, maxResults);
  state.results = {
    "hits": hitList,
    "parsed": "set_zoo_id",
    "query": "nearby"
  };
  window.dispatchEvent(geoEvents.foundZoos);
}
function getNaiveLocation() {
  renderGeoLookupStart();
  navigator.geolocation.getCurrentPosition((position) => {
    state.latitude = position.coords.latitude;
    state.longitude = position.coords.longitude;
    state.resolved = true;
    window.dispatchEvent(geoEvents.resolvedLocation);
  });
}
function getPreciseLocation() {
  const options2 = {
    enableHighAccuracy: true,
    timeout: 5e3,
    maximumAge: 0
  };
  const error_noop = function() {
  };
  navigator.geolocation.getCurrentPosition((position) => {
    state.latitude = position.coords.latitude;
    state.longitude = position.coords.longitude;
    state.resolved = true;
    window.dispatchEvent(geoEvents.resolvedLocation);
  }, error_noop, options2);
}
function haversine(myLat, myLon, targetLat, targetLon) {
  const R = state.earth;
  const lat1 = toRadians(myLat);
  const lon1 = toRadians(myLon);
  const lat2 = toRadians(targetLat);
  const lon2 = toRadians(targetLon);
  const dlon = lon2 - lon1;
  const dlat = lat2 - lat1;
  const a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}
function renderGeoLookupStart() {
  const newContent = document.createElement("div");
  newContent.id = "contentFrame";
  const shrinker = document.createElement("div");
  shrinker.className = "shrinker";
  const message = geolocationStart();
  shrinker.appendChild(message);
  newContent.appendChild(shrinker);
  resultsPage.searchBar();
  document.getElementById("contentFrame")?.replaceWith(newContent);
  resultsMenus.language();
  resultsMenus.top.render();
  footer.redraw("results");
  color("results");
}
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function toggleAccuracy() {
  state.accuracy = !state.accuracy;
  if (state.accuracy == true) {
    state.resolved = false;
    getPreciseLocation();
  } else {
    state.resolved = false;
    getNaiveLocation();
  }
}
window.addEventListener("found_zoos", function() {
  results.render();
  environment_default.current = results.render;
  if (state.results.hits.length >= state.closeResults) toggleAccuracy();
});
window.addEventListener("resolved_location", function() {
  findClosest(state.radius, state.maxResults);
});

// ts/icons.ts
var iconSvg = {
  "angry": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><path d="M7.5 8 10 9" /><path d="m14 9 2.5-1" /><path d="M9 10h.01" /><path d="M15 10h.01" /></svg>',
  "annoyed": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 15h8" /><path d="M8 9h2" /><path d="M14 9h2" /></svg>',
  "apple": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.528V3a1 1 0 0 1 1-1h0" /><path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" /></svg>',
  "arrow-down-to-line": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17V3" /><path d="m6 11 6 6 6-6" /><path d="M19 21H5" /></svg>',
  "arrow-right": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>',
  "arrow-up": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>',
  "award": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></svg>',
  "baby": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" /><path d="M15 12h.01" /><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" /><path d="M9 12h.01" /></svg>',
  "ban": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.929 4.929 19.07 19.071" /></svg>',
  "banknote": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>',
  "bed": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>',
  "bed-double": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M12 4v6" /><path d="M2 18h20" /></svg>',
  "bird": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01" /><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" /><path d="m20 7 2 .5-2 .5" /><path d="M10 18v3" /><path d="M14 17.75V21" /><path d="M7 18a6 6 0 0 0 3.84-10.61" /></svg>',
  "book-open": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>',
  "bug": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-9" /><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" /><path d="M14.12 3.88 16 2" /><path d="M21 21a4 4 0 0 0-3.81-4" /><path d="M21 5a4 4 0 0 1-3.55 3.97" /><path d="M22 13h-4" /><path d="M3 21a4 4 0 0 1 3.81-4" /><path d="M3 5a4 4 0 0 0 3.55 3.97" /><path d="M6 13H2" /><path d="m8 2 1.88 1.88" /><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" /></svg>',
  "cake": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /><path d="M2 21h20" /><path d="M7 8v3" /><path d="M12 8v3" /><path d="M17 8v3" /><path d="M7 4h.01" /><path d="M12 4h.01" /><path d="M17 4h.01" /></svg>',
  "camera": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /><circle cx="12" cy="13" r="3" /></svg>',
  "candy": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 7v10.9" /><path d="M14 6.1V17" /><path d="M16 7V3a1 1 0 0 1 1.707-.707 2.5 2.5 0 0 0 2.152.717 1 1 0 0 1 1.131 1.131 2.5 2.5 0 0 0 .717 2.152A1 1 0 0 1 21 8h-4" /><path d="M16.536 7.465a5 5 0 0 0-7.072 0l-2 2a5 5 0 0 0 0 7.07 5 5 0 0 0 7.072 0l2-2a5 5 0 0 0 0-7.07" /><path d="M8 17v4a1 1 0 0 1-1.707.707 2.5 2.5 0 0 0-2.152-.717 1 1 0 0 1-1.131-1.131 2.5 2.5 0 0 0-.717-2.152A1 1 0 0 1 3 16h4" /></svg>',
  "cat": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z" /><path d="M8 14v.5" /><path d="M16 14v.5" /><path d="M11.25 16.25h1.5L12 17l-.75-.75Z" /></svg>',
  "circle": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /></svg>',
  "circle-help": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>',
  "cloud-rain": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>',
  "construction": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="8" rx="1" /><path d="M17 14v7" /><path d="M7 14v7" /><path d="M17 3v3" /><path d="M7 3v3" /><path d="M10 14 2.3 6.3" /><path d="m14 6 7.7 7.7" /><path d="m8 6 8 8" /></svg>',
  "dices": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="12" x="2" y="10" rx="2" ry="2" /><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6" /><path d="M6 18h.01" /><path d="M10 14h.01" /><path d="M15 6h.01" /><path d="M18 9h.01" /></svg>',
  "dog": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.25 16.25h1.5L12 17z" /><path d="M16 14v.5" /><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309" /><path d="M8 14v.5" /><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5" /></svg>',
  "door-open": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20H2" /><path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" /><path d="M11 4H8a2 2 0 0 0-2 2v14" /><path d="M14 12h.01" /><path d="M22 20h-3" /></svg>',
  "droplet": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>',
  "dumbbell": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" /><path d="m2.5 21.5 1.4-1.4" /><path d="m20.1 3.9 1.4-1.4" /><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" /><path d="m9.6 14.4 4.8-4.8" /></svg>',
  "ear": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" /></svg>',
  "egg": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 4 8 4 14a8 8 0 0 0 16 0c0-6-4-12-8-12" /></svg>',
  "eye": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>',
  "flower": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" /><path d="M12 7.5V9" /><path d="M7.5 12H9" /><path d="M16.5 12H15" /><path d="M12 16.5V15" /><path d="m8 8 1.88 1.88" /><path d="M14.12 9.88 16 8" /><path d="m8 16 1.88-1.88" /><path d="M14.12 14.12 16 16" /></svg>',
  "flower-2": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1" /><circle cx="12" cy="8" r="2" /><path d="M12 10v12" /><path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z" /><path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z" /></svg>',
  "frown": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>',
  "gem": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3 8 9l4 13 4-13-2.5-6" /><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" /><path d="M2 9h20" /></svg>',
  "ghost": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01" /><path d="M15 10h.01" /><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" /></svg>',
  "gift": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14" /><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" /><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" /><rect x="3" y="7" width="18" height="4" rx="1" /></svg>',
  "glasses": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="15" r="4" /><circle cx="18" cy="15" r="4" /><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2" /><path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2" /><path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2" /></svg>',
  "globe": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>',
  "grape": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 5V2l-5.89 5.89" /><circle cx="16.6" cy="15.89" r="3" /><circle cx="8.11" cy="7.4" r="3" /><circle cx="12.35" cy="11.65" r="3" /><circle cx="13.91" cy="5.85" r="3" /><circle cx="18.15" cy="10.09" r="3" /><circle cx="6.56" cy="13.2" r="3" /><circle cx="10.8" cy="17.44" r="3" /><circle cx="5" cy="19" r="3" /></svg>',
  "hand-heart": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" /><path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" /><path d="m2 15 6 6" /><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" /></svg>',
  "heart": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" /></svg>',
  "heart-handshake": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" /></svg>',
  "home": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>',
  "hourglass": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>',
  "id-card": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10h2" /><path d="M16 14h2" /><path d="M6.17 15a3 3 0 0 1 5.66 0" /><circle cx="9" cy="11" r="2" /><rect x="2" y="5" width="20" height="14" rx="2" /></svg>',
  "image": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>',
  "landmark": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18v-7" /><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" /></svg>',
  "languages": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>',
  "laugh": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>',
  "leaf": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>',
  "lightbulb": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>',
  "lock": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>',
  "map": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /><path d="M15 5.764v15" /><path d="M9 3.236v15" /></svg>',
  "mars": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5" /><path d="m21 3-6.75 6.75" /><circle cx="10" cy="14" r="6" /></svg>',
  "meh": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" x2="16" y1="15" y2="15" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>',
  "mic-vocal": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 7.601-5.994 8.19a1 1 0 0 0 .1 1.298l.817.818a1 1 0 0 0 1.314.087L15.09 12" /><path d="M16.5 21.174C15.5 20.5 14.372 20 13 20c-2.058 0-3.928 2.356-6 2-2.072-.356-2.775-3.369-1.5-4.5" /><circle cx="16" cy="7" r="5" /></svg>',
  "moon": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>',
  "mountain": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>',
  "origami": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12V4a1 1 0 0 1 1-1h6.297a1 1 0 0 1 .651 1.759l-4.696 4.025" /><path d="m12 21-7.414-7.414A2 2 0 0 1 4 12.172V6.415a1.002 1.002 0 0 1 1.707-.707L20 20.009" /><path d="m12.214 3.381 8.414 14.966a1 1 0 0 1-.167 1.199l-1.168 1.163a1 1 0 0 1-.706.291H6.351a1 1 0 0 1-.625-.219L3.25 18.8a1 1 0 0 1 .631-1.781l4.165.027" /></svg>',
  "panda": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.25 17.25h1.5L12 18z" /><path d="m15 12 2 2" /><path d="M18 6.5a.5.5 0 0 0-.5-.5" /><path d="M20.69 9.67a4.5 4.5 0 1 0-7.04-5.5 8.35 8.35 0 0 0-3.3 0 4.5 4.5 0 1 0-7.04 5.5C2.49 11.2 2 12.88 2 14.5 2 19.47 6.48 22 12 22s10-2.53 10-7.5c0-1.62-.48-3.3-1.3-4.83" /><path d="M6 6.5a.495.495 0 0 1 .5-.5" /><path d="m9 12-2 2" /></svg>',
  "party-popper": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" /><path d="M15 2h.01" /><path d="M22 20h.01" /><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" /></svg>',
  "paw-print": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>',
  "pen-line": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 21h8" /><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></svg>',
  "pencil": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>',
  "pickaxe": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999" /><path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024" /><path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069" /><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z" /></svg>',
  "plane": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>',
  "rainbow": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a10 10 0 0 0-20 0" /><path d="M6 17a6 6 0 0 1 12 0" /><path d="M10 17a2 2 0 0 1 4 0" /></svg>',
  "rat": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 22H4a2 2 0 0 1 0-4h12" /><path d="M13.236 18a3 3 0 0 0-2.2-5" /><path d="M16 9h.01" /><path d="M16.82 3.94a3 3 0 1 1 3.237 4.868l1.815 2.587a1.5 1.5 0 0 1-1.5 2.1l-2.872-.453a3 3 0 0 0-3.5 3" /><path d="M17 4.988a3 3 0 1 0-5.2 2.052A7 7 0 0 0 4 14.015 4 4 0 0 0 8 18" /></svg>',
  "refresh-cw": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>',
  "scale": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" /></svg>',
  "scan-eye": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><circle cx="12" cy="12" r="1" /><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0" /></svg>',
  "scan-face": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>',
  "search": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>',
  "settings": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" /><circle cx="12" cy="12" r="3" /></svg>',
  "shower-head": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 2.5 2.5" /><path d="M13.5 6.5a4.95 4.95 0 0 0-7 7" /><path d="M15 5 5 15" /><path d="M14 17v.01" /><path d="M10 16v.01" /><path d="M13 13v.01" /><path d="M16 10v.01" /><path d="M11 20v.01" /><path d="M17 14v.01" /><path d="M20 11v.01" /></svg>',
  "siren": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18v-6a5 5 0 1 1 10 0v6" /><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /><path d="M21 12h1" /><path d="M18.5 4.5 18 5" /><path d="M2 12h1" /><path d="M12 2v1" /><path d="m4.929 4.929.707.707" /><path d="M12 12v6" /></svg>',
  "smile": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" /></svg>',
  "snowflake": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 20-1.25-2.5L6 18" /><path d="M10 4 8.75 6.5 6 6" /><path d="m14 20 1.25-2.5L18 18" /><path d="m14 4 1.25 2.5L18 6" /><path d="m17 21-3-6h-4" /><path d="m17 3-3 6 1.5 3" /><path d="M2 12h6.5L10 9" /><path d="m20 10-1.5 2 1.5 2" /><path d="M22 12h-6.5L14 15" /><path d="m4 10 1.5 2L4 14" /><path d="m7 21 3-6-1.5-3" /><path d="m7 3 3 6h4" /></svg>',
  "soup": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M7 21h10" /><path d="M19.5 12 22 6" /><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" /><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" /><path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" /></svg>',
  "spade": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 18v4" /><path d="M2 14.499a5.5 5.5 0 0 0 9.591 3.675.6.6 0 0 1 .818.001A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02L5 8.999c-1.5 1.5-3 3.2-3 5.5" /></svg>',
  "sprout": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3" /><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4" /><path d="M5 21h14" /></svg>',
  "star": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" /></svg>',
  "target": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>',
  "tent": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 21 14 3" /><path d="M20.5 21 10 3" /><path d="M15.5 21 12 15l-3.5 6" /><path d="M2 21h20" /></svg>',
  "toilet": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18" /><path d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" /></svg>',
  "tornado": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H3" /><path d="M18 8H6" /><path d="M19 12H9" /><path d="M16 16h-6" /><path d="M11 20H9" /></svg>',
  "trees": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" /><path d="M7 16v6" /><path d="M13 19v3" /><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" /></svg>',
  "truck": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>',
  "user": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>',
  "user-round": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>',
  "users": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg>',
  "utensils": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>',
  "venus": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15v7" /><path d="M9 19h6" /><circle cx="12" cy="9" r="6" /></svg>',
  "volleyball": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 7a16 16 20 0 1 10.98 4.362" /><path d="M12 12a13 13 0 0 1-8.66 5" /><path d="M16.83 13.634a16 16 0 0 1-9.267 7.328" /><path d="M20.66 17A13 13 0 0 0 12 12a13 13 0 0 1 0-10" /><path d="M8.17 15.366a16 16 0 0 1-1.713-11.69" /><circle cx="12" cy="12" r="10" /></svg>',
  "worm": '<svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 12-1.5 3" /><path d="M19.63 18.81 22 20" /><path d="M6.47 8.23a1.68 1.68 0 0 1 2.44 1.93l-.64 2.08a6.76 6.76 0 0 0 10.16 7.67l.42-.27a1 1 0 1 0-2.73-4.21l-.42.27a1.76 1.76 0 0 1-2.63-1.99l.64-2.08A6.66 6.66 0 0 0 3.94 3.9l-.7.4a1 1 0 1 0 2.55 4.34z" /></svg>'
};
var iconMap = {
  "\u{1F42F}\u{1F43B}": "panda",
  "\u{1F33F}\u{1F34E}": "gift",
  "\u{1F466}\u{1F466}": "users",
  "\u{1F467}\u{1F466}": "users",
  "\u{1F467}\u{1F467}": "users",
  "\u{1F468}\u200D\u{1F3A4}": "mic-vocal",
  "\u{1F469}\u200D\u{1F3A4}": "mic-vocal",
  "\u200D\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F": "scan-eye",
  "\u{1F6A8}": "siren",
  "\u{1F43C}": "panda",
  "\u{1F47D}": "ghost",
  "\u{1F34E}": "apple",
  "\u27A1": "arrow-right",
  "\u270D\uFE0F": "pen-line",
  "\u{1F342}": "leaf",
  "\u{1F476}\u{1F3FB}": "baby",
  "\u{1F476}": "baby",
  "\u{1F38D}": "sprout",
  "\u{1F6CC}": "bed",
  "\u{1F371}": "utensils",
  "\u{1F382}": "cake",
  "\u{1F611}": "meh",
  "\u{1F47C}": "baby",
  "\u{1F423}": "egg",
  "\u{1F35C}": "soup",
  "\u{1F466}\u{1F3FB}": "user",
  "\u{1F466}": "user",
  "\u{1F309}": "landmark",
  "\u{1F98B}": "origami",
  "\u{1F4F7}": "camera",
  "\u{1F3D5}\uFE0F": "tent",
  "\u{1F361}": "candy",
  "\u{1F338}": "flower",
  "\u{1F41B}": "bug",
  "\u{1F9D7}": "mountain",
  "\u{1F512}": "lock",
  "\u{1F601}": "laugh",
  "\u{1F491}": "heart-handshake",
  "\u{1F300}": "tornado",
  "\u{1F308}": "rainbow",
  "\u26CF\uFE0F": "pickaxe",
  "\u{1F37D}\uFE0F": "utensils",
  "\u{1F6AA}": "door-open",
  "\u{1F442}": "ear",
  "\u{1F4DD}": "pencil",
  "\u{1F441}\uFE0F": "eye",
  "\u{1F468}\u{1F3FB}": "user",
  "\u{1F468}": "user",
  "\u2640\uFE0F": "venus",
  "\u2640": "venus",
  "\u{1F386}": "party-popper",
  "\u{1F33C}": "flower-2",
  "\u26BD": "volleyball",
  "\u{1F381}": "gift",
  "\u{1F467}\u{1F3FB}": "user",
  "\u{1F467}": "user",
  "\u{1F30E}": "globe",
  "\u{1F30F}": "globe",
  "\u{1F474}": "user-round",
  "\u{1F620}": "angry",
  "\u{1F495}": "heart",
  "\u{1F3E1}": "home",
  "\u{1F41C}": "bug",
  "\u{1F5FF}": "landmark",
  "\u{1F48B}": "heart",
  "\u{1F4A1}": "lightbulb",
  "\u{1F989}": "bird",
  "\u{1F444}": "smile",
  "\u2642\uFE0F": "mars",
  "\u2642": "mars",
  "\u{1F5FA}\uFE0F": "map",
  "\u{1F5BC}\uFE0F": "image",
  "\u{1F5BC}": "image",
  "\u{1F4B8}": "banknote",
  "\u{1F9D0}": "glasses",
  "\u{1F319}": "moon",
  "\u{1F469}\u{1F3FB}": "user",
  "\u{1F469}": "user",
  "\u{1F434}": "dog",
  "\u{1F913}": "glasses",
  "\u26AA": "circle",
  "\u{1F6AB}": "ban",
  "\u{1F443}": "scan-face",
  "\u23EC": "arrow-down-to-line",
  "\u{1F43E}": "paw-print",
  "\u{1F0CF}": "spade",
  "\u{1F4A9}": "toilet",
  "\u{1F64F}": "hand-heart",
  "\u{1F49F}": "id-card",
  "\u2753": "circle-help",
  "\u23F3": "hourglass",
  "\u231B": "hourglass",
  "\u{1F3B2}": "dices",
  "\u{1F327}\uFE0F": "cloud-rain",
  "\u{1F4D6}": "book-open",
  "\u{1F504}": "refresh-cw",
  "\u{1F3F5}\uFE0F": "award",
  "\u2696\uFE0F": "scale",
  "\u{1F50D}": "search",
  "\u{1F6BF}": "shower-head",
  "\u{1F634}": "bed-double",
  "\u{1F924}": "droplet",
  "\u{1F604}": "smile",
  "\u{1F40D}": "worm",
  "\u2744\uFE0F": "snowflake",
  "\u2744": "snowflake",
  "\u{1F577}\uFE0F": "bug",
  "\u{1F577}": "bug",
  "\u{1F31F}": "star",
  "\u{1F3AF}": "target",
  "\u2B06": "arrow-up",
  "\u{1F32A}\uFE0F": "tornado",
  "\u2708\uFE0F": "plane",
  "\u{1F48E}": "gem",
  "\u{1F333}": "trees",
  "\u{1F69A}": "truck",
  "\u{1F643}": "smile",
  "\u{1F629}": "frown",
  "\u{1F310}": "globe",
  "\u{1F3CB}\uFE0F": "dumbbell",
  "\u{1F42D}": "rat",
  "\u{1F609}": "smile",
  "\u{1F6A7}": "construction",
  "\u{1F622}": "frown",
  "\u{1F62A}": "annoyed",
  "\u{1F981}": "cat",
  "\u2699\uFE0F": "settings",
  "\u{1F38B}": "sprout",
  "\u{1F42F}": "cat",
  "\u{1F43B}": "paw-print",
  "\u{1F347}": "grape",
  "\u{1F33F}": "leaf"
};
var keys = Object.keys(iconMap).sort(function(a, b) {
  return b.length - a.length;
});
var regex2 = new RegExp(keys.map(function(k) {
  return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}).join("|"), "g");
var emoji = {};
function iconLangSpan(context) {
  const span = document.createElement("span");
  if (context == "button") {
    span.className = "lx lx-languages";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = iconSvg["languages"];
  } else {
    span.className = "langName";
    span.textContent = langNames[context] || context.toUpperCase();
  }
  return span;
}
function iconSpan(key) {
  const span = document.createElement("span");
  if (emoji[key] == 1) {
    span.className = "lx lxe";
    span.textContent = key;
    return span;
  }
  span.className = "lx lx-" + iconMap[key];
  span.setAttribute("aria-hidden", "true");
  span.innerHTML = iconSvg[iconMap[key]];
  return span;
}
var flagRegex = /(?:\uD83C[\uDDE6-\uDDFF]){2}/g;
var langNames = {
  "en": "English",
  "ja": "\u65E5\u672C\u8A9E",
  "zh": "\u4E2D\u6587",
  "ko": "\uD55C\uAD6D\uC5B4",
  "ne": "\u0928\u0947\u092A\u093E\u0932\u0940",
  "pt": "Portugu\xEAs",
  "es": "Espa\xF1ol"
};
function langContext(node) {
  let p = node.parentElement;
  while (p != null) {
    if (p.id == "languageButton") {
      return "button";
    }
    if (p.classList != null && p.classList.contains("langKey")) {
      return "button";
    }
    if (p.tagName == "BUTTON" && /LanguageFlag$/.test(p.id)) {
      return p.id.replace("LanguageFlag", "");
    }
    p = p.parentElement;
  }
  return null;
}
function processLangText(node, context) {
  const text = node.nodeValue;
  if (text == null || text.length == 0) {
    return false;
  }
  flagRegex.lastIndex = 0;
  if (!flagRegex.test(text)) {
    return false;
  }
  const frag = document.createDocumentFragment();
  let last = 0;
  let match = null;
  flagRegex.lastIndex = 0;
  while ((match = flagRegex.exec(text)) !== null) {
    if (match.index > last) {
      frag.appendChild(document.createTextNode(text.slice(last, match.index)));
    }
    frag.appendChild(iconLangSpan(context));
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    frag.appendChild(document.createTextNode(text.slice(last)));
  }
  if (node.parentNode != null) {
    node.parentNode.replaceChild(frag, node);
  }
  return true;
}
function processText(node) {
  const text = node.nodeValue;
  if (text == null || text.length == 0) {
    return;
  }
  const lang_context = langContext(node);
  if (lang_context != null && processLangText(node, lang_context)) {
    return;
  }
  regex2.lastIndex = 0;
  if (!regex2.test(text)) {
    return;
  }
  const frag = document.createDocumentFragment();
  let last = 0;
  let match = null;
  regex2.lastIndex = 0;
  while ((match = regex2.exec(text)) !== null) {
    if (match.index > last) {
      frag.appendChild(document.createTextNode(text.slice(last, match.index)));
    }
    frag.appendChild(iconSpan(match[0]));
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    frag.appendChild(document.createTextNode(text.slice(last)));
  }
  if (node.parentNode != null) {
    node.parentNode.replaceChild(frag, node);
  }
}
var skip = {
  "SCRIPT": 1,
  "STYLE": 1,
  "TEXTAREA": 1,
  "INPUT": 1,
  "svg": 1,
  "SVG": 1
};
var skipClass = {
  "lx": 1,
  "pandaResult": 1,
  "zooResult": 1,
  "profileFrame": 1,
  "zooHistory": 1,
  "profilePhotos": 1,
  "mediaFrame": 1
};
function skipElement(el) {
  switch (true) {
    case el instanceof Element:
      if (skip[el.nodeName] == 1) {
        return true;
      }
      if (el.classList == null) {
        return false;
      }
      for (const cls in skipClass) if (el.classList.contains(cls)) return true;
    default:
      return false;
  }
}
function walk(root) {
  if (root.nodeType == Node.TEXT_NODE) {
    let p = root.parentNode;
    while (p != null && p.nodeType == Node.ELEMENT_NODE) {
      if (skipElement(p)) {
        return;
      }
      p = p.parentNode;
    }
    processText(root);
    return;
  }
  if (root.nodeType != Node.ELEMENT_NODE) {
    return;
  }
  if (skipElement(root)) {
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n) {
      let p = n.parentNode;
      while (p != null && p.nodeType == Node.ELEMENT_NODE) {
        if (skipElement(p)) {
          return NodeFilter.FILTER_REJECT;
        }
        p = p.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  nodes.forEach(processText);
}
var observer = new MutationObserver(function(mutations) {
  observer.disconnect();
  mutations.forEach(function(mu) {
    if (mu.type == "characterData") {
      walk(mu.target);
    }
    if (mu.addedNodes != null) {
      for (let i = 0; i < mu.addedNodes.length; i++) {
        walk(mu.addedNodes[i]);
      }
    }
  });
  observer.takeRecords();
  observe();
});
function observe() {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

// ts/scrollTop.ts
var btn;
function init5() {
  btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", update4, {
    passive: true
  });
  window.addEventListener("resize", update4);
  window.addEventListener("hashchange", update4);
  window.addEventListener("panda_data", update4);
  btn.addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
  update4();
}
function update4() {
  if (!btn) return;
  btn.classList.toggle("visible", window.scrollY > 200);
  const footer2 = document.getElementById("footer");
  const baseOffset = 24;
  if (!footer2) {
    btn.style.bottom = `${baseOffset}px`;
    return;
  }
  const rect = footer2.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  if (rect.top < windowHeight) {
    const overlap = windowHeight - rect.top;
    btn.style.bottom = `${overlap + 10}px`;
  } else {
    btn.style.bottom = `${baseOffset}px`;
  }
}

// ts/init.ts
(function() {
  const meta = document.createElement("meta");
  meta.name = "viewport";
  if (navigator.platform === "iPad") {
    const scale = 1.2;
    meta.content = `width=device-width, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=0"`;
    document.head.appendChild(meta);
  } else if (navigator.platform === "iPhone") {
    const scale = 1;
    meta.content = `width=device-width, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=0"`;
    document.head.appendChild(meta);
  } else if (navigator.userAgent.includes("Android")) {
    const scale = 1;
    meta.content = `width=device-width, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale}, user-scalable=0, target-densitydpi="device-dpi"`;
    document.head.appendChild(meta);
  } else {
    return;
  }
})();
document.addEventListener("DOMContentLoaded", function() {
  routes.check();
  init();
  init4();
  init5();
  init2();
  walk(document.body);
  observe();
  init3();
  defaultDisplayLanguage();
  update2();
  redraw(environment_default.current);
  if (history.scrollRestoration) {
    history.scrollRestoration = "auto";
    if (window.location.hash.indexOf("#about") == -1) {
      history.scrollRestoration = "manual";
    }
  }
  window.addEventListener("panda_data", function() {
    searchBar.enable();
    if (routes.memberOf(routes.profile, window.location.hash)) {
      profile.render();
    } else if (routes.memberOf(routes.media, window.location.hash)) {
      media.render();
    } else if (window.location.hash == "#links") {
      links.render();
    } else if (window.location.hash == "#options") {
      options.render();
    } else if (window.location.hash.length > 0 && !routes.memberOf(routes.fixed, window.location.hash)) {
      results.render();
    } else if (window.location.hash.length == 0 || window.location.hash == "#home") {
      home.render();
    }
    setTimeout(shrinkNames, 1e3);
  });
  about.fetch();
  const last_seen = window.localStorage.getItem("last_seen");
  const current_hash = window.location.hash;
  if (last_seen != null && current_hash.length == 0) {
    window.location.hash = last_seen;
  }
});
window.addEventListener("hashchange", function() {
  state.resolved = false;
  environment_default.paging.shown_pages = 1;
  const mode = window.location.hash.split("/")[0];
  if (window.location.hash.length == 0 || mode == "#home") {
    home.render();
    environment_default.current = home.render;
  } else if (mode == "#about") {
    about.hashchange();
  } else if (mode == "#links") {
    links.hashchange();
  } else if (mode == "#options") {
    options.hashchange();
  } else if (routes.results.includes(mode)) {
    results.render();
    environment_default.current = results.render;
  } else if (routes.profile.includes(mode)) {
    profile.render();
    environment_default.current = profile.render;
  } else if (routes.media.includes(mode)) {
    media.render();
    environment_default.current = media.render;
  }
  window.localStorage.setItem("last_seen", window.location.hash);
  if (history.scrollRestoration && mode != "#about") {
    history.scrollRestoration = "manual";
  }
});
window.addEventListener("about_loaded", function() {
  if (window.location.hash == "#about") {
    about.render();
    about.sectionButtonEventHandlers();
    about.sectionShow(window.sessionStorage.getItem("aboutPageMenu"));
    about.instructions();
    mediaQuery().addEventListener("change", about.instructions);
    about.tags();
    environment_default.current = about.render;
  }
});
