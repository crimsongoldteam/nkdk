import { copyDoubleQuotedScalarMarks } from "./explicitString"
import { copyYAMLMappingKeyOrder } from "./mappingTags"
import { copyYAMLScalarTags, type YAMLScalarTagKey } from "./scalarTags"
import type {
  XmlAnomalyAnnotations,
  XmlAnomalyAnnotationTable,
} from "./xmlAnomalyAnnotations"

export function copyYAMLRuntimeMetadata(
  source: object,
  target: object,
  keys?: ReadonlySet<YAMLScalarTagKey>,
): void {
  copySymbolProperties(source, target)
  copyYAMLScalarTags(source, target, keys)
  copyYAMLMappingKeyOrder(source, target)
  copyDoubleQuotedScalarMarks(source, target, keys)
}

export function cloneYAMLContainer<T extends object>(source: T): T {
  const target = Object.assign(Array.isArray(source) ? [] : {}, source) as T
  copyYAMLRuntimeMetadata(source, target)
  return target
}

export function copyYAMLRuntimeMetadataDeep(params: {
  readonly source: unknown
  readonly target: unknown
  readonly sourceAnnotations?: XmlAnomalyAnnotations
  readonly targetAnnotations?: XmlAnomalyAnnotationTable
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
    copyYAMLRuntimeMetadata(source, target, correspondingKeys)
    copyXmlAnnotationsForKeys(params.sourceAnnotations, source, target, correspondingKeys, params.targetAnnotations)

    for (const key of correspondingKeys) {
      const sourceChild = valueAt(source, key)
      const targetChild = valueAt(target, key)
      if (isObject(sourceChild) && isObject(targetChild) && sameContainerKind(sourceChild, targetChild)) {
        visit(sourceChild, targetChild)
      }
    }
  }

  visit(params.source, params.target)
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

function copyXmlAnnotationsForKeys(
  sourceAnnotations: XmlAnomalyAnnotations | undefined,
  source: object,
  target: object,
  keys: ReadonlySet<YAMLScalarTagKey>,
  targetAnnotations: XmlAnomalyAnnotationTable | undefined,
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
