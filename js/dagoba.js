/*
     ____  _____ _____ _____ _____ _____
    |    \|  _  |   __|     | __  |  _  |
    |  |  |     |  |  |  |  | __ -|     |
    |____/|__|__|_____|_____|_____|__|__|

    dagoba: a tiny in-memory graph database

    ex:
    V = [ {name: 'alice'}                                         // alice gets auto-_id (prolly 1)
        , {_id: 10, name: 'bob', hobbies: ['asdf', {x:3}]}]
    E = [ {_out: 1, _in: 10, _label: 'knows'} ]
    g = Dagoba.graph(V, E)

    g.addVertex({name: 'charlie', _id: 'charlie'})                // string ids are fine
    g.addVertex({name: 'delta', _id: '30'})                       // in fact they're all strings

    g.addEdge({_out: 10, _in: 30, _label: 'parent'})
    g.addEdge({_out: 10, _in: 'charlie', _label: 'knows'})

    g.v(1).out('knows').out().run()                               // returns [charlie, delta]

    q = g.v(1).out('knows').out().take(1)
    q.run()                                                       // returns [charlie]
    q.run()                                                       // returns [delta]    (but don't rely on result order!)
    q.run()                                                       // returns []


    Dagoba consists of two main parts: graphs and queries.
    A graph contains vertices and edges, and provides access to query initializers like g.v()
    A query contains pipes, which make up a pipeline, and a virtual machine for processing pipelines.
    There are some pipe types defined by default.
    There are also a few helper functions.
    That's all.


    copyright dann toliver, 2015
    version 0.3.4
*/

var Dagoba = {}; // the namespace

Dagoba.G = {}; // the prototype

Dagoba.graph = function (V, E) {
  // the factory
  var graph = Object.create(Dagoba.G);
  graph.edges = []; // fresh copies so they're not shared
  graph.vertices = [];
  graph.vertexIndex = {};
  graph.autoid = 1; // an auto-incrementing id counter
  if (Array.isArray(V)) graph.addVertices(V); // arrays only, because you wouldn't
  if (Array.isArray(E)) graph.addEdges(E); // call this with singular V and E
  return graph;
};

Dagoba.G.v = function () {
  // a query initializer: g.v() -> query
  var query = Dagoba.query(this);
  query.add('vertex', [].slice.call(arguments)); // add vertex as first query pipe
  return query;
};

Dagoba.G.addVertex = function (vertex) {
  // accepts a vertex-like object, with properties
  if (vertex._id >= this.autoid) this.autoid = vertex._id + 1; // ensure autoid doesn't overwrite
  if (!vertex._id) vertex._id = this.autoid++;else if (this.findVertexById(vertex._id)) return Dagoba.error('A vertex with id ' + vertex._id + ' already exists');

  this.vertices.push(vertex);
  this.vertexIndex[vertex._id] = vertex;
  vertex._out = [];vertex._in = []; // placeholders for edge pointers
  return vertex._id;
};

Dagoba.G.addEdge = function (edge) {
  // accepts an edge-like object, with properties
  edge._in = this.findVertexById(edge._in);
  edge._out = this.findVertexById(edge._out);

  if (!(edge._in && edge._out)) return Dagoba.error("That edge's " + (edge._in ? 'out' : 'in') + " vertex wasn't found");

  edge._out._out.push(edge); // add edge to the edge's out vertex's out edges
  edge._in._in.push(edge); // vice versa
  this.edges.push(edge);
};

Dagoba.G.addVertices = function (vertices) {
  vertices.forEach(this.addVertex.bind(this));
};
Dagoba.G.addEdges = function (edges) {
  edges.forEach(this.addEdge.bind(this));
};

Dagoba.G.removeVertex = function (vertex) {
  vertex._in.slice().forEach(Dagoba.G.removeEdge.bind(this));
  vertex._out.slice().forEach(Dagoba.G.removeEdge.bind(this));
  Dagoba.remove(this.vertices, vertex);
  delete this.vertexIndex[vertex._id];
};

Dagoba.G.removeEdge = function (edge) {
  Dagoba.remove(edge._in._in, edge);
  Dagoba.remove(edge._out._out, edge);
  Dagoba.remove(this.edges, edge);
};

Dagoba.G.findVertices = function (args) {
  // our general vertex finding function
  if (typeof args[0] == 'object') return this.searchVertices(args[0]);else if (args.length == 0) return this.vertices.slice(); // OPT: slice is costly with lots of vertices
  else return this.findVerticesByIds(args);
};

