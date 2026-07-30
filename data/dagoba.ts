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
    ported away from 'code golf' to es6 and classes/typescript by Justin Fairchild, 2026
*/

/** Edges submitted as arguments may just have references to vertexes by id */
type DanglingEdge = {
  _in: number,
  _label: string,
  _out: number,
  [k: string]: any
}

/** 
 * Real edges in the graph have one in-vertex, one out-vertex, one label, and
 * any other string-keyed properties you want.
 */
type Edge = {
  _in: Vertex,
  _label: string
  _out: Vertex,
  [k: string]: any
}

/**
 * Vertices have a numeric private ID number, any number of incoming and
 * outgoing edges, and any other string-indexed properties you want.
 */
type Vertex = {
  _id: number,
  _in: Edge[],
  _out: Edge[],
  [k: string]: any
}

/** Wanderers through the graph */
type Gremlin = {
  vertex: Vertex,
  result?: any,
  state: State
}

type MaybeGremlin = false | 'done' | 'pull' | Gremlin

type PipetypeFunction = (...args: any[]) => MaybeGremlin

/** The name of a pipetype, and the arguments to that function */
type Step = [pipeType: string, args: any[]]

/** A filter or result. Edges or vertices can match on any properties. */
type Result = {
  [k: string]: any
}
type Filter = Result

/** Arbitrary state for the Gremlin to track. Always points at vertices */
type State = {
  edges?: Vertex[],
  vertices?: Vertex[],
  [k: string]: any
}

/** When traversing the graph, you can return nodes in either direction */
type Direction = "in" | "out" | "both"

class Graph {
  autoid = 1
  edges: Edge[] = []
  vertices: Vertex[] = []
  vertexIndex: Record<string, Vertex> = {}

  constructor(V: Vertex[], E: DanglingEdge[]) {
    if (Array.isArray(V)) this.addVertices(V)   // arrays only, because you wouldn't
    if (Array.isArray(E)) this.addEdges(E)      // call this with singular V and E
  }

  /** accepts an edge-like object, with properties */
  addEdge(input: DanglingEdge) {
    const edge = {...input, ...{
      _in: this.findVertexById(input._in),
      _out: this.findVertexById(input._out)
    }}
    if (!(edge._in && edge._out))
      return error(`That edge's ${edge._in ? 'out' : 'in'} vertex wasn't found`)
    edge._out._out.push(edge)   // add edge to the edge's out vertex's out edges
    edge._in._in.push(edge)     // vice versa
    this.edges.push(edge)
  }

  addEdges(edges: DanglingEdge[]) {
    edges.forEach(edge => this.addEdge(edge))
  }

  /** accepts a vertex-like object, with properties */
  // TODO TS: id | undefined, rather than truthiness around id
  addVertex(vertex: Vertex) {
    // ensure autoid doesn't overwrite
    if (vertex._id >= this.autoid)
      this.autoid = vertex._id + 1
    if (!vertex._id)
      this.autoid++
    else if (this.findVertexById(vertex._id))
      return error(`A vertex with id ${vertex._id} already exists`)
    this.vertices.push(vertex)
    this.vertexIndex[vertex._id] = vertex
    // placeholders for edge pointers
    vertex._out = []
    vertex._in = []
    return vertex._id
  }

  addVertices(vertices: Vertex[]) {
    vertices.forEach(vertex => this.addVertex(vertex))
  }

  findInEdges(vertex: Vertex) {
    return vertex._in
  }

  findOutEdges(vertex: Vertex) {
    return vertex._out
  }

  findVertexById(vertex_id: number) {
    return this.vertexIndex[vertex_id]
  }

  /** our general vertex finding function */
  findVertices(args: Filter[] | number[]) {
    if (typeof args[0] == 'object')
      return this.searchVertices(args[0])
    // OPT: slice is costly with lots of vertices
    else if (args.length == 0)
      return this.vertices.slice()
    else
      return this.findVerticesByIds(args as number[])
  }

