import { yamlMappingEntries } from "./mappingTags"
import type { XmlRawValue } from "../xml/structure/rawCodec"
import { copyYAMLRuntimeMetadataDeep } from "./runtimeMetadata"

export type XmlAnomalyKind = "raw" | "invalid" | "important"

export interface XmlSemanticAnomalyAnnotation {
  readonly kind: "invalid" | "important"
  readonly occurrence: number
}

export interface XmlAnomalyAnnotation {
  readonly kind: XmlAnomalyKind
  readonly occurrence: number
  readonly target: "root" | "value" | "key"
  readonly logicalKey?: string
  readonly xml?: XmlRawValue
  readonly hasSemanticValue?: boolean
  readonly semantic?: XmlSemanticAnomalyAnnotation
}

export interface XmlAnomalyAnnotationEntry {
  readonly parent: object | undefined
  readonly key: string | number | undefined
  readonly annotation: XmlAnomalyAnnotation
}

export interface XmlAnomalyAnnotations {
  root(): XmlAnomalyAnnotation | undefined
  setRoot(annotation: XmlAnomalyAnnotation): void
  at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined
  keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined
  entries(): Iterable<XmlAnomalyAnnotationEntry>
  copy(source: object, target: object): void
  set(parent: object, key: string | number, annotation: XmlAnomalyAnnotation): void
  setKey(parent: object, runtimeKey: string, annotation: XmlAnomalyAnnotation): void
}

export interface XmlAnomalyAnnotationSnapshotEntry {
  readonly parentPath: readonly (string | number)[]
  readonly key: string | number
  readonly annotation: XmlAnomalyAnnotation
}

export interface XmlAnomalyAnnotationsSnapshot {
  readonly version: 1
  readonly root?: XmlAnomalyAnnotation
  readonly entries: readonly XmlAnomalyAnnotationSnapshotEntry[]
}

export interface XmlAnnotatedMappingEntry<T = unknown> {
  readonly logicalKey: string
  readonly value: T
  readonly keyAnnotation?: Omit<XmlAnomalyAnnotation, "target" | "logicalKey">
  readonly valueAnnotation?: Omit<XmlAnomalyAnnotation, "target" | "logicalKey">
}

interface IndexedXmlAnomalyAnnotation {
  readonly annotation: XmlAnomalyAnnotation
  readonly entryIndex: number
}

export class XmlAnomalyAnnotationTable implements XmlAnomalyAnnotations {
  #root: XmlAnomalyAnnotation | undefined
  #rootEntryIndex: number | undefined
  #values = new WeakMap<object, Map<string | number, IndexedXmlAnomalyAnnotation>>()
  #keys = new WeakMap<object, Map<string, IndexedXmlAnomalyAnnotation>>()
  #entries: XmlAnomalyAnnotationEntry[] = []

  root(): XmlAnomalyAnnotation | undefined {
    return this.#root
  }

  at(parent: object, key: string | number): XmlAnomalyAnnotation | undefined {
    return this.#values.get(parent)?.get(key)?.annotation
  }

  keyAt(parent: object, runtimeKey: string): XmlAnomalyAnnotation | undefined {
    return this.#keys.get(parent)?.get(runtimeKey)?.annotation
  }

  entries(): Iterable<XmlAnomalyAnnotationEntry> {
    return this.#entries
  }

  setRoot(annotation: XmlAnomalyAnnotation): void {
    this.#root = annotation
    this.#rootEntryIndex = this.#replaceEntry(
      { parent: undefined, key: undefined, annotation },
      this.#rootEntryIndex,
    )
  }

  set(parent: object, key: string | number, annotation: XmlAnomalyAnnotation): void {
    const values = this.#values.get(parent) ?? new Map<string | number, IndexedXmlAnomalyAnnotation>()
    const entryIndex = this.#replaceEntry(
      { parent, key, annotation },
      values.get(key)?.entryIndex,
    )
    values.set(key, { annotation, entryIndex })
    this.#values.set(parent, values)
  }

  setKey(parent: object, runtimeKey: string, annotation: XmlAnomalyAnnotation): void {
    const keys = this.#keys.get(parent) ?? new Map<string, IndexedXmlAnomalyAnnotation>()
    const entryIndex = this.#replaceEntry(
      { parent, key: runtimeKey, annotation },
      keys.get(runtimeKey)?.entryIndex,
    )
    keys.set(runtimeKey, { annotation, entryIndex })
    this.#keys.set(parent, keys)
  }

  copy(source: object, target: object): void {
    for (const [key, { annotation }] of this.#values.get(source) ?? []) {
      this.set(target, key, annotation)
    }
    for (const [key, { annotation }] of this.#keys.get(source) ?? []) {
      this.setKey(target, key, annotation)
    }
  }

  deleteSubtree(root: unknown): void {
    if (!isObject(root)) return
    const paths = new Map<object, readonly (string | number)[]>()
    collectObjectPaths(root, [], paths)
    this.#entries = this.#entries.filter(({ parent }) => parent === undefined || !paths.has(parent))
    this.#rebuildIndexes()
  }

  #rebuildIndexes(): void {
    this.#root = undefined
    this.#rootEntryIndex = undefined
    this.#values = new WeakMap()
    this.#keys = new WeakMap()
    for (const [entryIndex, entry] of this.#entries.entries()) {
      if (entry.parent === undefined || entry.key === undefined) {
        if (entry.annotation.target === "root") {
          this.#root = entry.annotation
          this.#rootEntryIndex = entryIndex
        }
        continue
      }
      if (entry.annotation.target === "key" && typeof entry.key === "string") {
        const keys = this.#keys.get(entry.parent) ?? new Map<string, IndexedXmlAnomalyAnnotation>()
        keys.set(entry.key, { annotation: entry.annotation, entryIndex })
        this.#keys.set(entry.parent, keys)
      } else if (entry.annotation.target === "value") {
        const values = this.#values.get(entry.parent) ?? new Map<string | number, IndexedXmlAnomalyAnnotation>()
        values.set(entry.key, { annotation: entry.annotation, entryIndex })
        this.#values.set(entry.parent, values)
      }
    }
  }

  #replaceEntry(next: XmlAnomalyAnnotationEntry, index: number | undefined): number {
    if (index === undefined) {
      this.#entries.push(next)
      return this.#entries.length - 1
    }
    this.#entries[index] = next
    return index
  }
}

