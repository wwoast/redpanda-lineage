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
 * All node types in the graph should implement this vertex interafce. Vertices
 * have a numeric or string private ID, and any number of incoming and outgoing
 * edges. Extend this to add other kinds of typed fields.
 */
interface Vertex {
  _id: string,
  _in: Edge[],
  _out: Edge[],
  [k: string]: any
}

/** Vertices submitted as arguments may not have ids, or edges defined yet. */
type CandidateVertex = {
  _id?: string,
  _in?: Edge[],
  _out?: Edge[],
  [k: string]: any
}

/** Edges submitted as arguments may just have references to vertexes by id */
type DanglingEdge = {
  _in: string,
  _label: string,
  _out: string,
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

/** Transformer functions are used to optimize queries */
type Transformer = {
  fun: Function,
  priority: number
}
