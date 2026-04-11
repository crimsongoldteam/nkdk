type NodeAttrs = { name: string; offset?: number; filePath?: string }
type EdgeAttrs = { yaml: string; name: string }
type NodeMatchParams = { id: string; attrs: NodeAttrs }
type EdgeMatchParams = { id: string; attrs: EdgeAttrs }

type Step =
  | { kind: "node"; fn: (params: NodeMatchParams) => boolean }
  | { kind: "edgeOr"; matchers: Array<(params: EdgeMatchParams) => boolean> }
  | { kind: "edge"; fn: (params: EdgeMatchParams) => boolean }

export class QueryBuilder {
  constructor(private readonly steps: Step[]) {}

  nodeMatch(fn: (params: NodeMatchParams) => boolean): QueryBuilder {
    return new QueryBuilder([...this.steps, { kind: "node", fn }])
  }

  edgeOr(...matchers: Array<(params: EdgeMatchParams) => boolean>): QueryBuilder {
    return new QueryBuilder([...this.steps, { kind: "edgeOr", matchers }])
  }

  edgeMatch(fn: (params: EdgeMatchParams) => boolean): QueryBuilder {
    return new QueryBuilder([...this.steps, { kind: "edge", fn }])
  }

  getSteps(): Step[] {
    return this.steps
  }
}

export function nodeMatch(fn: (params: NodeMatchParams) => boolean): QueryBuilder {
  return new QueryBuilder([{ kind: "node", fn }])
}

export function edgeMatch(fn: (params: EdgeMatchParams) => boolean) {
  return fn
}
