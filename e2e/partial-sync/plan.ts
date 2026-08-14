import { createHash } from "node:crypto"
import type {
  ChildDeclaration,
  ScenarioFileChange,
  ScenarioMatrix,
  ScenarioOperation,
} from "./matrix/types"

type DependencyDeclaration = {
  readonly key: string
  readonly dependsOn: readonly string[]
}

export function buildScenarioPlan(matrix: ScenarioMatrix): readonly ScenarioOperation[] {
  assertUniqueDeclarationKeys(matrix)

  const rootKeys = new Set(matrix.roots.map(({ key }) => key))
  const roots = stableTopologicalSort(matrix.roots, rootKeys)
  const childKeys = new Set(matrix.children.map(({ key }) => key))
  const childDependencies = matrix.children.map((child) => ({
    ...child,
    dependsOn: childDependenciesFor(child, rootKeys, childKeys),
  }))
  const children = stableTopologicalSort(childDependencies, new Set([...rootKeys, ...childKeys]))
  const availableOwnerKeys = new Set([...rootKeys, ...childKeys])

  for (const form of matrix.forms) {
    assertKnownKey(form.ownerKey, availableOwnerKeys, form.key)
  }

  const creations: ScenarioOperation[] = [
    ...roots.map(({ key, changes }) => ({ key, kind: "create-object" as const, changes })),
    ...children.map(({ key, ownerKey, changes }) => ({
      key,
      kind: "add-child" as const,
      ownerKey,
      changes,
    })),
    ...matrix.forms.map(({ key, ownerKey, changes }) => ({
      key,
      kind: "add-form" as const,
      ownerKey,
      changes,
    })),
  ]
  const removals = creations.toReversed().map(reverseOperation)
  assertUniqueOperationKeys([...creations, ...removals])

  return [...creations, ...removals]
}

export function scenarioPlanHash(plan: readonly ScenarioOperation[]): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(plan))).digest("hex")
}

function childDependenciesFor(
  child: ChildDeclaration,
  rootKeys: ReadonlySet<string>,
  childKeys: ReadonlySet<string>,
): readonly string[] {
  assertKnownKey(child.ownerKey, new Set([...rootKeys, ...childKeys]), child.key)
  return [...new Set([child.ownerKey, ...child.dependsOn])]
}

function stableTopologicalSort<T extends DependencyDeclaration>(
  declarations: readonly T[],
  knownKeys: ReadonlySet<string>,
): readonly T[] {
  for (const declaration of declarations) {
    for (const dependency of declaration.dependsOn) {
      assertKnownKey(dependency, knownKeys, declaration.key)
    }
  }

  const pending = [...declarations]
  const result: T[] = []
  const completed = new Set<string>()

  while (pending.length > 0) {
    const index = pending.findIndex(({ dependsOn }) =>
      dependsOn.every((dependency) => completed.has(dependency) || !pending.some(({ key }) => key === dependency))
    )
    if (index < 0) {
      throw new Error(`Dependency cycle: ${pending.map(({ key }) => key).join(", ")}`)
    }
    const [next] = pending.splice(index, 1)
    result.push(next)
    completed.add(next.key)
  }

  return result
}

function reverseOperation(operation: ScenarioOperation): ScenarioOperation {
  return {
    key: `remove:${operation.key}`,
    kind: "remove",
    targetKey: operation.key,
    changes: operation.changes.map(reverseChange),
  }
}

function reverseChange(change: ScenarioFileChange): ScenarioFileChange {
  return { path: change.path, before: change.after, after: change.before }
}

function assertUniqueDeclarationKeys(matrix: ScenarioMatrix): void {
  const keys = [
    ...matrix.roots.map(({ key }) => key),
    ...matrix.children.map(({ key }) => key),
    ...matrix.forms.map(({ key }) => key),
  ]
  assertUniqueKeys(keys, "declaration")
}

function assertUniqueOperationKeys(operations: readonly ScenarioOperation[]): void {
  assertUniqueKeys(operations.map(({ key }) => key), "operation")
}

function assertUniqueKeys(keys: readonly string[], subject: string): void {
  const seen = new Set<string>()
  for (const key of keys) {
    if (seen.has(key)) throw new Error(`Duplicate ${subject} key: ${key}`)
    seen.add(key)
  }
}

function assertKnownKey(key: string, knownKeys: ReadonlySet<string>, consumerKey: string): void {
  if (!knownKeys.has(key)) {
    throw new Error(`Unknown dependency ${key} for ${consumerKey}`)
  }
}

function canonicalize(value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return { $bytes: Buffer.from(value).toString("base64") }
  }
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