  findVerticesByIds(ids: number[]) {
    if (ids.length == 1) {
      // maybe_vertex is either a vertex or undefined
      const maybe_vertex = this.findVertexById(ids[0])
      return maybe_vertex ? [maybe_vertex] : []
    }
    return ids.map(id => this.findVertexById(id)).filter(Boolean)
  }

  removeEdge(edge: Edge) {
    remove(edge._in._in, edge)
    remove(edge._out._out, edge)
    remove(this.edges, edge)
  }

  removeVertex(vertex: Vertex) {
    vertex._in.slice().forEach(edge => this.removeEdge(edge))
    vertex._out.slice().forEach(edge => this.removeEdge(edge))
    remove(this.vertices, vertex)
    delete this.vertexIndex[vertex._id]
  }

  /** find vertices that match obj's key-value pairs */
  searchVertices(filter: Filter) {
    return this.vertices.filter((vertex) => objectFilter(vertex, filter))
  }

  /** serialization */
  toString() {
    return jsonify(this)
  }

  /** A query initializer: g.v() -> query */
  v(...args: any[]) {
    const query = new Query(this)
    query.add('vertex', args)   // add vertex as first query pipe
    return query
  }
}

/** The `Query` class also has pipetype functions instantiated against it, so */
interface Query {
  /** add a new step to the query */
  add: (pipetype: string, args: any[]) => Query,
  /** The dagoba graph a query operates on */
  graph: Graph,
  /** List of gremlins for each step */
  gremlins: Gremlin[],
  /** List of steps to take (pipeType names and function arguments) */
  program: Step[],
  /** Our virtual machine for query processing */
  run: () => (Vertex | Result)[],
  /** List of state values for each step in this query */
  state: State[],
  /** 
   * Support defining pipetype functions on the query class. This is the
   * secret sauce primitive that makes `G.v().output().output().run()`-style
   * methods chaining work.
   */
  [k: string]: any
}

class Query {
  graph
  gremlins: Gremlin[] = []
  program: Step[] = []
  state: State[] = []

  /** factory (only called by a graph's query initializers) */
  constructor(graph: Graph) {
    this.graph = graph
    return this
  }

  add = (pipetype: string, args: any[]): Query => {
    const step = [pipetype, args] as Step
    this.program.push(step)   // step is an array: first the pipe type, then its args
    return this
  }

  run = (): (Vertex | Result)[] => {
    // activate the transformers
    this.program = transform(this.program)
    // last step in the program
    const max = this.program.length - 1
    // a gremlin, a signal string, or false
    let maybe_gremlin: MaybeGremlin = false
    // results for this particular run
    let results = []
    // behind which things have finished
    let done = -1
    // our program counter -- we start from the end
    let pc = max
    let step, state, pipetype
    // driver loop
    while (done < max) {
      // step is an array: first the pipe type, then its args
      step = this.program[pc]
      // the state for this step: ensure it's always an object
      state = this.state[pc] = this.state[pc] || {}
      // a pipetype is just a function
      pipetype = getPipetype(step[0])
      maybe_gremlin = pipetype(this.graph, step[1], maybe_gremlin, state)
      if (maybe_gremlin == 'pull') {
        // 'pull' tells us the pipe wants further input
        maybe_gremlin = false
        if (pc - 1 > done) {
          pc--   // try the previous pipe
          continue
        } else {
          done = pc   // previous pipe is finished, so we are too
        }
      }
      // 'done' tells us the pipe is finished
      if (maybe_gremlin == 'done') {
        maybe_gremlin = false
        done = pc
      }
      // move on to the next pipe
      pc++
      if (pc > max) {
        // a gremlin popped out the end of the pipeline
        if (maybe_gremlin)
          results.push(maybe_gremlin)
        maybe_gremlin = false
        // take a step back
        pc--
      }
    }
    // return either results (like property('name')) or vertices
    results = results.map((gremlin) =>
      gremlin.result != null ? gremlin.result : gremlin.vertex)
    return results
  }
}

// PIPE TYPES

const Pipetypes: Record<string, PipetypeFunction> = {}   // every pipe has a type

function addPipetype(name: string, fun: PipetypeFunction) {
  // adds a new method to our query object
  Pipetypes[name] = fun
  Query.prototype[name] = function(...args: any[]) {
    return this.add(name, args)   // capture the pipetype and args
  }
}

