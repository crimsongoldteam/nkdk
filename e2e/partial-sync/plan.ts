import { createHash } from "node:crypto"
import { createInitialScenarioLayers } from "./matrix/layers"
import type {
  ScenarioBlock,
  ScenarioFileContents,
  ScenarioLayer,
  ScenarioMatrix,
  ScenarioOperation,
} from "./matrix/types"

export function buildScenarioPlan(matrix: ScenarioMatrix): readonly ScenarioBlock[] {
  const layers = matrix.layers ?? createInitialScenarioLayers(matrix)
  assertUniqueKeys(layers.map(({ key }) => key), "layer")

  const blocks: ScenarioBlock[] = []
  const available = new Set<string>()
  assertUniqueKeys(layers.flatMap(({ operations }) => operations.map(({ key }) => key)), "operation")

  for (const layer of layers) {
    assertValidBulkBlockSize(layer)
    const operations = stableTopologicalSort(layer.operations, available)
    const probeIndex = operations.findIndex(({ key }) => key === layer.probeOperationKey)
    if (probeIndex < 0) {
      throw new Error(`Пробная операция ${layer.probeOperationKey} отсутствует в слое ${layer.key}`)
    }
    const probe = operations[probeIndex]
    const unavailableDependency = probe.dependsOn?.find((key) => !available.has(key))
    if (unavailableDependency !== undefined) {
      throw new Error(`Пробная операция ${probe.key} зависит от ${unavailableDependency}, доступного только после неё`)
    }
    blocks.push(block(layer, "probe", [probe]))
    available.add(probe.key)

    const bulk = operations.filter((_, index) => index !== probeIndex)
    for (const bulkBlock of createBulkBlocks(layer, bulk)) {
      assertDependenciesAvailable(bulkBlock.operations, available)
      blocks.push(bulkBlock)
      for (const operation of bulkBlock.operations) available.add(operation.key)
    }
  }

  assertUniqueKeys(blocks.map(({ key }) => key), "block")
  assertContinuousTransitions(blocks)
  return blocks
}

export function scenarioPlanHash(plan: readonly ScenarioBlock[]): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(plan))).digest("hex")
}

function block(
  layer: ScenarioLayer,
  kind: "probe" | "bulk" | `bulk:${number}`,
  operations: readonly ScenarioOperation[],
): ScenarioBlock {
  return {
    key: `${layer.key}:${kind}`,
    layerKey: layer.key,
    componentPath: layer.componentPath,
    operations,
  }
}

function createBulkBlocks(
  layer: ScenarioLayer,
  operations: readonly ScenarioOperation[],
): readonly ScenarioBlock[] {
  if (operations.length === 0) return []
  if (layer.bulkBlockSize === undefined) return [block(layer, "bulk", operations)]

  const blocks: ScenarioBlock[] = []
  for (let offset = 0; offset < operations.length; offset += layer.bulkBlockSize) {
    const index = blocks.length + 1
    blocks.push(block(layer, `bulk:${index}`, operations.slice(offset, offset + layer.bulkBlockSize)))
  }
  return blocks
}

function assertValidBulkBlockSize(layer: ScenarioLayer): void {
  if (layer.bulkBlockSize === undefined) return
  if (!Number.isInteger(layer.bulkBlockSize) || layer.bulkBlockSize <= 0) {
    throw new Error(`Слой ${layer.key}: bulkBlockSize должен быть положительным целым числом`)
  }
}

function stableTopologicalSort(
  operations: readonly ScenarioOperation[],
  available: ReadonlySet<string>,
): readonly ScenarioOperation[] {
  const localKeys = new Set(operations.map(({ key }) => key))
  for (const operation of operations) {
    for (const dependency of operation.dependsOn ?? []) {
      if (!localKeys.has(dependency) && !available.has(dependency)) {
        throw new Error(`Unknown dependency ${dependency} for ${operation.key}`)
      }
    }
  }

  const pending = [...operations]
  const result: ScenarioOperation[] = []
  const completed = new Set(available)
  while (pending.length > 0) {
    const index = pending.findIndex(({ dependsOn }) =>
      (dependsOn ?? []).every((dependency) => completed.has(dependency)))
    if (index < 0) throw new Error(`Dependency cycle: ${pending.map(({ key }) => key).join(", ")}`)
    const [next] = pending.splice(index, 1)
    result.push(next)
    completed.add(next.key)
  }
  return result
}

function assertDependenciesAvailable(
  operations: readonly ScenarioOperation[],
  initialAvailable: ReadonlySet<string>,
): void {
  const available = new Set(initialAvailable)
  for (const operation of operations) {
    for (const dependency of operation.dependsOn ?? []) {
      if (!available.has(dependency)) {
        throw new Error(`Операция ${operation.key} выполняется раньше зависимости ${dependency}`)
      }
    }
    available.add(operation.key)
  }
}

function assertContinuousTransitions(blocks: readonly ScenarioBlock[]): void {
  const previous = new Map<string, ScenarioFileContents | null>()
  for (const block of blocks) {
    for (const operation of block.operations) {
      for (const change of operation.changes) {
        if (previous.has(change.path) && !contentsEqual(previous.get(change.path) ?? null, change.before)) {
          throw new Error(`Разрыв переходов ${change.path} в операции ${operation.key}`)
        }
        previous.set(change.path, change.after)
      }
    }
  }
}

function contentsEqual(left: ScenarioFileContents | null, right: ScenarioFileContents | null): boolean {
  if (left instanceof Uint8Array && right instanceof Uint8Array) {
    return Buffer.from(left).equals(Buffer.from(right))
  }
  return left === right
}

function assertUniqueKeys(keys: readonly string[], subject: string): void {
  const seen = new Set<string>()
  for (const key of keys) {
    if (seen.has(key)) throw new Error(`Duplicate ${subject} key: ${key}`)
    seen.add(key)
  }
}

function canonicalize(value: unknown): unknown {
  if (value instanceof Uint8Array) return { $bytes: Buffer.from(value).toString("base64") }
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    )
  }
  return value
}
