import { Type } from "typebox"

import {
  xmlAnomalyTagPayload,
  xmlAnomalyTagValue,
} from "@nkdk/runtime"
import {
  defineMetadataRules,
  emptyMetadataRules,
  type BrokenXMLReferenceCarrierRegistration,
} from "@nkdk/runtime/rule-kit"
import {
  DESIGN_TIME_REF_UUID_SOURCE,
  isDesignTimeRefUuid,
} from "./handlers"
import { importMetadataValueStringFromYAML } from "../metadataPath/fromYAML"

const referenceContext = { version: "test", defaultLanguage: "ru" } as const
const DESIGN_TIME_REF_YAML_SOURCE =
  `(?:${DESIGN_TIME_REF_UUID_SOURCE}\\.${DESIGN_TIME_REF_UUID_SOURCE}|[^\\s.]+(?:\\.[^\\s.]+){2,})`

export const brokenDesignTimeRefCarrier: BrokenXMLReferenceCarrierRegistration = {
  name: "metadataValue.designTimeRef",
  propertyType: "MetadataValue",
  tryImport({ xmlValue, yamlValue }) {
    const text = designTimeRefText(xmlValue)
    if (text === undefined || yamlValue !== text) return undefined
    return {
      yamlValue: xmlAnomalyTagValue("xml/reference", text),
      taggedPaths: [[]],
    }
  },
  prepareExport({ yamlValue, isTagged }) {
    if (!isTagged([]) || !isBrokenDesignTimeRefYAML(yamlValue)) return undefined
    const payload = brokenDesignTimeRefPayload(yamlValue)
    return {
      yamlValue: payload,
      transportedPaths: [[]],
    }
  },
  patchExportedXML({ xmlValue }) {
    const text = exportedReferenceText(xmlValue)
    if (text === undefined) {
      throw new Error("Битая DesignTimeRef-ссылка не преобразована в ссылочное XML-значение")
    }
    return {
      "_xsi:type": "xr:DesignTimeRef",
      "#text": text,
    }
  },
  validationSchema({ base, validationGraph }) {
    return validationGraph
      ? Type.Union([
          base,
          Type.String({
            pattern: `^!xml/reference ${DESIGN_TIME_REF_YAML_SOURCE}$`,
          }),
        ])
      : base
  },
  matchesTaggedYAML({ yamlValue, path, isTagged }) {
    if (path.length !== 0 || !isTagged(path)) return false
    return isBrokenDesignTimeRefYAML(yamlValue)
  },
}

export const brokenDesignTimeRefRules = defineMetadataRules({
  ...emptyMetadataRules,
  brokenXMLReferenceCarriers: [brokenDesignTimeRefCarrier],
})

function designTimeRefText(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined
  }
  const record = value as Readonly<Record<string, unknown>>
  const text = record["#text"]
  return record["_xsi:type"] === "xr:DesignTimeRef" &&
    typeof text === "string" &&
    isDesignTimeRefUuid(text)
    ? text
    : undefined
}

function isBrokenDesignTimeRefYAML(value: unknown): value is string {
  if (typeof value !== "string") return false
  const payload = xmlAnomalyTagPayload("xml/reference", value)
  if (isDesignTimeRefUuid(payload)) return true
  return importMetadataValueStringFromYAML(referenceContext, undefined, payload)?.includes(".") === true
}

function brokenDesignTimeRefPayload(value: unknown): string {
  if (!isBrokenDesignTimeRefYAML(value)) {
    throw new Error(
      "Битая DesignTimeRef-ссылка должна содержать ссылочное значение",
    )
  }
  return xmlAnomalyTagPayload("xml/reference", value)
}

function exportedReferenceText(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const text = (value as Readonly<Record<string, unknown>>)["#text"]
  return typeof text === "string" && text.length > 0 ? text : undefined
}