/** if you can't find a pipe type */
function fauxPipetype(_graph: Graph, _args: any[], maybe_gremlin: MaybeGremlin, _state: State) {
  return maybe_gremlin || 'pull'   // just keep things flowing along
}

function getPipetype(name: string): PipetypeFunction {
  const pipetype = Pipetypes[name]   // a pipe type is just a function
  if (!pipetype)
    error(`Unrecognized pipe type: ${name}`)
  return pipetype || fauxPipetype
}

// BUILT-IN PIPE TYPES

addPipetype('vertex', function(graph: Graph, args: any[], gremlin: Gremlin, state: State) {
  // state initialization
  if (!state.vertices)
    state.vertices = graph.findVertices(args)
  // all done
  if (!state.vertices.length)
    return 'done'
  // OPT: this relies on cloning the vertices
  const vertex = state.vertices.pop() as Vertex
  // we can have incoming gremlins from as/back queries
  return makeGremlin(vertex, gremlin.state)
})

function simpleTraversal(dir: Direction) {
  // handles basic in, out and both pipetypes
  function get_edges(graph: Graph, dir: Direction, vertex: Vertex, filter: Filter) {
    // get edges that match our query
    const find_method = dir === 'out' ? 'findOutEdges' : 'findInEdges'
    const other_side = dir === 'out' ? '_in' : '_out'
    return graph[find_method](vertex)
      .filter(filterEdges(filter))
        .map((edge: Edge) => edge[other_side])
  }
  return function (graph: Graph, args: any[], gremlin: Gremlin, state: State) {
    if (!gremlin && (!state.edges || !state.edges.length))   // query initialization
      return 'pull'
    // state initialization
    if (!state.edges || !state.edges.length) {
      state.gremlin = gremlin
      state.edges = get_edges(graph, dir, gremlin.vertex, args[0])
      if (dir === 'both')
        state.edges = state.edges.concat(get_edges(graph, 'out', gremlin.vertex, args[0]))
    }
    // all done
    if (!state.edges.length)
      return 'pull'
    // use up an edge
    // TODO: clearly define edges vs vertexes
    const vertex = state.edges.pop() as Vertex
    return gotoVertex(state.gremlin, vertex)
  }
}

addPipetype('in', simpleTraversal('in'))
addPipetype('out', simpleTraversal('out'))
addPipetype('both', simpleTraversal('both'))
addPipetype('property', function(_graph: Graph, args: any[], gremlin: Gremlin, _state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  gremlin.result = (gremlin.vertex)
    ? gremlin.vertex[args[0]] : null
  // undefined or null properties kill the gremlin
  return gremlin.result == null ? false : gremlin
})
addPipetype('unique', function(_graph: Graph, _args: any[], gremlin: Gremlin, state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  // we've seen this gremlin, so get another instead
  if (state[gremlin.vertex._id]) return 'pull'
  state[gremlin.vertex._id] = true
  return gremlin
});
addPipetype('filter', function(_graph: Graph, args: any[], gremlin: Gremlin, _state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  if (!gremlin.vertex) return false
  // filter by object
  if (typeof args[0] == 'object')
    return objectFilter(gremlin.vertex, args[0]) ? gremlin : 'pull'
  if (typeof args[0] != 'function') {
    error('Filter arg is not a function: ' + args[0])
    return gremlin   // keep things moving
  }
  // gremlin fails filter function
  if (!args[0](gremlin.vertex, gremlin))
    return 'pull'
  return gremlin
})
addPipetype('take', function(_graph: Graph, args: any[], gremlin: Gremlin, state: State) {
  // state initialization
  state.taken = state.taken || 0
  // all done
  if (state.taken == args[0]) {
    state.taken = 0
    return 'done'
  }
  // query initialization
  if (!gremlin) return 'pull'
  state.taken++   // THINK: if this didn't mutate state, we could be more
  return gremlin  // cavalier about state management (but run the GC hotter)
})
addPipetype('as', function(_graph: Graph, args: any[], gremlin: Gremlin, _state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  // initialize gremlin's 'as' state
  gremlin.state.as = gremlin.state.as || {}
  // set label to the current vertex
  gremlin.state.as[args[0]] = gremlin.vertex
  return gremlin
})
addPipetype('back', function(_graph: Graph, args: any[], gremlin: Gremlin, _state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  // TODO: check for nulls
  return gotoVertex(gremlin, gremlin.state.as[args[0]])
})
addPipetype('except', function(_graph: Graph, args: any[], gremlin: Gremlin, _state: State) {
  // query initialization
  if (!gremlin) return 'pull'
  // TODO: check for nulls
  if (gremlin.vertex == gremlin.state.as[args[0]]) return 'pull'
  return gremlin
});
addPipetype('merge', function(_graph: Graph, args: number[], gremlin: Gremlin, state: State) {
  //// THINK: merge and back are very similar...
  // query initialization
  if (!state.vertices && !gremlin) return 'pull'
  // state initialization
  if (!state.vertices || !state.vertices.length) {
    const obj = (gremlin.state || {}).as || {}
    state.vertices = args.map(id => obj[id]).filter(Boolean)
  }
  // done with this batch
  if (!state.vertices.length)
    return 'pull'
  const vertex = state.vertices.pop() as Vertex
  return makeGremlin(vertex, gremlin.state)
})

