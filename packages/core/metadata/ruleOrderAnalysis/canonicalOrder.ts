import type { RuleOrderObservation, RuleOrderSource } from "./types"

export interface CanonicalRuleOrder {
  source: RuleOrderSource
  propertyKeys: readonly string[]
  observationCount: number
}

export function deriveCanonicalRuleOrders(
  observations: readonly RuleOrderObservation[]
): readonly CanonicalRuleOrder[] {
  const byCandidate = new Map<string, RuleOrderObservation[]>()
  for (const observation of observations) {
    const group = byCandidate.get(observation.source.candidate) ?? []
    group.push(observation)
    byCandidate.set(observation.source.candidate, group)
  }

  return [...byCandidate]
    .sort(([left], [right]) => bytewiseCompare(left, right))
    .map(([, group]) => deriveCanonicalRuleOrder(group))
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

function deriveCanonicalRuleOrder(observations: readonly RuleOrderObservation[]): CanonicalRuleOrder {
  const first = observations[0]
  if (first === undefined) throw new Error("Нельзя вычислить порядок без наблюдений")
  assertConsistentSources(observations, first.source)

  const declarationKeys = [...first.source.declarationOrder]
  const declarationSet = new Set(declarationKeys)
  if (declarationSet.size !== declarationKeys.length) {
    throw new Error(`В ${first.source.candidate} повторяется объявленный ключ свойства`)
  }
  const observedKeys = new Set<string>()

  for (const observation of observations) {
    for (const key of observation.fields) {
      if (!declarationSet.has(key)) {
        throw new Error(`Наблюдение ${observation.source.candidate} содержит неизвестный ключ ${key}`)
      }
      observedKeys.add(key)
    }
    if (new Set(observation.fields).size !== observation.fields.length) {
      throw new Error(`В наблюдении ${observation.logicalAddress} повторяется ключ свойства`)
    }
  }

  const adjacency = new Map([...observedKeys].map((key) => [key, new Set<string>()]))
  const indegree = new Map([...observedKeys].map((key) => [key, 0]))
  for (const observation of observations) {
    for (let left = 0; left < observation.fields.length; left += 1) {
      for (let right = left + 1; right < observation.fields.length; right += 1) {
        addEdge(observation.fields[left]!, observation.fields[right]!, adjacency, indegree, first.source)
      }
    }
  }

  const compareKeys = keyComparator(first.source)
  const available = [...observedKeys].filter((key) => indegree.get(key) === 0).sort(compareKeys)
  const propertyKeys: string[] = []
  while (available.length > 0) {
    const key = available.shift()!
    propertyKeys.push(key)
    for (const adjacent of adjacency.get(key) ?? []) {
      const nextIndegree = indegree.get(adjacent)! - 1
      indegree.set(adjacent, nextIndegree)
      if (nextIndegree === 0) {
        available.push(adjacent)
        available.sort(compareKeys)
      }
    }
  }
  if (propertyKeys.length !== observedKeys.size) {
    const remaining = [...observedKeys].filter((key) => !propertyKeys.includes(key)).sort(compareKeys)
    throw new Error(`В порядке ${first.source.candidate} обнаружен цикл: ${remaining.join(", ")}`)
  }
  for (const observation of observations) assertObservationSubsequence({ order: propertyKeys, observation })
  return { source: first.source, propertyKeys, observationCount: observations.length }
}

function addEdge(
  before: string,
  after: string,
  adjacency: Map<string, Set<string>>,
  indegree: Map<string, number>,
  source: RuleOrderSource
): void {
  if (adjacency.get(after)?.has(before) === true) {
    throw new Error(`В ${source.candidate} противоречивый порядок ${before} и ${after}`)
  }
  const adjacent = adjacency.get(before)!
  if (adjacent.has(after)) return
  adjacent.add(after)
  indegree.set(after, indegree.get(after)! + 1)
}

function assertConsistentSources(
  observations: readonly RuleOrderObservation[],
  source: RuleOrderSource
): void {
  const expected = JSON.stringify(source)
  for (const observation of observations) {
    if (JSON.stringify(observation.source) !== expected) {
      throw new Error(`Несогласованные данные source для ${source.candidate}`)
    }
  }
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
