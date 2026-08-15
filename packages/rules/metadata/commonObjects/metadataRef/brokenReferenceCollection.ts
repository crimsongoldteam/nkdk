import { xmlAnomalyTagValue } from "@nkdk/runtime"
import type {
  BrokenXMLReferenceExportResult,
  BrokenXMLReferenceImportResult,
  BrokenXMLReferenceLocation,
} from "@nkdk/runtime/rule-kit"

export interface IndexedBrokenReference {
  readonly index: number
  readonly value: string
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
