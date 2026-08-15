import { xmlAnomalyTagPayload } from "@nkdk/runtime"
import {
  definePropertyTypeRule,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import {
  brokenReferenceCollectionValidationSchema,
  indexedBrokenStringReferences,
  matchesTaggedBrokenReferenceCollection,
  normalizeImportedBrokenReferenceCollection,
  prepareBrokenReferenceCollectionExport,
  restoreBrokenReferenceCollectionItems,
} from "../metadataRef/brokenReferenceCollection"
import { MD_OBJECT_REF_UUID_SOURCE, isMDObjectRefUuid } from "../metadataRef/brokenMDObjectRef"

export const brokenFunctionalOptionReferenceCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "functionalOptionsProperty.uuid",
  tryImport({ xmlValue, yamlValue }) {
    if (!Array.isArray(yamlValue) || !isRecord(xmlValue)) return undefined
    const rawItems = xmlValue.Item
    if (rawItems === undefined) return undefined
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]
    const broken = indexedBrokenStringReferences(items, isMDObjectRefUuid)
    return normalizeImportedBrokenReferenceCollection(yamlValue, broken)
  },
  prepareExport({ yamlValue, isTagged }) {
    return prepareBrokenReferenceCollectionExport({
      yamlValue,
      isTagged,
      payload: brokenFunctionalOptionPayload,
    })
  },
  patchExportedXML({ yamlValue, xmlValue, transportedLocations }) {
    if (!Array.isArray(yamlValue) || !isRecord(xmlValue)) return xmlValue
    const rawItems = xmlValue.Item
    const items = restoreBrokenReferenceCollectionItems({
      items: Array.isArray(rawItems) ? rawItems : [rawItems],
      yamlValue,
      transportedLocations,
      payload: brokenFunctionalOptionPayload,
    })
    return { ...xmlValue, Item: items.length === 1 ? items[0] : items }
  },
  validationSchema({ base, validationGraph }) {
    return brokenReferenceCollectionValidationSchema({
      base,
      validationGraph,
      payloadPattern: MD_OBJECT_REF_UUID_SOURCE,
    })
  },
  matchesTaggedYAML({ yamlValue, location, isTagged }) {
    return matchesTaggedBrokenReferenceCollection({
      yamlValue,
      location,
      isTagged,
      accepts: isBrokenFunctionalOptionYAML,
    })
  },
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "FunctionalOptionsProperty",
  "brokenXMLReferenceCarrier",
  brokenFunctionalOptionReferenceCarrier,
)

function brokenFunctionalOptionPayload(value: unknown): string {
  if (!isBrokenFunctionalOptionYAML(value)) {
    throw new Error("Битая ссылка функциональной опции должна содержать канонический UUID")
  }
  return xmlAnomalyTagPayload("xml/reference", value)
}

function isBrokenFunctionalOptionYAML(value: unknown): value is string {
  return typeof value === "string"
    && isMDObjectRefUuid(xmlAnomalyTagPayload("xml/reference", value))
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
