import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"

export type SettingsFragment = Record<string, unknown>
export type SettingsFragmentXML = SettingsFragment & {
  "_xsi:type"?: string
  [attribute: `_xmlns${string}`]: string | undefined
}
export type SettingsFragmentYAML = string

type SettingsFragmentTypeRegistration = {
  propertyType: PropertyRuleType
  canonicalAttributes: SettingsFragmentXML
  matchXsiType: (xsiType: string) => boolean
}

const isSettingsFragmentXML = (value: unknown): value is SettingsFragmentXML =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const omitSettingsAttributes = (xml: SettingsFragmentXML): SettingsFragment => {
  const result: SettingsFragment = {}

  for (const [key, value] of Object.entries(xml)) {
    if (key === "_xsi:type" || key.startsWith("_xmlns")) continue
    if (key === "#text" && typeof value === "string" && value.trim().length === 0) continue
    result[key] = normalizeImportedFragment(value)
  }

  return result
}

const normalizeImportedFragment = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normalizeImportedFragment)

  if (isSettingsFragmentXML(value)) {
    if (value["_xsi:nil"] === true || value["_xsi:nil"] === "true") return { "_xsi:nil": true }

    const result: SettingsFragment = {}

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "#text" && typeof nestedValue === "string" && nestedValue.trim().length === 0) continue
      result[key] = normalizeImportedFragment(nestedValue)
    }

    return result
  }

  return value
}

const expandEmptyElements = (value: unknown): unknown => {
  if (value === undefined) return {}
  if (Array.isArray(value)) return value.map(expandEmptyElements)

  if (isSettingsFragmentXML(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, expandEmptyElements(nestedValue)]))
  }

  return value
}

const isPlainSettingsObject = (value: unknown): value is SettingsFragment =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const isNilMarker = (value: unknown): boolean => {
  if (!isPlainSettingsObject(value)) return false
  const nil = value["_xsi:nil"]
  return nil === true || nil === "true"
}

const isEmptySettingsObject = (value: unknown): boolean =>
  isPlainSettingsObject(value) &&
  Object.entries(value).every(([key, nestedValue]) => {
    if (key === "#text" && typeof nestedValue === "string" && nestedValue.trim().length === 0) return true
    return nestedValue === undefined
  })

const restoreReferenceNilMarkers = (value: unknown, reference: unknown): unknown => {
  if (isNilMarker(reference) && (value === undefined || isEmptySettingsObject(value))) {
    return { "_xsi:nil": true }
  }

  if (Array.isArray(value)) {
    const referenceItems = Array.isArray(reference) ? reference : []
    return value.map((item, index) => restoreReferenceNilMarkers(item, referenceItems[index]))
  }

  if (!isPlainSettingsObject(value)) return value

  const referenceObject = isPlainSettingsObject(reference) ? reference : {}
  const result: SettingsFragment = {}

  for (const [key, nestedValue] of Object.entries(value)) {
    result[key] = restoreReferenceNilMarkers(nestedValue, referenceObject[key])
  }

  return result
}

export const registerSettingsFragmentType = <TModel extends SettingsFragment>({
  propertyType,
  canonicalAttributes,
  matchXsiType,
}: SettingsFragmentTypeRegistration): void => {
  registerTypeRule(propertyType, "importFromXML", (_context, _rule, xml) => {
    if (!isSettingsFragmentXML(xml)) return undefined

    const xsiType = xml["_xsi:type"]
    if (typeof xsiType !== "string" || !matchXsiType(xsiType)) return undefined

    return omitSettingsAttributes(xml) as TModel
  })

  registerTypeRule(propertyType, "exportToXML", (_context, _rule, value: TModel | undefined, reference?: TModel) => {
    if (value === undefined) return undefined
    const restoredValue = restoreReferenceNilMarkers(value, reference)
    return {
      ...canonicalAttributes,
      ...(expandEmptyElements(restoredValue) as SettingsFragment),
    }
  })

  registerTypeRule(propertyType, "importFromYAML", (_context, _rule, value) => {
    if (typeof value !== "string") return undefined
    const fragment = value.trim()
    if (fragment.length === 0) return {} as TModel

    const parsed = importContentFromXML<{ SettingsFragment?: SettingsFragment }>(
      `<SettingsFragment>${fragment}</SettingsFragment>`,
      { preserveXsiNil: true }
    )
    return normalizeImportedFragment(parsed.SettingsFragment) as TModel | undefined
  })

  registerTypeRule(propertyType, "exportToYAML", (_context, _rule, value: TModel | undefined) => {
    if (value === undefined) return undefined
    return xmlExport(expandEmptyElements(value) as SettingsFragment, false)
  })
}
