import { capitalize } from "../../../helpers/capitalize"
import { getConfigurationIndexCollectionContext } from "../../configurationIndex/collector/context"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import type { MetadataItemXmlImportAugmenter } from "../../importFromXml/metadataItemAugmenter"
import type { MetadataItemRule } from "../../orchestration/property/types"

const NOTIFY_ALIASES: Readonly<Record<string, string>> = {
  ExtendedConfigurationObject: "ОбъектРасширяемойКонфигурации",
}

const EXTENDED_SNAPSHOT_SEGMENTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ClientApplicationForm: {
    Form: "form",
  },
  MetadataBot: {
    Module: "module",
  },
  MetadataCommonForm: {
    Module: "module",
  },
  MetadataCommonModule: {
    Module: "module",
  },
  MetadataHTTPService: {
    Module: "module",
  },
  MetadataIntegrationService: {
    Module: "module",
  },
  MetadataRole: {
    Rights: "rights",
  },
  MetadataSubsystem: {
    CommandInterface: "commandInterface",
  },
  MetadataWebService: {
    Module: "module",
  },
  MetadataWebSocketClient: {
    Module: "module",
  },
  MetadataConfigurationExtension: {
    CommandInterface: "commandInterface",
    HomePageWorkArea: "homePageWorkArea",
    Logo: "logo",
    MainSectionCommandInterface: "mainSectionCommandInterface",
    MainSectionPicture: "mainSectionPicture",
    Splash: "splash",
  },
}

export const configurationExtensionPropertyStatesAugmenter: MetadataItemXmlImportAugmenter = {
  augment({ context, rule, source, yaml }): void {
    for (const propertyState of propertyStates(source)) {
      const property = propertyState["xr:Property"]
      const state = propertyState["xr:State"]
      if (typeof property !== "string" || typeof state !== "string") continue
      if (state === "Notify") {
        const yamlName = notifyYamlName(rule, property)
        if (yamlName !== undefined) appendUniqueControl(yaml, yamlName)
        continue
      }
      if (state !== "Extended") continue
      const segment = EXTENDED_SNAPSHOT_SEGMENTS[rule.itemType]?.[property]
      const collection = getConfigurationIndexCollectionContext(context)
      if (segment === undefined || collection === undefined) continue
      collection.collector.setExtended(childSegmentUid(collection.logicalAddress, segment))
    }
  },
}

function propertyStates(source: Record<string, unknown>): Record<string, unknown>[] {
  const internalInfo = asRecord(source["InternalInfo"])
  const value = internalInfo?.["xr:PropertyState"]
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.flatMap((entry) => {
    const record = asRecord(entry)
    return record === undefined ? [] : [record]
  })
}

function notifyYamlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  const alias = NOTIFY_ALIASES[xmlProperty]
  if (alias !== undefined) return alias
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    if (
      (propertyRule.xml ?? capitalize(propertyKey)) === xmlProperty &&
      typeof propertyRule.yaml === "string"
    ) {
      return propertyRule.yaml
    }
  }
  return undefined
}

function appendUniqueControl(yaml: Record<string, unknown>, propertyName: string): void {
  const current = yaml["Контроль"]
  const control = Array.isArray(current)
    ? current.flatMap((entry) => (typeof entry === "string" ? [entry] : []))
    : []
  if (!control.includes(propertyName)) control.push(propertyName)
  yaml["Контроль"] = control
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
