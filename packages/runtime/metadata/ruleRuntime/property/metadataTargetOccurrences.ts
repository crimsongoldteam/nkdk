import type { YamlPath } from "../../diagnostics/types"
import {
  formatMetadataTargetToYAML,
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "../metadataTarget"
import type {
  MetadataTargetConstraint,
  MetadataTargetOwner,
} from "../metadataTarget/types"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"
import type { XmlAnomalyAnnotation, XmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"
import { isMetadataTargetUuid } from "../../helpers/mdObjectRefUuid"
import type { PropertyRule } from "./types"

export type MetadataTargetLocation =
  | { readonly kind: "value"; readonly path: YamlPath }
  | {
      readonly kind: "key"
      readonly path: YamlPath
      readonly key: string
    }

export type MetadataTargetRepresentation =
  { readonly kind: "canonical"; readonly canonical: string }

export interface MetadataTargetOccurrence {
  readonly location: MetadataTargetLocation
  readonly constraint: MetadataTargetConstraint
  readonly representation: MetadataTargetRepresentation
  setValue(nextValue: string): void
}

export type MetadataTargetOccurrencesFunction = (params: {
  readonly value: unknown
  readonly representation: "model" | "yaml"
  readonly yamlPath: YamlPath
  readonly propRule: PropertyRule
  readonly owner?: MetadataTargetOwner
}) => readonly MetadataTargetOccurrence[]

interface MetadataTargetTransformationParams {
  readonly value: unknown
  readonly occurrences: readonly MetadataTargetOccurrence[]
  readonly owner?: MetadataTargetOwner
  readonly yaml?: unknown
  readonly annotations?: XmlAnomalyAnnotations
}

export type MetadataTargetUuidContract =
  | { readonly kind: "none" }
  | { readonly kind: "accepted"; readonly annotation: XmlAnomalyAnnotation; readonly text: string }
  | { readonly kind: "required"; readonly text: string }
  | { readonly kind: "unnecessary"; readonly annotation: XmlAnomalyAnnotation; readonly text: string }

export interface MetadataTargetYAMLProjection {
  readonly value: unknown
  readonly uuidOccurrences: readonly MetadataTargetOccurrence[]
}

export function projectMetadataTargetOccurrencesToYAML(
  params: MetadataTargetTransformationParams,
): MetadataTargetYAMLProjection {
  let result = params.value
  const uuidOccurrences: MetadataTargetOccurrence[] = []
  for (const occurrence of params.occurrences) {
    if (occurrence.representation.kind !== "canonical") continue
    if (isMetadataTargetUuid(occurrence.representation.canonical)) {
      uuidOccurrences.push(occurrence)
      continue
    }
    try {
      const nextValue = formatMetadataTargetToYAML({
        canonical: occurrence.representation.canonical,
        constraint: metadataTargetConstraintForOwner(occurrence.constraint, params.owner),
        owner: params.owner,
      })
      occurrence.setValue(nextValue)
      if (typeof params.value === "string" && params.occurrences.length === 1) result = nextValue
    } catch {
      // Неизвестная или несовместимая цель остаётся в исходной канонической
      // записи. Валидатор затем адресно пометит её как invalid.
      occurrence.setValue(occurrence.representation.canonical)
      if (typeof params.value === "string" && params.occurrences.length === 1) {
        result = occurrence.representation.canonical
      }
    }
  }
  return { value: result, uuidOccurrences }
}

export function exportMetadataTargetOccurrencesToYAML(params: MetadataTargetTransformationParams): unknown {
  return projectMetadataTargetOccurrencesToYAML(params).value
}

export function importMetadataTargetOccurrencesFromYAML(params: MetadataTargetTransformationParams): unknown {
  let result = params.value
  for (const occurrence of params.occurrences) {
    if (occurrence.representation.kind !== "canonical") continue
    const uuidContract = metadataTargetUuidContractForOccurrence(params, occurrence)
    if (uuidContract.kind === "required") {
      throw new Error("UUID metadata-ссылки требует !xml/uuid")
    }
    if (uuidContract.kind === "unnecessary") {
      throw new Error("!xml/uuid допустим только для UUID или UUID.UUID metadata-ссылки")
    }
    if (uuidContract.kind === "accepted") {
      occurrence.setValue(uuidContract.text)
      if (typeof params.value === "string" && params.occurrences.length === 1) result = uuidContract.text
      continue
    }
    const annotation = annotationForOccurrence(params, occurrence)
    const text = occurrence.location.kind === "key" && annotation?.logicalKey !== undefined
      ? annotation.logicalKey
      : occurrence.representation.canonical
    const constraint = metadataTargetConstraintForOwner(occurrence.constraint, params.owner)
    const parsed = parseMetadataTargetFromYAML({ value: text, constraint, owner: params.owner })
    if (parsed.ok) {
      occurrence.setValue(parsed.canonical)
      if (typeof params.value === "string" && params.occurrences.length === 1) result = parsed.canonical
      continue
    }
    if (isTranslateOnlyConstraint(occurrence.constraint)) {
      const model = parseMetadataTargetFromModel({ canonical: text, constraint, owner: params.owner })
      if (!model.ok) continue
    }
    throw new Error(parsed.message)
  }
  return result
}

export function metadataTargetUuidContractForOccurrence(
  params: Pick<MetadataTargetTransformationParams, "yaml" | "annotations">,
  occurrence: MetadataTargetOccurrence,
): MetadataTargetUuidContract {
  const annotation = annotationForOccurrence(params, occurrence)
  const text = occurrence.location.kind === "key" && annotation?.logicalKey !== undefined
    ? annotation.logicalKey
    : occurrence.representation.canonical
  if (isMetadataTargetUuid(text)) {
    return annotation?.kind === "uuid"
      ? { kind: "accepted", annotation, text }
      : { kind: "required", text }
  }
  return annotation?.kind === "uuid"
    ? { kind: "unnecessary", annotation, text }
    : { kind: "none" }
}

function annotationForOccurrence(
  params: Pick<MetadataTargetTransformationParams, "yaml" | "annotations">,
  occurrence: MetadataTargetOccurrence,
): XmlAnomalyAnnotation | undefined {
  const annotations = params.annotations
  if (annotations === undefined) return undefined
  const location = occurrence.location
  return location.kind === "key"
    ? annotationAtMappingKey(params.yaml, location.path, location.key, annotations)
    : annotationAtValue(params.yaml, location.path, annotations)
}

function annotationAtMappingKey(
  yaml: unknown,
  path: YamlPath,
  key: string,
  annotations: XmlAnomalyAnnotations,
): XmlAnomalyAnnotation | undefined {
  const mapping = valueAtPath(yaml, path)
  return isRecord(mapping) ? annotations.keyAt(mapping, key) : undefined
}

function annotationAtValue(
  yaml: unknown,
  path: YamlPath,
  annotations: XmlAnomalyAnnotations,
): XmlAnomalyAnnotation | undefined {
  const key = path.at(-1)
  if (key === undefined) return annotations.root()
  const parent = valueAtPath(yaml, path.slice(0, -1))
  return typeof parent === "object" && parent !== null ? annotations.at(parent, key) : undefined
}

function valueAtPath(value: unknown, path: YamlPath): unknown {
  let current = value
  for (const segment of path) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Record<string | number, unknown>)[segment]
  }
  return current
}

