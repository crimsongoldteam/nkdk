import type { RuleOrderObservation, RuleOrderSource } from "./types"

export interface CanonicalRuleOrder {
  source: RuleOrderSource
  propertyKeys: readonly string[]
  observationCount: number
}

export function deriveCanonicalRuleOrders(
  observations: readonly RuleOrderObservation[]
): readonly CanonicalRuleOrder[] {
  const aggregate = createCanonicalRuleOrderAggregate()
  for (const observation of observations) aggregate.accept(observation)
  return aggregate.finish()
}

interface CanonicalRuleState {
  source: RuleOrderSource
  sourceJson: string
  declarationSet: ReadonlySet<string>
  observedKeys: Set<string>
  adjacency: Map<string, Set<string>>
  observationCount: number
}

export function createCanonicalRuleOrderAggregate() {
  const states = new Map<string, CanonicalRuleState>()
  return {
    accept(observation: RuleOrderObservation): void {
      const candidate = observation.source.candidate
      const state = states.get(candidate) ?? createCanonicalRuleState(observation.source)
      if (state.sourceJson !== JSON.stringify(observation.source)) {
        throw new Error(`Несогласованные данные source для ${candidate}`)
      }
      if (new Set(observation.fields).size !== observation.fields.length) {
        throw new Error(`В наблюдении ${observation.logicalAddress} повторяется ключ свойства`)
      }
      for (const key of observation.fields) {
        if (!state.declarationSet.has(key)) {
          throw new Error(`Наблюдение ${candidate} содержит неизвестный ключ ${key}`)
        }
        state.observedKeys.add(key)
        if (!state.adjacency.has(key)) state.adjacency.set(key, new Set())
      }
      for (let left = 0; left < observation.fields.length; left += 1) {
        for (let right = left + 1; right < observation.fields.length; right += 1) {
          addStreamingEdge(
            observation.fields[left]!,
            observation.fields[right]!,
            state.adjacency,
            state.source
          )
        }
      }
      state.observationCount += 1
      states.set(candidate, state)
    },
    finish(): readonly CanonicalRuleOrder[] {
      return [...states]
        .sort(([left], [right]) => bytewiseCompare(left, right))
        .map(([, state]) => finishCanonicalRuleState(state))
    },
  }
}

export function assertObservationSubsequence(params: {
  order: readonly string[]
  observation: RuleOrderObservation
}): void {
  let previousIndex = -1
  for (const key of params.observation.fields) {
    const index = params.order.indexOf(key)
    if (index <= previousIndex) {
      throw new Error(
        `Наблюдение ${params.observation.source.candidate} из ${params.observation.configuration} ` +
          `(${params.observation.sourceXmlPath}) не является подпоследовательностью порядка: ` +
          params.observation.fields.join(", ")
      )
    }
    previousIndex = index
  }
}

function createCanonicalRuleState(source: RuleOrderSource): CanonicalRuleState {
  const declarationKeys = [...source.declarationOrder]
  const declarationSet = new Set(declarationKeys)
  if (declarationSet.size !== declarationKeys.length) {
    throw new Error(`В ${source.candidate} повторяется объявленный ключ свойства`)
  }
  return {
    source,
    sourceJson: JSON.stringify(source),
    declarationSet,
    observedKeys: new Set(),
    adjacency: new Map(),
    observationCount: 0,
  }
}

function finishCanonicalRuleState(state: CanonicalRuleState): CanonicalRuleOrder {
  const indegree = new Map([...state.observedKeys].map((key) => [key, 0]))
  for (const adjacent of state.adjacency.values()) {
    for (const after of adjacent) indegree.set(after, indegree.get(after)! + 1)
  }
  const compareKeys = keyComparator(state.source)
  const available = [...state.observedKeys].filter((key) => indegree.get(key) === 0).sort(compareKeys)
  const propertyKeys: string[] = []
  while (available.length > 0) {
    const key = available.shift()!
    propertyKeys.push(key)
    for (const adjacent of state.adjacency.get(key) ?? []) {
      const nextIndegree = indegree.get(adjacent)! - 1
      indegree.set(adjacent, nextIndegree)
      if (nextIndegree === 0) {
        available.push(adjacent)
        available.sort(compareKeys)
      }
    }
  }
  if (propertyKeys.length !== state.observedKeys.size) {
    const remaining = [...state.observedKeys].filter((key) => !propertyKeys.includes(key)).sort(compareKeys)
    throw new Error(`В порядке ${state.source.candidate} обнаружен цикл: ${remaining.join(", ")}`)
  }
  return { source: state.source, propertyKeys, observationCount: state.observationCount }
}

function addStreamingEdge(
  before: string,
  after: string,
  adjacency: Map<string, Set<string>>,
  source: RuleOrderSource
): void {
  if (adjacency.get(after)?.has(before) === true) {
    throw new Error(`В ${source.candidate} противоречивый порядок ${before} и ${after}`)
  }
  const adjacent = adjacency.get(before)!
  if (adjacent.has(after)) return
  adjacent.add(after)
}

function keyComparator(source: RuleOrderSource): (left: string, right: string) => number {
  const declarationPositions = new Map(source.declarationOrder.map((key, index) => [key, index]))
  return (left, right) => {
    const declarationComparison = declarationPositions.get(left)! - declarationPositions.get(right)!
    if (declarationComparison !== 0) return declarationComparison
    return bytewiseCompare(left, right)
  }
}

function bytewiseCompare(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
