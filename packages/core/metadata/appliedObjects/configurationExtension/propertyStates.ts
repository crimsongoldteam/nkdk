import { capitalize } from "../../../helpers/capitalize"
import { getConfigurationIndexCollectionContext } from "../../configurationIndex/collector/context"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import type { MetadataItemXmlImportAugmenter } from "../../importFromXml/metadataItemAugmenter"
import type { MetadataItemRule } from "../../orchestration/property/types"

const NOTIFY_ALIASES: Readonly<Record<string, string>> = {
  ExtendedConfigurationObject: "ОбъектРасширяемойКонфигурации",
}

export const EXTENDED_SNAPSHOT_SEGMENTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ClientApplicationForm: {
    Form: "form",
  },
  MetadataBot: {
    Module: "module",
  },
  MetadataCommonForm: {
    Form: "form",
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

export const EXTENSION_PROPERTY_ORDER_SEGMENT = "extensionPropertyOrder"
export const EXTENSION_INTERNAL_INFO_SEGMENT = "extensionInternalInfo"

export const configurationExtensionPropertyStatesAugmenter: MetadataItemXmlImportAugmenter = {
  augment({ context, rule, source, yaml }): void {
    const collection = getConfigurationIndexCollectionContext(context)
    const properties = asRecord(source["Properties"])
    if (collection !== undefined && properties !== undefined) {
      const extensionServiceAddress = childSegmentUid(
        collection.logicalAddress,
        EXTENSION_PROPERTY_ORDER_SEGMENT
      )
      const extensionOrderAddress = childSegmentUid(
        collection.logicalAddress,
        `${EXTENSION_PROPERTY_ORDER_SEGMENT}:${rule.itemType}`
      )
      const serviceProperties = [
        ["ObjectBelonging", "objectBelonging"],
        ["ExtendedConfigurationObject", "extendedConfigurationObject"],
      ] as const
      for (const [xmlName, propertyKey] of serviceProperties) {
        if (
          Object.prototype.hasOwnProperty.call(properties, xmlName)
        ) {
          collection.collector.setPresent(extensionServiceAddress, propertyKey)
          collection.collector.setPresent(extensionOrderAddress, propertyKey)
        }
      }
      if (
        rule.properties.internalInfo === undefined &&
        Object.prototype.hasOwnProperty.call(source, "InternalInfo")
      ) {
        collection.collector.setPresent(
          childSegmentUid(
            collection.logicalAddress,
            `${EXTENSION_INTERNAL_INFO_SEGMENT}:${rule.itemType}`
          ),
          "internalInfo"
        )
      }
      const order = extensionPropertyOrder(rule, source)
      if (order.length > 0) {
        collection.collector.setOrder(extensionOrderAddress, order)
      }
    }
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
      if (segment === undefined || collection === undefined) continue
      collection.collector.setExtended(childSegmentUid(collection.logicalAddress, segment))
    }
  },
}

function extensionPropertyOrder(
  rule: MetadataItemRule,
  source: Readonly<Record<string, unknown>>
): string[] {
  const propertyKeyByXmlName = new Map<string, string>([
    ["ObjectBelonging", "objectBelonging"],
    ["ExtendedConfigurationObject", "extendedConfigurationObject"],
  ])
  const rootPropertyKeyByXmlName = new Map<string, string>([
    ["InternalInfo", "internalInfo"],
  ])
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    const xmlName = propertyRule.xml ?? capitalize(propertyKey)
    if (propertyRule.xmlParents?.at(-1) === "Properties") {
      propertyKeyByXmlName.set(xmlName, propertyKey)
    } else if ((propertyRule.xmlParents?.length ?? 0) === 0) {
      rootPropertyKeyByXmlName.set(xmlName, propertyKey)
    }
  }
  return Object.keys(source).flatMap((xmlName) => {
    if (xmlName === "Properties") {
      const properties = asRecord(source[xmlName])
      return properties === undefined
        ? []
        : Object.keys(properties).flatMap((propertyXmlName) => {
            const propertyKey = propertyKeyByXmlName.get(propertyXmlName)
            return propertyKey === undefined ? [] : [propertyKey]
          })
    }
    const propertyKey = rootPropertyKeyByXmlName.get(xmlName)
    return propertyKey === undefined ? [] : [propertyKey]
  })
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