export function createXmlAnomalyAnnotations(): XmlAnomalyAnnotationTable {
  return new XmlAnomalyAnnotationTable()
}

export function snapshotXmlAnomalyAnnotations(
  data: unknown,
  annotations: XmlAnomalyAnnotations,
): XmlAnomalyAnnotationsSnapshot {
  const paths = new Map<object, readonly (string | number)[]>()
  collectObjectPaths(data, [], paths)
  const entries: XmlAnomalyAnnotationSnapshotEntry[] = []
  for (const entry of annotations.entries()) {
    if (entry.parent === undefined || entry.key === undefined) continue
    const parentPath = paths.get(entry.parent)
    if (parentPath === undefined) {
      throw new Error("XML-аннотация ссылается на значение вне YAML-дерева")
    }
    entries.push({ parentPath, key: entry.key, annotation: entry.annotation })
  }
  const root = annotations.root()
  return {
    version: 1,
    ...(root === undefined ? {} : { root }),
    entries,
  }
}

export function restoreXmlAnomalyAnnotations(
  data: unknown,
  snapshot: XmlAnomalyAnnotationsSnapshot,
): XmlAnomalyAnnotationTable {
  if (snapshot.version !== 1) throw new Error(`Неизвестная версия XML-аннотаций: ${snapshot.version}`)
  const annotations = createXmlAnomalyAnnotations()
  if (snapshot.root !== undefined) annotations.setRoot(snapshot.root)
  for (const entry of snapshot.entries) {
    const parent = valueAtPath(data, entry.parentPath)
    if (!isObject(parent)) {
      throw new Error(`Не найден родитель XML-аннотации: /${entry.parentPath.join("/")}`)
    }
    if (entry.annotation.target === "key") {
      if (typeof entry.key !== "string") throw new Error("Ключ XML-аннотации должен быть строкой")
      annotations.setKey(parent, entry.key, entry.annotation)
    } else if (entry.annotation.target === "value") {
      annotations.set(parent, entry.key, entry.annotation)
    }
  }
  return annotations
}

export function isXmlAnomalyAnnotationsSnapshot(value: unknown): value is XmlAnomalyAnnotationsSnapshot {
  if (!isObject(value)) return false
  const candidate = value as { readonly version?: unknown; readonly entries?: unknown }
  return candidate.version === 1 && Array.isArray(candidate.entries)
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

/** Переносит out-of-band XML-аннотации между структурно соответствующими YAML-деревьями. */
export function copyXmlAnomalyAnnotationsDeep(
  annotations: XmlAnomalyAnnotations | undefined,
  source: unknown,
  target: unknown,
): void {
  if (annotations === undefined) return
  copyYAMLRuntimeMetadataDeep({
    source,
    target,
    sourceAnnotations: annotations,
    targetAnnotations: annotations as XmlAnomalyAnnotationTable,
  })
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

function isObject(value: unknown): value is object {
  return value !== null && typeof value === "object"
}

function collectObjectPaths(
  value: unknown,
  path: readonly (string | number)[],
  paths: Map<object, readonly (string | number)[]>,
): void {
  if (!isObject(value) || paths.has(value)) return
  paths.set(value, path)
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectObjectPaths(child, [...path, index], paths))
    return
  }
  for (const key of Object.keys(value)) {
    collectObjectPaths((value as Record<string, unknown>)[key], [...path, key], paths)
  }
}

function valueAtPath(value: unknown, path: readonly (string | number)[]): unknown {
  let current = value
  for (const segment of path) {
    if (!isObject(current)) return undefined
    current = (current as Record<string | number, unknown>)[segment]
  }
  return current
}
