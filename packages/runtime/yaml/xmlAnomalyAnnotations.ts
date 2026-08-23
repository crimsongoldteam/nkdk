import { yamlMappingEntries } from "./mappingTags"

export type XmlAnomalyKind = "raw" | "invalid" | "important"

export interface XmlAnomalyAnnotation {
  readonly kind: XmlAnomalyKind
  readonly occurrence: number
  readonly target: "root" | "value" | "key"
  readonly logicalKey?: string
}

export interface XmlAnomalyAnnotationEntry {
  readonly parent: object | undefined
  readonly key: string | number | undefined
  readonly annotation: XmlAnomalyAnnotation
}

export interface XmlAnomalyAnnotations {
  root(): XmlAnomalyAnnotation | undefined
  at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined
  keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined
  entries(): Iterable<XmlAnomalyAnnotationEntry>
  copy(source: object, target: object): void
}

export interface XmlAnnotatedMappingEntry<T = unknown> {
  readonly logicalKey: string
  readonly value: T
  readonly keyAnnotation?: Omit<XmlAnomalyAnnotation, "target" | "logicalKey">
  readonly valueAnnotation?: Omit<XmlAnomalyAnnotation, "target" | "logicalKey">
}

export class XmlAnomalyAnnotationTable implements XmlAnomalyAnnotations {
  #root: XmlAnomalyAnnotation | undefined
  #values = new WeakMap<object, Map<string | number, XmlAnomalyAnnotation>>()
  #keys = new WeakMap<object, Map<string, XmlAnomalyAnnotation>>()
  #entries: XmlAnomalyAnnotationEntry[] = []

  root(): XmlAnomalyAnnotation | undefined {
    return this.#root
  }

  at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined {
    return this.#values.get(parent)?.get(key)
  }

  keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined {
    return this.#keys.get(parent)?.get(runtimeKey)
  }

  entries(): Iterable<XmlAnomalyAnnotationEntry> {
    return this.#entries
  }

  setRoot(annotation: XmlAnomalyAnnotation): void {
    this.#root = annotation
    this.#entries.push({ parent: undefined, key: undefined, annotation })
  }

  set(parent: object, key: string | number, annotation: XmlAnomalyAnnotation): void {
    const values = this.#values.get(parent) ?? new Map<string | number, XmlAnomalyAnnotation>()
    values.set(key, annotation)
    this.#values.set(parent, values)
    this.#entries.push({ parent, key, annotation })
  }

  setKey(parent: object, runtimeKey: string, annotation: XmlAnomalyAnnotation): void {
    const keys = this.#keys.get(parent) ?? new Map<string, XmlAnomalyAnnotation>()
    keys.set(runtimeKey, annotation)
    this.#keys.set(parent, keys)
    this.#entries.push({ parent, key: runtimeKey, annotation })
  }

  copy(source: object, target: object): void {
    for (const [key, annotation] of this.#values.get(source) ?? []) this.set(target, key, annotation)
    for (const [key, annotation] of this.#keys.get(source) ?? []) this.setKey(target, key, annotation)
  }
}

export function createXmlAnomalyAnnotations(): XmlAnomalyAnnotationTable {
  return new XmlAnomalyAnnotationTable()
}

export function copyXmlAnomalyAnnotationsForParent(
  source: XmlAnomalyAnnotations,
  sourceParent: object,
  targetParent: object,
  target: XmlAnomalyAnnotationTable,
): void {
  for (const entry of source.entries()) {
    if (entry.parent !== sourceParent || entry.key === undefined) continue
    if (entry.annotation.target === "key" && typeof entry.key === "string") {
      target.setKey(targetParent, entry.key, entry.annotation)
      continue
    }
    if (entry.annotation.target === "value") target.set(targetParent, entry.key, entry.annotation)
  }
}

export function xmlAnnotatedMappingEntries(
  mapping: Record<string, unknown>,
  annotations: XmlAnomalyAnnotations,
): [string, unknown][] {
  return yamlMappingEntries(mapping).map(([runtimeKey, value]) => [
    annotations.keyAt(mapping, runtimeKey)?.logicalKey ?? runtimeKey,
    value,
  ])
}

export function appendXmlAnnotatedMappingEntry<T>(
  mapping: Record<string, T>,
  annotations: XmlAnomalyAnnotationTable,
  entry: XmlAnnotatedMappingEntry<T>,
): string {
  const runtimeKey = Object.prototype.hasOwnProperty.call(mapping, entry.logicalKey)
    ? uniqueXmlAnnotationRuntimeKey(mapping)
    : entry.logicalKey
  Object.defineProperty(mapping, runtimeKey, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: entry.value,
  })
  if (entry.keyAnnotation !== undefined) {
    annotations.setKey(mapping, runtimeKey, {
      ...entry.keyAnnotation,
      target: "key",
      logicalKey: entry.logicalKey,
    })
  }
  if (entry.valueAnnotation !== undefined) {
    annotations.set(mapping, runtimeKey, {
      ...entry.valueAnnotation,
      target: "value",
    })
  }
  return runtimeKey
}

function uniqueXmlAnnotationRuntimeKey(mapping: Record<string, unknown>): string {
  let index = 1
  while (Object.prototype.hasOwnProperty.call(mapping, `__NKDK_XML_ANOMALY_KEY_${index}__`)) index += 1
  return `__NKDK_XML_ANOMALY_KEY_${index}__`
}
