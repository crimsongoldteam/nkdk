import { xmlAnomalyTagValue } from "@nkdk/runtime"
import type {
  BrokenXMLReferenceExportResult,
  BrokenXMLReferenceImportResult,
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
    taggedPaths: broken.map(({ index }) => [index]),
  }
}

export function prepareBrokenReferenceCollectionExport(params: {
  readonly yamlValue: unknown
  readonly isTagged: (path: readonly (string | number)[]) => boolean
  readonly payload: (value: unknown) => string
}): BrokenXMLReferenceExportResult | undefined {
  if (!Array.isArray(params.yamlValue)) return undefined
  const transportedPaths: number[][] = []
  const prepared = params.yamlValue.map((item, index) => {
    if (!params.isTagged([index])) return item
    const payload = params.payload(item)
    transportedPaths.push([index])
    return payload
  })
  return transportedPaths.length === 0
    ? undefined
    : { yamlValue: prepared, transportedPaths }
}
