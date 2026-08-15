import { Type } from "typebox"

import {
  taggedYAMLScalar,
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
} from "@nkdk/runtime"
import {
  defineMetadataRules,
  definePropertyTypeRule,
  emptyMetadataRules,
  propertyTypesFromContributions,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import { MD_OBJECT_REF_UUID_SOURCE } from "../metadataRef/brokenMDObjectRef"

const DIRECT_BROKEN_REFERENCE_SOURCE =
  `(?:${MD_OBJECT_REF_UUID_SOURCE}|[0-9]+:${MD_OBJECT_REF_UUID_SOURCE})`
const DIRECT_BROKEN_REFERENCE = new RegExp(`^${DIRECT_BROKEN_REFERENCE_SOURCE}$`)

export const brokenDirectMetadataTargetReferenceCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "metadataTargets.directReference",
  tryImport({ rule, xmlValue }) {
    if (rule.metadataTarget === undefined) return undefined
    const payload = directReferencePayload(xmlValue)
    if (payload === undefined) return undefined
    return {
      yamlValue: taggedYAMLScalar(
        "xml/reference",
        xmlAnomalyTagValue("xml/reference", payload),
      ),
      taggedLocations: [{ kind: "value", path: [] }],
    }
  },
  prepareExport({ rule, yamlValue, isTagged }) {
    const location = { kind: "value", path: [] } as const
    if (rule.metadataTarget === undefined || !isTagged(location)) return undefined
    brokenDirectReferencePayload(yamlValue)
    return {
      yamlValue: "",
      transportedLocations: [location],
    }
  },
  patchExportedXML({ rule, yamlValue, xmlValue }) {
    if (rule.metadataTarget === undefined) return xmlValue
    const payload = brokenDirectReferencePayload(yamlValue)
    return isRecord(xmlValue) && Object.prototype.hasOwnProperty.call(xmlValue, "#text")
      ? { ...xmlValue, "#text": payload }
      : payload
  },
  validationSchema({ rule, base, validationGraph }) {
    return validationGraph && rule.metadataTarget !== undefined
      ? Type.Union([
          base,
          Type.String({ pattern: `^!xml/reference ${DIRECT_BROKEN_REFERENCE_SOURCE}$` }),
        ])
      : base
  },
  matchesTaggedYAML({ rule, yamlValue, location, isTagged }) {
    return rule.metadataTarget !== undefined
      && location.kind === "value"
      && location.path.length === 0
      && isTagged(location)
      && isBrokenDirectReferenceYAML(yamlValue)
  },
}

export const brokenDirectMetadataTargetReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule(
      "string",
      "brokenXMLReferenceCarrier",
      brokenDirectMetadataTargetReferenceCarrier,
    ),
    definePropertyTypeRule(
      "MetadataItemLink",
      "brokenXMLReferenceCarrier",
      brokenDirectMetadataTargetReferenceCarrier,
    ),
    definePropertyTypeRule(
      "MetadataField",
      "brokenXMLReferenceCarrier",
      brokenDirectMetadataTargetReferenceCarrier,
    ),
  ]),
})

function directReferencePayload(value: unknown): string | undefined {
  const text = typeof value === "string"
    ? value
    : isRecord(value) && typeof value["#text"] === "string"
      ? value["#text"]
      : undefined
  return text !== undefined && DIRECT_BROKEN_REFERENCE.test(text) ? text : undefined
}

function isBrokenDirectReferenceYAML(value: unknown): value is string {
  if (typeof value !== "string") return false
  try {
    return DIRECT_BROKEN_REFERENCE.test(xmlAnomalyTagPayload("xml/reference", value))
  } catch {
    return false
  }
}

function brokenDirectReferencePayload(value: unknown): string {
  if (!isBrokenDirectReferenceYAML(value)) {
    throw new Error("Битая прямая ссылка не соответствует зарегистрированной грамматике")
  }
  return xmlAnomalyTagPayload("xml/reference", value)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