// Dagoba.G.findVertices = function(ids) {                           // our general vertex finding function
//   return typeof ids[0] == 'object' ? this.searchVertices(ids[0])
//        : ids.length == 0 ? this.vertices.slice()                  // OPT: slice is costly with lots of vertices
//        : this.findVerticesByIds(ids) }

Dagoba.G.findVerticesByIds = function (ids) {
  if (ids.length == 1) {
    var maybe_vertex = this.findVertexById(ids[0]); // maybe_vertex is either a vertex or undefined
    return maybe_vertex ? [maybe_vertex] : [];
  }

  return ids.map(this.findVertexById.bind(this)).filter(Boolean);
};

// Dagoba.G.findVerticesByIds = function(ids) {
//   return ids.length == 1
//          ? [].concat( this.findVertexById(ids[0]) || [] )
//          : ids.map( this.findVertexById.bind(this) ).filter(Boolean) }

Dagoba.G.findVertexById = function (vertex_id) {
  return this.vertexIndex[vertex_id];
};

Dagoba.G.searchVertices = function (filter) {
  // find vertices that match obj's key-value pairs
  return this.vertices.filter(function (vertex) {
    return Dagoba.objectFilter(vertex, filter);
  });
};

// Dagoba.G.searchVertices = function(obj) {                         // find vertices that match obj's key-value pairs
//   return this.vertices.filter(
//     function(vertex) {
//       return Object.keys(obj).reduce(
//         function(acc, key) {
//           return acc && obj[key] == vertex[key] }, true ) } ) }

Dagoba.G.findOutEdges = function (vertex) {
  return vertex._out;
};
Dagoba.G.findInEdges = function (vertex) {
  return vertex._in;
};

Dagoba.G.toString = function () {
  return Dagoba.jsonify(this);
}; // serialization

Dagoba.fromString = function (str) {
  // another graph constructor
  var obj = Dagoba.parseJSON(str); // this could throw
  if (!obj) return null;
  return Dagoba.graph(obj.V, obj.E);
};

Dagoba.Q = {}; // prototype

Dagoba.query = function (graph) {
  // factory (only called by a graph's query initializers)
  var query = Object.create(Dagoba.Q);

  query.graph = graph; // the graph itself
  query.state = []; // state for each step
  query.program = []; // list of steps to take
  query.gremlins = []; // gremlins for each step

  return query;
};

Dagoba.Q.run = function () {
  // our virtual machine for query processing
  this.program = Dagoba.transform(this.program); // activate the transformers

  var max = this.program.length - 1; // last step in the program
  var maybe_gremlin = false; // a gremlin, a signal string, or false
  var results = []; // results for this particular run
  var done = -1; // behindwhich things have finished
  var pc = max; // our program counter -- we start from the end

  var step, state, pipetype;

  // driver loop
  while (done < max) {

    step = this.program[pc]; // step is an array: first the pipe type, then its args
    state = this.state[pc] = this.state[pc] || {}; // the state for this step: ensure it's always an object
    pipetype = Dagoba.getPipetype(step[0]); // a pipetype is just a function

    maybe_gremlin = pipetype(this.graph, step[1], maybe_gremlin, state);

    if (maybe_gremlin == 'pull') {
      // 'pull' tells us the pipe wants further input
      maybe_gremlin = false;
      if (pc - 1 > done) {
        pc--; // try the previous pipe
        continue;
      } else {
        done = pc; // previous pipe is finished, so we are too
      }
    }

    if (maybe_gremlin == 'done') {
      // 'done' tells us the pipe is finished
      maybe_gremlin = false;
      done = pc;
    }

    pc++; // move on to the next pipe

    if (pc > max) {
      if (maybe_gremlin) results.push(maybe_gremlin); // a gremlin popped out the end of the pipeline
      maybe_gremlin = false;
      pc--; // take a step back
    }
  }

  results = results.map(function (gremlin) {
    // return either results (like property('name')) or vertices
    return gremlin.result != null ? gremlin.result : gremlin.vertex;
  });

  return results;
};

Dagoba.Q.add = function (pipetype, args) {
  // add a new step to the query
  var step = [pipetype, args];
  this.program.push(step); // step is an array: first the pipe type, then its args
  return this;
};

Dagoba.Pipetypes = {}; // every pipe has a type

Dagoba.addPipetype = function (name, fun) {
  // adds a new method to our query object
  Dagoba.Pipetypes[name] = fun;
  Dagoba.Q[name] = function () {
    return this.add(name, [].slice.apply(arguments));
  }; // capture the pipetype and args
};

