import { capitalize, markYAMLScalarTag } from "@nkdk/runtime"
import { getConfigurationIndexCollectionContext } from "@nkdk/runtime"
import { childSegmentUid } from "@nkdk/runtime"
import type { MetadataItemXmlImportAugmenter } from "../../ruleRuntime/metadataItem/augmenterRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { currentOperationRegistrySet } from "../../operations/operationExecutionContext"
import type { PropertyStateCapabilityRegistry } from "../../ruleRuntime/definition"

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

export const configurationExtensionPropertyStatesAugmenter: MetadataItemXmlImportAugmenter = {
  augment({ context, rule, source, yaml }): void {
    const collection = getConfigurationIndexCollectionContext(context)
    if (collection !== undefined && Object.prototype.hasOwnProperty.call(source, "InternalInfo")) {
      collection.collector.setXmlFlag(childSegmentUid(collection.logicalAddress, "InternalInfo"), "present")
    }
    const properties = asRecord(source["Properties"])
    if (
      collection !== undefined &&
      properties !== undefined &&
      rule.itemType === "MetadataConfigurationExtension" &&
      Object.prototype.hasOwnProperty.call(properties, "ExtendedConfigurationObject")
    ) {
      collection.collector.setXmlFlag(collection.logicalAddress, "extended")
    }
    for (const propertyState of propertyStates(source)) {
      const property = propertyState["xr:Property"]
      const state = propertyState["xr:State"]
      if (typeof property !== "string" || typeof state !== "string") continue
      if (state === "Notify") {
        const yamlName = propertyYamlName(rule, property)
        if (yamlName !== undefined) markPropertyState(yaml, yamlName, "проверять")
        continue
      }
      if (state !== "Extended") {
        if (state !== "NotSet" && state !== "Checked") {
          throw new Error(`Неизвестное значение PropertyState: ${state}`)
        }
        continue
      }
      const yamlName = propertyYamlName(rule, property)
      if (yamlName !== undefined && Object.prototype.hasOwnProperty.call(yaml, yamlName)) {
        const propertyKey = propertyKeyByXmlName(rule, property)
        const capability = propertyKey === undefined ? undefined : propertyStateRegistry()?.resolve({
          itemType: rule.itemType,
          propertyKey,
        })
        if (capability?.modes.length !== 1 || capability.modes[0] !== "extend") {
          markYAMLScalarTag(yaml, yamlName, "изменять")
        }
        continue
      }
      const segment = EXTENDED_SNAPSHOT_SEGMENTS[rule.itemType]?.[property]
      if (segment === undefined || collection === undefined) continue
      collection.collector.setXmlFlag(childSegmentUid(collection.logicalAddress, segment), "extended")
    }
  },
}

function propertyKeyByXmlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  return Object.entries(rule.properties).find(([propertyKey, propertyRule]) =>
    (propertyRule.xml ?? capitalize(propertyKey)) === xmlProperty)?.[0]
}

function propertyStateRegistry(): PropertyStateCapabilityRegistry | undefined {
  return currentOperationRegistrySet<{ readonly propertyStates: PropertyStateCapabilityRegistry }>()?.propertyStates
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

function propertyYamlName(rule: MetadataItemRule, xmlProperty: string): string | undefined {
  const alias = NOTIFY_ALIASES[xmlProperty]
  if (alias !== undefined) return alias
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    if ((propertyRule.xml ?? capitalize(propertyKey)) === xmlProperty && typeof propertyRule.yaml === "string") {
      return propertyRule.yaml
    }
  }
  return undefined
}

function markPropertyState(
  yaml: Record<string, unknown>,
  propertyName: string,
  tag: "проверять" | "изменять",
): void {
  if (!Object.prototype.hasOwnProperty.call(yaml, propertyName)) yaml[propertyName] = {}
  markYAMLScalarTag(yaml, propertyName, tag)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
