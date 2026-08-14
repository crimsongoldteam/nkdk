import { Type } from "typebox"

import {
  xmlScalarTagPayload,
  xmlScalarTagValue,
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

export const brokenDesignTimeRefCarrier: BrokenXMLReferenceCarrierRegistration = {
  name: "metadataValue.designTimeRefUuid",
  propertyType: "MetadataValue",
  tryImport({ xmlValue, yamlValue }) {
    const text = designTimeRefText(xmlValue)
    if (text === undefined || yamlValue !== text) return undefined
    return {
      yamlValue: xmlScalarTagValue(text),
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
  patchExportedXML({ yamlValue }) {
    return {
      "_xsi:type": "xr:DesignTimeRef",
      "#text": brokenDesignTimeRefPayload(yamlValue),
    }
  },
  validationSchema({ base, validationGraph }) {
    return validationGraph
      ? Type.Union([
          base,
          Type.String({
            pattern:
              `^!xml ${DESIGN_TIME_REF_UUID_SOURCE}\\.${DESIGN_TIME_REF_UUID_SOURCE}$`,
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
  return typeof value === "string" &&
    isDesignTimeRefUuid(xmlScalarTagPayload(value))
}

function brokenDesignTimeRefPayload(value: unknown): string {
  if (!isBrokenDesignTimeRefYAML(value)) {
    throw new Error(
      "Битая DesignTimeRef-ссылка должна содержать два UUID через точку",
    )
  }
  return xmlScalarTagPayload(value)
}
