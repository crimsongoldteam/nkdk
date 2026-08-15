import { Type } from "typebox"

import { xmlAnomalyTagPayload } from "@nkdk/runtime"
import {
  defineMetadataRules,
  emptyMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import {
  isMDObjectRefUuid,
  MD_OBJECT_REF_UUID_SOURCE,
} from "../metadataRef/brokenMDObjectRef"
import {
  normalizeImportedBrokenReferenceCollection,
  prepareBrokenReferenceCollectionExport,
} from "../metadataRef/brokenReferenceCollection"
import { commandInterfaceSubsystemsOrderSchema } from "./subsystemsOrderSchema"

export const brokenCommandInterfaceSubsystemOrderCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "rootCommandInterface.subsystemsOrderUuid",
  tryImport({ rule, xmlValue, yamlValue }) {
    if (!Array.isArray(yamlValue) || !isRecord(xmlValue)) return undefined
    const itemTag = rule.metadataItemLinksXMLItem ?? "Subsystem"
    const rawItems = xmlValue[itemTag]
    if (rawItems === undefined) return undefined
    const items = Array.isArray(rawItems) ? rawItems : [rawItems]
    const broken = items.flatMap((item, index) =>
      typeof item === "string" && isMDObjectRefUuid(item)
        ? [{ index, value: item }]
        : [],
    )
    return normalizeImportedBrokenReferenceCollection(yamlValue, broken)
  },
  prepareExport({ yamlValue, isTagged }) {
    return prepareBrokenReferenceCollectionExport({
      yamlValue,
      isTagged,
      payload: brokenSubsystemOrderPayload,
    })
  },
  patchExportedXML({ rule, yamlValue, xmlValue, transportedLocations }) {
    if (!Array.isArray(yamlValue) || !isRecord(xmlValue)) return xmlValue
    const itemTag = rule.metadataItemLinksXMLItem ?? "Subsystem"
    const current = xmlValue[itemTag]
    const items = Array.isArray(current) ? [...current] : [current]
    for (const location of transportedLocations) {
      if (location.kind !== "value") continue
      const index = location.path[0]
      if (typeof index === "number") items[index] = brokenSubsystemOrderPayload(yamlValue[index])
    }
    return { ...xmlValue, [itemTag]: items }
  },
  validationSchema({ rule, base, validationGraph }) {
    if (!validationGraph) return base
    return commandInterfaceSubsystemsOrderSchema(
      rule,
      Type.String({ pattern: `^!xml/reference ${MD_OBJECT_REF_UUID_SOURCE}$` }),
    )
  },
  matchesTaggedYAML({ yamlValue, location, isTagged }) {
    if (location.kind !== "value" || !Array.isArray(yamlValue)
      || location.path.length !== 1 || !isTagged(location)) return false
    const index = location.path[0]
    return typeof index === "number" && isBrokenSubsystemOrderYAML(yamlValue[index])
  },
}

export const brokenCommandInterfaceSubsystemOrderRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule(
      "CommandInterfaceSubsystemsOrder",
      "brokenXMLReferenceCarrier",
      brokenCommandInterfaceSubsystemOrderCarrier,
    ),
  ]),
})

function isBrokenSubsystemOrderYAML(value: unknown): value is string {
  return typeof value === "string" && isMDObjectRefUuid(xmlAnomalyTagPayload("xml/reference", value))
}

function brokenSubsystemOrderPayload(value: unknown): string {
  if (!isBrokenSubsystemOrderYAML(value)) {
    throw new Error("Битая ссылка порядка подсистем должна содержать канонический UUID")
  }
  return xmlAnomalyTagPayload("xml/reference", value)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
