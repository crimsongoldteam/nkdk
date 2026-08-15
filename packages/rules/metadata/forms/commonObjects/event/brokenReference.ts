import { Type } from "typebox"
import { markYAMLMappingKeyTag } from "@nkdk/runtime"
import {
  cloneMetadataTargetValue,
  defineMetadataRules,
  definePropertyTypeRule,
  emptyMetadataRules,
  propertyTypesFromContributions,
  renameMetadataTargetMappingKey,
  type BrokenXMLReferenceLocation,
  type BrokenXMLReferenceTypeCarrier,
} from "@nkdk/runtime/rule-kit"
import { isMDObjectRefUuid, MD_OBJECT_REF_UUID_SOURCE } from "../../../commonObjects/metadataRef/brokenMDObjectRef"
import { collectEventMetadataTargetOccurrences } from "./metadataTargetOccurrences"
import { EventValueJSONSchema } from "./toJSONSchema"
import { temporaryMappingKey } from "../../../commonObjects/metadataTargets/temporaryMappingKey"
import { isMutableRecord, isRecord } from "../../../commonObjects/metadataTargets/record"

export const brokenEventReferenceCarrier: BrokenXMLReferenceTypeCarrier = {
  name: "events.uuidName",
  tryImport({ xmlValue, yamlValue }) {
    if (!isRecord(yamlValue) || !isRecord(xmlValue)) return undefined
    const rawEvents = xmlValue.Event
    const events = Array.isArray(rawEvents) ? rawEvents : [rawEvents]
    const taggedLocations: BrokenXMLReferenceLocation[] = []
    const seen = new Set<string>()
    for (const event of events) {
      if (!isRecord(event) || typeof event._name !== "string" || !isMDObjectRefUuid(event._name)) continue
      if (!Object.prototype.hasOwnProperty.call(yamlValue, event._name) || seen.has(event._name)) continue
      markYAMLMappingKeyTag(yamlValue, event._name, "xml/reference")
      taggedLocations.push({ kind: "key", path: [], key: event._name })
      seen.add(event._name)
    }
    return taggedLocations.length === 0 ? undefined : { yamlValue, taggedLocations }
  },
  prepareExport({ yamlValue, isTagged }) {
    if (!isRecord(yamlValue)) return undefined
    const prepared = cloneMetadataTargetValue(yamlValue) as Record<string, unknown>
    const transportedLocations: BrokenXMLReferenceLocation[] = []
    for (const [index, key] of Object.keys(yamlValue).entries()) {
      if (!isMDObjectRefUuid(key)) continue
      const location = { kind: "key", path: [], key } as const
      if (!isTagged(location)) {
        throw new Error("UUID-имя события должно быть помечено тегом !xml/reference")
      }
      renameMetadataTargetMappingKey(prepared, key, temporaryMappingKey("broken_event", index, prepared))
      transportedLocations.push(location)
    }
    return transportedLocations.length === 0 ? undefined : { yamlValue: prepared, transportedLocations }
  },
  patchExportedXML({ yamlValue, xmlValue, transportedLocations }) {
    if (!isRecord(yamlValue) || !isRecord(xmlValue)) return xmlValue
    const rawEvents = xmlValue.Event
    const events = (Array.isArray(rawEvents) ? rawEvents : [rawEvents]).map((event) =>
      isRecord(event) ? { ...event } : event)
    const keys = Object.keys(yamlValue)
    for (const location of transportedLocations) {
      if (location.kind !== "key") continue
      const index = keys.indexOf(location.key)
      if (index < 0) continue
      const temporaryName = temporaryMappingKey("broken_event", index, yamlValue)
      for (const event of events) {
        if (isMutableRecord(event) && event._name === temporaryName) event._name = location.key
      }
    }
    return { ...xmlValue, Event: Array.isArray(rawEvents) ? events : events[0] }
  },
  validationSchema({ rule, base, validationGraph }) {
    if (!validationGraph || rule.type !== "Events") return base
    const knownKeys = (Object.values(rule.items) as string[]).map(escapePattern)
    const keyPattern = `^(?:${[...knownKeys, MD_OBJECT_REF_UUID_SOURCE].join("|")})$`
    return Type.Union([
      base,
      Type.Record(Type.String({ pattern: keyPattern }), EventValueJSONSchema, {
        additionalProperties: false,
      }),
    ])
  },
  matchesTaggedYAML({ yamlValue, location, isTagged }) {
    return isRecord(yamlValue)
      && location.kind === "key"
      && location.path.length === 0
      && isTagged(location)
      && isMDObjectRefUuid(location.key)
  },
}

export const brokenEventReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    definePropertyTypeRule("Events", "brokenXMLReferenceCarrier", brokenEventReferenceCarrier),
    definePropertyTypeRule("Events", "metadataTargetOccurrences", collectEventMetadataTargetOccurrences),
  ]),
})

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
