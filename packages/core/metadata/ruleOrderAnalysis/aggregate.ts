import type { RuleOrderObservation } from "./types"

export interface RuleOrderWitness {
  configuration: string
  sourceXmlPath: string
  logicalAddress: string
  xmlNodeLogicalAddress: string
  fields: readonly string[]
}

export interface RuleOrderDirection {
  before: string
  after: string
  count: number
  witnesses: readonly RuleOrderWitness[]
}

export interface RuleOrderConflict {
  leftBeforeRight: RuleOrderDirection
  rightBeforeLeft: RuleOrderDirection
}

export interface RuleOrderRuleReport {
  ruleId: string
  ruleCandidates: readonly string[]
  itemType: string
  observationCount: number
  uniqueOrders: number
  conflicts: readonly RuleOrderConflict[]
  cycles: readonly (readonly string[])[]
}

interface RuleState {
  sourceCandidate: string
  itemType: string
  observationCount: number
  uniqueOrders: Set<string>
  directions: Map<string, MutableDirection>
}

interface MutableDirection {
  before: string
  after: string
  count: number
  witnesses: RuleOrderWitness[]
}

export function createRuleOrderAggregate(params: { witnessLimit?: number } = {}) {
  const witnessLimit = params.witnessLimit ?? 3
  const rules = new Map<string, RuleState>()
  return {
    accept(observation: RuleOrderObservation): void {
      if (new Set(observation.fields).size !== observation.fields.length) {
        throw new Error(`В наблюдении ${observation.logicalAddress} повторяется ключ свойства`)
      }
      const state =
        rules.get(observation.ruleId) ??
        ({
          sourceCandidate: observation.source.candidate,
          itemType: observation.itemType,
          observationCount: 0,
          uniqueOrders: new Set<string>(),
          directions: new Map<string, MutableDirection>(),
        } satisfies RuleState)
      if (
        state.itemType !== observation.itemType ||
        state.sourceCandidate !== observation.source.candidate
      ) {
        throw new Error(`Несогласованные данные ruleId ${observation.ruleId}`)
      }
      state.observationCount += 1
      state.uniqueOrders.add(JSON.stringify(observation.fields))
      const witness = toWitness(observation)
      for (let left = 0; left < observation.fields.length; left += 1) {
        for (let right = left + 1; right < observation.fields.length; right += 1) {
          const before = observation.fields[left]!
          const after = observation.fields[right]!
          const key = `${before}\0${after}`
          const direction = state.directions.get(key) ?? { before, after, count: 0, witnesses: [] }
          direction.count += 1
          if (direction.witnesses.length < witnessLimit) direction.witnesses.push(witness)
          state.directions.set(key, direction)
        }
      }
      rules.set(observation.ruleId, state)
    },
    finish(): readonly RuleOrderRuleReport[] {
      return [...rules]
        .sort(([left], [right]) => bytewiseCompare(left, right))
        .map(([ruleId, state]) => finishRule(ruleId, state))
    },
  }
}

function finishRule(ruleId: string, state: RuleState): RuleOrderRuleReport {
  const conflicts: RuleOrderConflict[] = []
  const fields = new Set<string>()
  const edges = new Map<string, Set<string>>()
  for (const direction of state.directions.values()) {
    fields.add(direction.before)
    fields.add(direction.after)
    const adjacent = edges.get(direction.before) ?? new Set<string>()
    adjacent.add(direction.after)
    edges.set(direction.before, adjacent)
    if (bytewiseCompare(direction.before, direction.after) >= 0) continue
    const reverse = state.directions.get(`${direction.after}\0${direction.before}`)
    if (reverse !== undefined)
      conflicts.push({ leftBeforeRight: copyDirection(direction), rightBeforeLeft: copyDirection(reverse) })
  }
  conflicts.sort((left, right) =>
    bytewiseCompare(
      `${left.leftBeforeRight.before}\0${left.leftBeforeRight.after}`,
      `${right.leftBeforeRight.before}\0${right.leftBeforeRight.after}`
    )
  )
  return {
    ruleId,
    ruleCandidates: [state.sourceCandidate],
    itemType: state.itemType,
    observationCount: state.observationCount,
    uniqueOrders: state.uniqueOrders.size,
    conflicts,
    cycles: stronglyConnectedComponents([...fields], edges).filter((component) => component.length > 1),
  }
}

function stronglyConnectedComponents(vertices: string[], edges: ReadonlyMap<string, ReadonlySet<string>>): string[][] {
  let nextIndex = 0
  const indexes = new Map<string, number>()
  const lowLinks = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const result: string[][] = []
  const visit = (vertex: string): void => {
    indexes.set(vertex, nextIndex)
    lowLinks.set(vertex, nextIndex)
    nextIndex += 1
    stack.push(vertex)
    onStack.add(vertex)
    for (const adjacent of edges.get(vertex) ?? []) {
      if (!indexes.has(adjacent)) {
        visit(adjacent)
        lowLinks.set(vertex, Math.min(lowLinks.get(vertex)!, lowLinks.get(adjacent)!))
      } else if (onStack.has(adjacent)) {
        lowLinks.set(vertex, Math.min(lowLinks.get(vertex)!, indexes.get(adjacent)!))
      }
    }
    if (lowLinks.get(vertex) !== indexes.get(vertex)) return
    const component: string[] = []
    while (stack.length > 0) {
      const current = stack.pop()!
      onStack.delete(current)
      component.push(current)
      if (current === vertex) break
    }
    component.sort(bytewiseCompare)
    result.push(component)
  }
  for (const vertex of vertices.sort(bytewiseCompare)) if (!indexes.has(vertex)) visit(vertex)
  return result.sort((left, right) => bytewiseCompare(JSON.stringify(left), JSON.stringify(right)))
}

function toWitness(observation: RuleOrderObservation): RuleOrderWitness {
  const { configuration, sourceXmlPath, logicalAddress, xmlNodeLogicalAddress, fields } = observation
  return { configuration, sourceXmlPath, logicalAddress, xmlNodeLogicalAddress, fields }
}

function copyDirection(direction: MutableDirection): RuleOrderDirection {
  return { ...direction, witnesses: [...direction.witnesses].sort(compareWitnesses) }
}

function compareWitnesses(left: RuleOrderWitness, right: RuleOrderWitness): number {
  return bytewiseCompare(
    `${left.configuration}\0${left.sourceXmlPath}\0${left.logicalAddress}\0${left.xmlNodeLogicalAddress}`,
    `${right.configuration}\0${right.sourceXmlPath}\0${right.logicalAddress}\0${right.xmlNodeLogicalAddress}`
  )
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
