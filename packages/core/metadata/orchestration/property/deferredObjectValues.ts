import type { DeferredRulePathSegment } from "./importYamlTypes"

export interface DeferredValuePath {
  readonly valuePath: readonly (string | number)[]
  readonly rulePath: readonly DeferredRulePathSegment[]
}

export type DeferredObjectTarget =
  | { readonly object: Record<string, unknown>; readonly key: string }
  | { readonly object: unknown[]; readonly key: number }

export interface DeferredObjectValue extends DeferredValuePath {
  readonly target: DeferredObjectTarget
}

type DeferredContainer = Record<string, unknown> | unknown[]

export function bindDeferredObjectValues(
  root: unknown,
  paths: readonly DeferredValuePath[]
): DeferredObjectValue[] {
  return paths.map((path) => {
    if (path.valuePath.length === 0) throw deferredError(path, "Нельзя связать корень дерева")
    const key = path.valuePath[path.valuePath.length - 1]
    const object = readContainer(root, path.valuePath.slice(0, -1), path)
    assertOwnKey(object, key, path)

    const target: DeferredObjectTarget = Array.isArray(object)
      ? { object, key: requireArrayKey(key, path) }
      : { object, key: requireObjectKey(key, path) }

    return {
      valuePath: [...path.valuePath],
      rulePath: path.rulePath.map((segment) => ({ ...segment })),
      target,
    }
  })
}

export function finalizeDeferredObjectValues(params: {
  root: unknown
  deferred: readonly DeferredObjectValue[]
  finalize(value: { deferred: DeferredObjectValue; value: unknown }): unknown
}): void {
  for (const deferred of params.deferred) {
    const currentOwner = readContainer(params.root, deferred.valuePath.slice(0, -1), deferred)
    if (currentOwner !== deferred.target.object) {
      throw deferredError(deferred, "Связанная цель больше не принадлежит итоговому дереву")
    }
    assertOwnKey(currentOwner, deferred.target.key, deferred)
    writeTarget(
      deferred.target,
      params.finalize({
        deferred,
        value: readTarget(deferred.target),
      })
    )
  }
}

function readContainer(
  root: unknown,
  path: readonly (string | number)[],
  deferred: DeferredValuePath
): DeferredContainer {
  let current = root
  for (const segment of path) {
    const container = asContainer(current)
    if (container === undefined) throw deferredError(deferred, "Путь проходит через не-контейнер")
    assertOwnKey(container, segment, deferred)
    current = readContainerValue(container, segment, deferred)
  }
  const container = asContainer(current)
  if (container === undefined) throw deferredError(deferred, "Владелец значения не является контейнером")
  return container
}

function asContainer(value: unknown): DeferredContainer | undefined {
  if (Array.isArray(value)) return value
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined
}

function assertOwnKey(
  object: DeferredContainer,
  key: string | number | undefined,
  deferred: DeferredValuePath
): asserts key is string | number {
  if (key === undefined) throw deferredError(deferred, "Отсутствует ключ значения")
  if (Array.isArray(object)) {
    const index = requireArrayKey(key, deferred)
    if (!Object.prototype.hasOwnProperty.call(object, index)) {
      throw deferredError(deferred, "Не найден индекс массива")
    }
    return
  }
  const property = requireObjectKey(key, deferred)
  if (!Object.prototype.hasOwnProperty.call(object, property)) {
    throw deferredError(deferred, "Не найден ключ объекта")
  }
}

function requireArrayKey(key: string | number, deferred: DeferredValuePath): number {
  if (typeof key !== "number") throw deferredError(deferred, "Для массива требуется числовой индекс")
  return key
}

function requireObjectKey(key: string | number, deferred: DeferredValuePath): string {
  if (typeof key !== "string") throw deferredError(deferred, "Для объекта требуется строковый ключ")
  return key
}

function readContainerValue(
  object: DeferredContainer,
  key: string | number,
  deferred: DeferredValuePath
): unknown {
  return Array.isArray(object)
    ? object[requireArrayKey(key, deferred)]
    : object[requireObjectKey(key, deferred)]
}

function readTarget(target: DeferredObjectTarget): unknown {
  return Array.isArray(target.object)
    ? target.object[requireBoundArrayKey(target)]
    : target.object[requireBoundObjectKey(target)]
}

function writeTarget(target: DeferredObjectTarget, value: unknown): void {
  if (Array.isArray(target.object)) {
    target.object[requireBoundArrayKey(target)] = value
    return
  }
  target.object[requireBoundObjectKey(target)] = value
}

function requireBoundArrayKey(target: DeferredObjectTarget): number {
  if (typeof target.key !== "number") throw new Error("Некорректная связанная цель массива")
  return target.key
}

function requireBoundObjectKey(target: DeferredObjectTarget): string {
  if (typeof target.key !== "string") throw new Error("Некорректная связанная цель объекта")
  return target.key
}

function deferredError(deferred: DeferredValuePath, message: string): Error {
  return new Error(
    `${message}: valuePath=${printableValuePath(deferred.valuePath)}, rulePath=${printableRulePath(deferred.rulePath)}`
  )
}

function printableValuePath(path: readonly (string | number)[]): string {
  return `/${path.map(String).join("/")}`
}

function printableRulePath(path: readonly DeferredRulePathSegment[]): string {
  return `/${path
    .map(({ propertyKey, nestedItemType }) =>
      nestedItemType === undefined ? propertyKey : `${propertyKey}:${nestedItemType}`
    )
    .join("/")}`
}
