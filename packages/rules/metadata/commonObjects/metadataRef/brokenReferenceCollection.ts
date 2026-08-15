import { xmlAnomalyTagValue } from "@nkdk/runtime"
import { Type, type TSchema } from "typebox"
import type {
  BrokenXMLReferenceExportResult,
  BrokenXMLReferenceImportResult,
  BrokenXMLReferenceLocation,
} from "@nkdk/runtime/rule-kit"

export interface IndexedBrokenReference {
  readonly index: number
  readonly value: string
}

export function indexedBrokenStringReferences(
  values: readonly unknown[],
  accepts: (value: string) => boolean,
): readonly IndexedBrokenReference[] {
  return values.flatMap((value, index) =>
    typeof value === "string" && accepts(value) ? [{ index, value }] : [])
}

export function normalizeImportedBrokenReferenceCollection(
  yamlValue: readonly unknown[],
  broken: readonly IndexedBrokenReference[],
): BrokenXMLReferenceImportResult | undefined {
  if (broken.length === 0) return undefined
  const normalized = [...yamlValue]
  for (const { index, value } of broken) normalized[index] = xmlAnomalyTagValue("xml/reference", value)
  return {
    yamlValue: normalized,
    taggedLocations: broken.map(({ index }) => ({ kind: "value", path: [index] })),
  }
}

export function prepareBrokenReferenceCollectionExport(params: {
  readonly yamlValue: unknown
  readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  readonly payload: (value: unknown) => string
}): BrokenXMLReferenceExportResult | undefined {
  if (!Array.isArray(params.yamlValue)) return undefined
  const transportedLocations: BrokenXMLReferenceLocation[] = []
  const prepared = params.yamlValue.map((item, index) => {
    const location = { kind: "value", path: [index] } as const
    if (!params.isTagged(location)) return item
    params.payload(item)
    transportedLocations.push(location)
    return ""
  })
  return transportedLocations.length === 0
    ? undefined
    : { yamlValue: prepared, transportedLocations }
}

export function restoreBrokenReferenceCollectionItems(params: {
  readonly items: readonly unknown[]
  readonly yamlValue: readonly unknown[]
  readonly transportedLocations: readonly BrokenXMLReferenceLocation[]
  readonly payload: (value: unknown) => unknown
}): unknown[] {
  const result = [...params.items]
  for (const location of params.transportedLocations) {
    if (location.kind !== "value") continue
    const index = location.path[0]
    if (typeof index === "number") result[index] = params.payload(params.yamlValue[index])
  }
  return result
}

export function matchesTaggedBrokenReferenceCollection(params: {
  readonly yamlValue: unknown
  readonly location: BrokenXMLReferenceLocation
  readonly isTagged: (location: BrokenXMLReferenceLocation) => boolean
  readonly accepts: (value: unknown) => boolean
}): boolean {
  if (params.location.kind !== "value" || !Array.isArray(params.yamlValue)
    || params.location.path.length !== 1 || !params.isTagged(params.location)) return false
  const index = params.location.path[0]
  return typeof index === "number" && params.accepts(params.yamlValue[index])
}

export function brokenReferenceCollectionValidationSchema(params: {
  readonly base: TSchema
  readonly validationGraph: boolean
  readonly payloadPattern: string
}): TSchema {
  if (!params.validationGraph || !("items" in params.base)) return params.base
  return {
    ...params.base,
    items: Type.Union([
      params.base.items as TSchema,
      Type.String({ pattern: `^!xml/reference ${params.payloadPattern}$` }),
    ]),
  }
}