Dagoba.getPipetype = function (name) {
  var pipetype = Dagoba.Pipetypes[name]; // a pipe type is just a function

  if (!pipetype) Dagoba.error('Unrecognized pipe type: ' + name);

  return pipetype || Dagoba.fauxPipetype;
};

Dagoba.fauxPipetype = function (graph, args, maybe_gremlin) {
  // if you can't find a pipe type
  return maybe_gremlin || 'pull'; // just keep things flowing along
};

// BUILT-IN PIPE TYPES


Dagoba.addPipetype('vertex', function (graph, args, gremlin, state) {
  if (!state.vertices) state.vertices = graph.findVertices(args); // state initialization

  if (!state.vertices.length) // all done
    return 'done';

  var vertex = state.vertices.pop(); // OPT: this relies on cloning the vertices
  return Dagoba.makeGremlin(vertex, gremlin.state); // we can have incoming gremlins from as/back queries
});

Dagoba.simpleTraversal = function (dir) {
  // handles basic in, out and both pipetypes

  function get_edges(graph, dir, vertex, filter) {
    // get edges that match our query
    var find_method = dir === 'out' ? 'findOutEdges' : 'findInEdges';
    var other_side = dir === 'out' ? '_in' : '_out';

    return graph[find_method](vertex).filter(Dagoba.filterEdges(filter)).map(function (edge) {
      return edge[other_side];
    });
  }

  return function (graph, args, gremlin, state) {
    if (!gremlin && (!state.edges || !state.edges.length)) // query initialization
      return 'pull';

    if (!state.edges || !state.edges.length) {
      // state initialization
      state.gremlin = gremlin;
      state.edges = get_edges(graph, dir, gremlin.vertex, args[0]);

      if (dir === 'both') state.edges = state.edges.concat(get_edges(graph, 'out', gremlin.vertex, args[0]));
    }

    if (!state.edges.length) // all done
      return 'pull';

    var vertex = state.edges.pop(); // use up an edge
    return Dagoba.gotoVertex(state.gremlin, vertex);
  };
};

Dagoba.addPipetype('in', Dagoba.simpleTraversal('in'));
Dagoba.addPipetype('out', Dagoba.simpleTraversal('out'));
Dagoba.addPipetype('both', Dagoba.simpleTraversal('both'));

Dagoba.addPipetype('outAllN', function (graph, args, gremlin, state) {

  //// THIS PIPETYPE IS GOING AWAY DON'T READ IT

  var filter = args[0];
  var limit = args[1] - 1;

  if (!state.edgeList) {
    // initialize
    if (!gremlin) return 'pull';
    state.edgeList = [];
    state.current = 0;
    state.edgeList[0] = graph.findOutEdges(gremlin.vertex).filter(Dagoba.filterEdges(filter));
  }

  if (!state.edgeList[state.current].length) {
    // finished this round
    if (state.current >= limit || !state.edgeList[state.current + 1] // totally done, or the next round has no items
    || !state.edgeList[state.current + 1].length) {
      state.edgeList = false;
      return 'pull';
    }
    state.current++; // go to next round
    state.edgeList[state.current + 1] = [];
  }

  var vertex = state.edgeList[state.current].pop()._in;

  if (state.current < limit) {
    // add all our matching edges to the next level
    if (!state.edgeList[state.current + 1]) state.edgeList[state.current + 1] = [];
    state.edgeList[state.current + 1] = state.edgeList[state.current + 1].concat(graph.findOutEdges(vertex).filter(Dagoba.filterEdges(filter)));
  }

  return Dagoba.gotoVertex(gremlin, vertex);
});

Dagoba.addPipetype('inAllN', function (graph, args, gremlin, state) {

  //// THIS PIPETYPE IS GOING AWAY DON'T READ IT

  var filter = args[0];
  var limit = args[1] - 1;

  if (!state.edgeList) {
    // initialize
    if (!gremlin) return 'pull';
    state.edgeList = [];
    state.current = 0;
    state.edgeList[0] = graph.findInEdges(gremlin.vertex).filter(Dagoba.filterEdges(filter));
  }

  if (!state.edgeList[state.current].length) {
    // finished this round
    if (state.current >= limit || !state.edgeList[state.current + 1] // totally done, or the next round has no items
    || !state.edgeList[state.current + 1].length) {
      state.edgeList = false;
      return 'pull';
    }
    state.current++; // go to next round
    state.edgeList[state.current + 1] = [];
  }

  var vertex = state.edgeList[state.current].pop()._out;

  if (state.current < limit) {
    // add all our matching edges to the next level
    if (!state.edgeList[state.current + 1]) state.edgeList[state.current + 1] = [];
    state.edgeList[state.current + 1] = state.edgeList[state.current + 1].concat(graph.findInEdges(vertex).filter(Dagoba.filterEdges(filter)));
  }

  return Dagoba.gotoVertex(gremlin.state, vertex);
});