// TRANSFORMER FUNCTIONS (to optimize queries)

type Transformer = {
  fun: Function,
  priority: number
}

const Transformers: Transformer[] = []

export function addTransformer(fun: Function, priority: number) {
  if (typeof fun != 'function') return error('Invalid transformer function')
  let i
  for (i = 0; i < Transformers.length; i++) // OPT: binary search
    if (priority > Transformers[i].priority)
      break
  Transformers.splice(i, 0, { priority: priority, fun: fun })
}

function transform(program: Step[]) {
  return Transformers.reduce(function (acc, transformer) {
    return transformer.fun(acc)
  }, program)
}

// HELPER FUNCTIONS

function error(msg: string) {
  console.log(msg)
  return false
}

function filterEdges(filter: Filter) {
  return function(edge: Edge) {
    // if there's no filter, everything is valid
    if (!filter)
      return true
    // if the filter is a string, the label must match
    if (typeof filter == 'string')
      return edge._label == filter
    // if the filter is an array, the label must be in it
    if (Array.isArray(filter))
      return filter.includes(edge._label)
    // try the filter as an object
    return objectFilter(edge, filter)
  }
}

/** another graph constructor */
export function fromString(str: string) {
  const obj = parseJSON(str)   // this could throw
  if (!obj) return null
  return new Graph(obj.V, obj.E)
}

function gotoVertex(gremlin: Gremlin, vertex: Vertex) {
  // clone the gremlin
  return makeGremlin(vertex, gremlin.state)   // THINK: add path tracking here?
}

/** kids, don't hand code JSON */
function jsonify(graph: Graph) {
  /** convert vertexes to just their ids */
  function cleanEdge(key: string, value: Vertex) {
    return key == '_in' || key == '_out' ? value._id : value
  }
  /** remove edges from vertexes */
  function cleanVertex(key: string, value: Edge) {
    return key == '_in' || key == '_out' ? undefined : value
  }
  return '{"V":' + JSON.stringify(graph.vertices, cleanVertex) +
         ',"E":' + JSON.stringify(graph.edges, cleanEdge) + 
         '}'
}

/** Gremlins are simple creatures: a current vertex, and some state */
function makeGremlin(vertex: Vertex, state: State): Gremlin {
  return { 
    vertex: vertex,
    state: state || {}
  }
}

/** thing has to match all of filter's properties */
function objectFilter(thing: Edge | Vertex, filter: Filter) {
  for (const key in filter) if (thing[key] !== filter[key]) return false
  return true
}

function parseJSON(str: string) {
  try {
    return JSON.parse(str)
  } catch (err) {
    error(`Invalid JSON: ${err}`)
    return null
  }
}

/** Remove an item from a list of nodes or edges */
function remove(list: any[], item: any) {
  return list.splice(list.indexOf(item), 1)
}

export default Graph