export function assignMetadataTargetUuidAnnotations(params: {
  readonly yaml: unknown
  readonly annotations: XmlAnomalyAnnotations
  readonly occurrences: readonly MetadataTargetOccurrence[]
}): void {
  for (const occurrence of params.occurrences) {
    const location = occurrence.location
    if (location.kind === "key") {
      const mapping = valueAtPath(params.yaml, location.path)
      if (!isRecord(mapping)) throw new Error(`Не найден YAML-контейнер UUID-ключа: /${location.path.join("/")}`)
      params.annotations.setKey(mapping, location.key, {
        kind: "uuid",
        occurrence: 1,
        target: "key",
        logicalKey: location.key,
      })
      continue
    }
    const key = location.path.at(-1)
    if (key === undefined) throw new Error("!xml/uuid недопустим на корне YAML")
    const parent = valueAtPath(params.yaml, location.path.slice(0, -1))
    if (typeof parent !== "object" || parent === null) {
      throw new Error(`Не найден YAML-контейнер UUID-значения: /${location.path.join("/")}`)
    }
    params.annotations.set(parent, key, { kind: "uuid", occurrence: 1, target: "value" })
  }
}

export function cloneMetadataTargetValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const result = value.map(cloneMetadataTargetValue)
    copyYAMLRuntimeMetadata(value, result)
    return result
  }
  if (!isRecord(value)) return value
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) result[key] = cloneMetadataTargetValue(item)
  copyYAMLRuntimeMetadata(value, result)
  return result
}

export function renameMetadataTargetMappingKey(
  parent: Record<string, unknown>,
  currentKey: string,
  nextKey: string,
): void {
  if (currentKey === nextKey) return
  const entries = Object.entries(parent).map(([key, value]) => [
    key === currentKey ? nextKey : key,
    value,
  ] as const)
  for (const key of Object.keys(parent)) delete parent[key]
  for (const [key, value] of entries) parent[key] = value
}

export function metadataTargetConstraintForOwner(
  constraint: MetadataTargetConstraint,
  owner: MetadataTargetOwner | undefined,
): MetadataTargetConstraint {
  if (constraint.kind !== "member" || constraint.owner !== "type") return constraint
  const { typeProperty: _typeProperty, ...rest } = constraint
  return { ...rest, owner: owner === undefined ? "explicit" : "this" }
}

function isTranslateOnlyConstraint(constraint: MetadataTargetConstraint): boolean {
  return (constraint.kind === "dataTable" || constraint.kind === "dataTableField")
    && constraint.validation === "translateOnly"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
