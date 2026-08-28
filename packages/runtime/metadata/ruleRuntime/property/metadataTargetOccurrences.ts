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
import { isMDObjectRefUuid } from "../../helpers/mdObjectRefUuid"
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
  readonly allowUnresolvedUuid?: boolean
}

export function exportMetadataTargetOccurrencesToYAML(params: MetadataTargetTransformationParams): unknown {
  let result = params.value
  for (const occurrence of params.occurrences) {
    if (occurrence.representation.kind !== "canonical") continue
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
  return result
}

export function importMetadataTargetOccurrencesFromYAML(params: MetadataTargetTransformationParams): unknown {
  let result = params.value
  for (const occurrence of params.occurrences) {
    if (occurrence.representation.kind !== "canonical") continue
    const text = occurrence.representation.canonical
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
    if (params.allowUnresolvedUuid === true && isMDObjectRefUuid(text)) continue
    throw new Error(parsed.message)
  }
  return result
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
