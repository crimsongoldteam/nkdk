import { Type, type TSchema } from "typebox"

import { xmlAnomalyTagPayload } from "@nkdk/runtime"
import {
  defineMetadataRules,
  emptyMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import {
  normalizeImportedBrokenReferenceCollection,
  prepareBrokenReferenceCollectionExport,
} from "./brokenReferenceCollection"

export const MD_OBJECT_REF_UUID_SOURCE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

const MD_OBJECT_REF_UUID = new RegExp(`^${MD_OBJECT_REF_UUID_SOURCE}$`)

export function isMDObjectRefUuid(value: string): boolean {
  return MD_OBJECT_REF_UUID.test(value)
}

export const brokenMDObjectRefCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "metadataRef.mdObjectRefUuid",
  tryImport({ rule, xmlValue, yamlValue }) {
    if (!Array.isArray(yamlValue)) return undefined
    const items = metadataItemLinksXMLItems(rule, xmlValue)
    if (items === undefined) return undefined

    const broken = items.flatMap((item, index) => {
      const uuid = typedMDObjectRefUuid(item)
      return uuid === undefined ? [] : [{ index, value: uuid }]
    })
    return normalizeImportedBrokenReferenceCollection(yamlValue, broken)
  },
  prepareExport({ yamlValue, isTagged }) {
    return prepareBrokenReferenceCollectionExport({
      yamlValue,
      isTagged,
      payload: brokenMDObjectRefPayload,
    })
  },
  patchExportedXML({ rule, yamlValue, xmlValue, transportedLocations }) {
    if (!Array.isArray(yamlValue) || !isRecord(xmlValue)) return xmlValue
    const itemTag = metadataItemLinksXMLItemTag(rule)
    const rawItems = xmlValue[itemTag]
    const items = Array.isArray(rawItems) ? [...rawItems] : [rawItems]
    for (const location of transportedLocations) {
      if (location.kind !== "value") continue
      const index = location.path[0]
      if (typeof index !== "number") continue
      items[index] = {
        "_xsi:type": "xr:MDObjectRef",
        "#text": brokenMDObjectRefPayload(yamlValue[index]),
      }
    }
    return { ...xmlValue, [itemTag]: items }
  },
  validationSchema({ base, validationGraph }) {
    if (!validationGraph || !("items" in base)) return base
    return {
      ...base,
      items: Type.Union([
        base.items as TSchema,
        Type.String({ pattern: `^!xml/reference ${MD_OBJECT_REF_UUID_SOURCE}$` }),
      ]),
    }
  },
  matchesTaggedYAML({ yamlValue, location, isTagged }) {
    if (location.kind !== "value" || !Array.isArray(yamlValue)
      || location.path.length !== 1 || !isTagged(location)) {
      return false
    }
    const index = location.path[0]
    return typeof index === "number" && isBrokenMDObjectRefYAML(yamlValue[index])
  },
}

export const brokenMDObjectRefRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("MetadataItemLinks", "brokenXMLReferenceCarrier", brokenMDObjectRefCarrier),
  ]),
})

function metadataItemLinksXMLItems(
  rule: { readonly metadataItemLinksXMLItem?: string },
  value: unknown,
): readonly unknown[] | undefined {
  if (!isRecord(value)) return undefined
  const itemTag = metadataItemLinksXMLItemTag(rule)
  const rawItems = value[itemTag] ?? value["xr:Item"] ?? value["xr:Object"]
  if (rawItems === undefined) return undefined
  return Array.isArray(rawItems) ? rawItems : [rawItems]
}

function metadataItemLinksXMLItemTag(
  rule: { readonly metadataItemLinksXMLItem?: string },
): string {
  return rule.metadataItemLinksXMLItem ?? "xr:Item"
}

function typedMDObjectRefUuid(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  const text = value["#text"]
  return value["_xsi:type"] === "xr:MDObjectRef" &&
    typeof text === "string" &&
    isMDObjectRefUuid(text)
    ? text
    : undefined
}

function isBrokenMDObjectRefYAML(value: unknown): value is string {
  return typeof value === "string" && isMDObjectRefUuid(xmlAnomalyTagPayload("xml/reference", value))
}

function brokenMDObjectRefPayload(value: unknown): string {
  if (!isBrokenMDObjectRefYAML(value)) {
    throw new Error("Битая MDObjectRef-ссылка должна содержать канонический UUID")
  }
  return xmlAnomalyTagPayload("xml/reference", value)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