Dagoba.addPipetype('property', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization
  gremlin.result = gremlin.vertex[args[0]];
  return gremlin.result == null ? false : gremlin; // undefined or null properties kill the gremlin
});

Dagoba.addPipetype('unique', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization
  if (state[gremlin.vertex._id]) return 'pull'; // we've seen this gremlin, so get another instead
  state[gremlin.vertex._id] = true;
  return gremlin;
});

Dagoba.addPipetype('filter', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization

  if (typeof args[0] == 'object') // filter by object
    return Dagoba.objectFilter(gremlin.vertex, args[0]) ? gremlin : 'pull';

  if (typeof args[0] != 'function') {
    Dagoba.error('Filter arg is not a function: ' + args[0]);
    return gremlin; // keep things moving
  }

  if (!args[0](gremlin.vertex, gremlin)) return 'pull'; // gremlin fails filter function
  return gremlin;
});

Dagoba.addPipetype('take', function (graph, args, gremlin, state) {
  state.taken = state.taken || 0; // state initialization

  if (state.taken == args[0]) {
    state.taken = 0;
    return 'done'; // all done
  }

  if (!gremlin) return 'pull'; // query initialization
  state.taken++; // THINK: if this didn't mutate state, we could be more
  return gremlin; // cavalier about state management (but run the GC hotter)
});

Dagoba.addPipetype('as', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization
  gremlin.state.as = gremlin.state.as || {}; // initialize gremlin's 'as' state
  gremlin.state.as[args[0]] = gremlin.vertex; // set label to the current vertex
  return gremlin;
});

Dagoba.addPipetype('back', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization
  return Dagoba.gotoVertex(gremlin, gremlin.state.as[args[0]]); // TODO: check for nulls
});

Dagoba.addPipetype('except', function (graph, args, gremlin, state) {
  if (!gremlin) return 'pull'; // query initialization
  if (gremlin.vertex == gremlin.state.as[args[0]]) return 'pull'; // TODO: check for nulls
  return gremlin;
});

Dagoba.addPipetype('merge', function (graph, args, gremlin, state) {
  //// THINK: merge and back are very similar...
  if (!state.vertices && !gremlin) return 'pull'; // query initialization

  if (!state.vertices || !state.vertices.length) {
    // state initialization
    var obj = (gremlin.state || {}).as || {};
    state.vertices = args.map(function (id) {
      return obj[id];
    }).filter(Boolean);
  }

  if (!state.vertices.length) return 'pull'; // done with this batch

  var vertex = state.vertices.pop();
  return Dagoba.makeGremlin(vertex, gremlin.state);
});

// HELPER FUNCTIONS

Dagoba.makeGremlin = function (vertex, state) {
  // gremlins are simple creatures:
  return { vertex: vertex, state: state || {} // a current vertex, and some state
  };
};

Dagoba.gotoVertex = function (gremlin, vertex) {
  // clone the gremlin
  return Dagoba.makeGremlin(vertex, gremlin.state); // THINK: add path tracking here?
};

Dagoba.filterEdges = function (filter) {
  return function (edge) {
    if (!filter) // if there's no filter, everything is valid
      return true;

    if (typeof filter == 'string') // if the filter is a string, the label must match
      return edge._label == filter;

    if (Array.isArray(filter)) // if the filter is an array, the label must be in it
      return !!~filter.indexOf(edge._label);

    return Dagoba.objectFilter(edge, filter); // try the filter as an object
  };
};
// Dagoba.filterEdges = function(arg) {
//   return function(thing) {
//     return !arg ? true                                            // nothing is true
//          : arg+'' === arg ? thing._label == arg                   // check the label
//          : Array.isArray(arg) ? !!~arg.indexOf(thing._label)      // or a list of labels
//          : Dagoba.objectFilter(thing, arg) } }                    // try it as an object

Dagoba.objectFilter = function (thing, filter) {
  // thing has to match all of filter's properties
  for (var key in filter) if (thing[key] !== filter[key]) return false;

  return true;
};

Dagoba.cleanVertex = function (key, value) {
  // for JSON.stringify
  return key == '_in' || key == '_out' ? undefined : value;
};

Dagoba.cleanEdge = function (key, value) {
  return key == '_in' || key == '_out' ? value._id : value;
};

