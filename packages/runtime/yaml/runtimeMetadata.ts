import { copyDoubleQuotedScalarMarks } from "./explicitString"
import { copyYAMLMappingKeyOrder } from "./mappingTags"
import {
  copyYAMLScalarTags,
  copyYAMLValueTag,
  type YAMLScalarTagKey,
  yamlScalarTagAt,
} from "./scalarTags"

interface YAMLRuntimeAnnotationReader<TAnnotation extends { readonly target: string }> {
  at(parent: object, key: string | number): TAnnotation | undefined
  keyAt(parent: object, runtimeKey: string): TAnnotation | undefined
  entries(): Iterable<{
    readonly parent: object | undefined
    readonly key: string | number | undefined
    readonly annotation: TAnnotation
  }>
}

interface YAMLRuntimeAnnotationWriter<TAnnotation extends { readonly target: string }> {
  set(parent: object, key: string | number, annotation: TAnnotation): void
  setKey(parent: object, runtimeKey: string, annotation: TAnnotation): void
}

export function copyYAMLRuntimeMetadata(
  source: object,
  target: object,
  keys?: ReadonlySet<YAMLScalarTagKey>,
): void {
  copySymbolProperties(source, target)
  copyYAMLScalarTags(source, target, keys)
  copyYAMLValueTag(source, target)
  copyYAMLMappingKeyOrder(source, target)
  copyDoubleQuotedScalarMarks(source, target, keys)
}

export function cloneYAMLContainer<T extends object>(source: T): T {
  const target = Object.assign(Array.isArray(source) ? [] : {}, source) as T
  copyYAMLRuntimeMetadata(source, target)
  return target
}

export function copyYAMLRuntimeMetadataDeep<TAnnotation extends { readonly target: string }>(params: {
  readonly source: unknown
  readonly target: unknown
  readonly sourceAnnotations?: YAMLRuntimeAnnotationReader<TAnnotation>
  readonly targetAnnotations?: YAMLRuntimeAnnotationWriter<TAnnotation>
}): void {
  if ((params.sourceAnnotations === undefined) !== (params.targetAnnotations === undefined)) {
    throw new Error("Для переноса XML-аннотаций нужны исходная и целевая таблицы")
  }
  if (!isObject(params.source) || !isObject(params.target)) return
  const copied = new WeakMap<object, WeakSet<object>>()

  const visit = (source: object, target: object): void => {
    const targets = copied.get(source) ?? new WeakSet<object>()
    if (targets.has(target)) return
    targets.add(target)
    copied.set(source, targets)

    const correspondingKeys = correspondingYAMLKeys(source, target)
    const retainedMetadataKeys = new Set(
      [...correspondingKeys].filter((key) => sameYAMLValue(valueAt(source, key), valueAt(target, key))),
    )
    copyYAMLRuntimeMetadata(source, target, retainedMetadataKeys)
    copyXmlAnnotationsForKeys(
      params.sourceAnnotations,
      source,
      target,
      retainedMetadataKeys,
      params.targetAnnotations,
    )

    for (const key of correspondingKeys) {
      const sourceChild = valueAt(source, key)
      const targetChild = valueAt(target, key)
      if (
        isObject(sourceChild) &&
        isObject(targetChild) &&
        sameContainerKind(sourceChild, targetChild) &&
        (!Array.isArray(sourceChild) || sameYAMLValue(sourceChild, targetChild))
      ) {
        visit(sourceChild, targetChild)
      }
    }
  }

  visit(params.source, params.target)
}

export function hasYAMLRuntimeMetadataAt<TAnnotation extends { readonly target: string }>(
  parent: object,
  key: YAMLScalarTagKey,
  annotations?: Pick<YAMLRuntimeAnnotationReader<TAnnotation>, "at" | "keyAt">,
): boolean {
  return yamlScalarTagAt(parent, key) !== undefined
    || annotations?.at(parent, key) !== undefined
    || (typeof key === "string" && annotations?.keyAt(parent, key) !== undefined)
}

function correspondingYAMLKeys(source: object, target: object): ReadonlySet<YAMLScalarTagKey> {
  const keys = new Set<YAMLScalarTagKey>()
  const targetKeys = Array.isArray(target) ? target.keys() : Object.keys(target)
  for (const key of targetKeys) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue
    const sourceChild = valueAt(source, key)
    const targetChild = valueAt(target, key)
    if (
      Object.is(sourceChild, targetChild)
      || (isObject(sourceChild) && isObject(targetChild) && sameContainerKind(sourceChild, targetChild))
    ) keys.add(key)
  }
  return keys
}

function copyXmlAnnotationsForKeys<TAnnotation extends { readonly target: string }>(
  sourceAnnotations: YAMLRuntimeAnnotationReader<TAnnotation> | undefined,
  source: object,
  target: object,
  keys: ReadonlySet<YAMLScalarTagKey>,
  targetAnnotations: YAMLRuntimeAnnotationWriter<TAnnotation> | undefined,
): void {
  if (sourceAnnotations === undefined || targetAnnotations === undefined) return
  for (const entry of sourceAnnotations.entries()) {
    if (entry.parent !== source || entry.key === undefined || !keys.has(entry.key)) continue
    if (entry.annotation.target === "key" && typeof entry.key === "string") {
      targetAnnotations.setKey(target, entry.key, entry.annotation)
    } else if (entry.annotation.target === "value") {
      targetAnnotations.set(target, entry.key, entry.annotation)
    }
  }
}

function valueAt(value: object, key: YAMLScalarTagKey): unknown {
  return (value as Record<YAMLScalarTagKey, unknown>)[key]
}

function sameContainerKind(left: object, right: object): boolean {
  return Array.isArray(left) === Array.isArray(right)
}

function sameYAMLValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (!isObject(left) || !isObject(right) || !sameContainerKind(left, right)) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key)
      && sameYAMLValue(valueAt(left, key), valueAt(right, key)))
}

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object"
}

function copySymbolProperties(source: object, target: object): void {
  for (const key of Object.getOwnPropertySymbols(source)) {
    const sourceDescriptor = Object.getOwnPropertyDescriptor(source, key)
    if (sourceDescriptor === undefined) continue
    const targetDescriptor = Object.getOwnPropertyDescriptor(target, key)
    if (targetDescriptor !== undefined && !sameSymbolValue(sourceDescriptor, targetDescriptor)) {
      throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
    }
    if (targetDescriptor !== undefined && targetDescriptor.configurable !== true) {
      if (!sameDescriptor(sourceDescriptor, targetDescriptor)) {
        throw new Error(`Несовместимая служебная Symbol-метка YAML: ${String(key)}`)
      }
      continue
    }
    Object.defineProperty(target, key, sourceDescriptor)
  }
}

function sameSymbolValue(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  if ("value" in left || "value" in right) {
    return "value" in left && "value" in right && Object.is(left.value, right.value)
  }
  return left.get === right.get && left.set === right.set
}

function sameDescriptor(left: PropertyDescriptor, right: PropertyDescriptor): boolean {
  return sameSymbolValue(left, right)
    && left.configurable === right.configurable
    && left.enumerable === right.enumerable
    && left.writable === right.writable
}