Dagoba.jsonify = function (graph) {
  // kids, don't hand code JSON
  return '{"V":' + JSON.stringify(graph.vertices, Dagoba.cleanVertex) + ',"E":' + JSON.stringify(graph.edges, Dagoba.cleanEdge) + '}';
};

Dagoba.parseJSON = function (str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    Dagoba.error('Invalid JSON', err);
    return null;
  }
};

Dagoba.cloneflat = function (graph) {
  return Dagoba.parseJSON(Dagoba.jsonify(graph));
};

Dagoba.clone = function (graph) {
  var G = Dagoba.cloneflat(graph);
  return Dagoba.graph(G.V, G.E);
};

Dagoba.persist = function (graph, name) {
  name = name || 'graph';
  localStorage.setItem('DAGOBA::' + name, graph);
};

Dagoba.depersist = function (name) {
  name = 'DAGOBA::' + (name || 'graph');
  var flatgraph = localStorage.getItem(name);
  return Dagoba.fromString(flatgraph);
};

Dagoba.error = function (msg) {
  console.log(msg);
  return false;
};

Dagoba.T = []; // transformers (more than meets the eye)

Dagoba.addTransformer = function (fun, priority) {
  if (typeof fun != 'function') return Dagoba.error('Invalid transformer function');

  for (var i = 0; i < Dagoba.T.length; i++) // OPT: binary search
  if (priority > Dagoba.T[i].priority) break;

  Dagoba.T.splice(i, 0, { priority: priority, fun: fun });
};

Dagoba.transform = function (program) {
  return Dagoba.T.reduce(function (acc, transformer) {
    return transformer.fun(acc);
  }, program);
};

Dagoba.addAlias = function (newname, newprogram) {
  Dagoba.addPipetype(newname, function () {}); // because there's no method catchall in js
  newprogram = newprogram.map(function (step) {
    return [step[0], step.slice(1)]; // [['out', 'parent']] => [['out', ['parent']]]
  });
  // defaults = defaults || []                                    // default arguments for the alias
  Dagoba.addTransformer(function (program) {
    return program.reduce(function (acc, step) {
      if (step[0] != newname) return acc.concat([step]);
      return acc.concat(newprogram);
    }, []);
    // return program.map(function(step) {
    //   if(step[0] != newname) return step
    //   return [oldname, Dagoba.extend(step[1], defaults)]       // THINK: we need a way to thread alias params through
    // })
  }, 100); // these need to run early, so they get a high priority
};

Dagoba.extend = function (list, defaults) {
  return Object.keys(defaults).reduce(function (acc, key) {
    if (typeof list[key] != 'undefined') return acc;
    acc[key] = defaults[key];
    return acc;
  }, list);
};

Dagoba.remove = function (list, item) {
  return list.splice(list.indexOf(item), 1);
};

// more todos
// - tune gremlins (collisions, history, etc)
// - interface: show query pieces and params,
// - interface: resumable queries
// - generational queries
// - intersections
// - adverbs

// TODO: show how to refactor 'out', 'outN', and 'outAllN' using adverbs. also the 'in' equivalents. also make adverbs.
// TODO: deal with gremlin paths / history and gremlin "collisions"
// THINK: the user may retain a pointer to vertex, which they might mutate later >.<
// can take away user's ability to set _id and lose the index cache hash, because building it causes big rebalancing slowdowns and runs the GC hard. (or does it?) [this was with a million items, indexed by consecutive ints. generally we need settable _id because we need to grab vertices quickly by external key]


/*
        ---> no edge _id stuff
        ---> simplify driver loop helpers
        ---> refactor outAllN etc (mmm but adverbs?)
        ---> leo's queries !
*/

// re: Dagoba.Q.addPipetype
// TODO: accept string fun and allow extra params, for building quick aliases like
//       Dagoba.addPipetype('children', 'out') <-- if all out edges are kids
//       Dagoba.addPipetype('nthGGP', 'inN', 'parent')
// var methods = ['out', 'in', 'take', 'property', 'outAllN', 'inAllN', 'unique', 'filter', 'outV', 'outE', 'inV', 'inE', 'both', 'bothV', 'bothE']


// what if instead of mutating the query object for each new 'method' we create a new one? then you can have something like
// x = G.v(1).out().out()
// q = x.take(1)
// y = x.take(10)
// and it will do what you want instead of exploding.

// or....
// x = g.v(1).out().out()
// y = D.clone(x).take(1)
// x.take(1).run()
// y.run() // same answer
//# sourceMappingURL=dagoba.js.map
