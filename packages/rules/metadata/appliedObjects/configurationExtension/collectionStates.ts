import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import {
  exportPredefinedExtensionState,
  importPredefinedExtensionState,
} from "../../commonObjects/predefinedItem/extensionState"
import {
  joinExchangePlanExtensionContent,
  splitExchangePlanExtensionContent,
  type ExtensionPropertyItem,
} from "../../commonObjects/exchangePlanContent/extensionState"
import { importMetadataObjectStringFromYAML } from "../../commonObjects/metadataPath/fromYAML"
import { ExchangePlanContentItemRules } from "../../commonObjects/exchangePlanContent/rules"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"

export function importConfigurationExtensionCollectionState(params: {
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
}): void {
  if (params.rule.itemType === "ExchangePlanContent") {
    const items = arrayOfRecords(params.yaml.items)
    const states = arrayOfRecords(params.yaml.extensionProperties).map((item) => ({
      metadata: requiredString(item.metadata, "Metadata"),
      state: requiredState(item.state),
    }))
    params.yaml.items = joinExchangePlanExtensionContent(items, states)
    delete params.yaml.extensionProperties
    return
  }
  if (params.rule.properties.extensionState === undefined) return
  importPredefinedExtensionState(params.source, params.yaml)
}

export function exportConfigurationExtensionCollectionState(params: {
  readonly context?: ConfigurationContextWithExportToXML
  readonly rule: MetadataItemRule
  readonly yaml: Readonly<Record<string, unknown>>
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly borrowed: boolean
}): void {
  if (params.rule.itemType === "ExchangePlanContent") {
    const split = splitExchangePlanExtensionContent(arrayOfRecords(params.yaml.items))
    if (params.context === undefined) throw new Error("Не задан контекст экспорта состава плана обмена")
    const metadataRule = ExchangePlanContentItemRules.properties.metadata
    const extensionItems = split.states.map(({ metadata, state }) => ({
      Metadata: importMetadataObjectStringFromYAML(params.context!, metadataRule, metadata) ?? metadata,
      State: state,
    }))
    for (const output of params.outputs.values()) {
      output.ExtensionProperty = { Item: extensionItems }
    }
    return
  }
  const propertyRule = params.rule.properties.extensionState
  if (propertyRule === undefined) return
  const state = exportPredefinedExtensionState({ yaml: params.yaml, borrowed: params.borrowed })
  if (state === undefined) return
  const xmlName = propertyRule.xml ?? "ExtensionState"
  for (const output of params.outputs.values()) output[xmlName] = state
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map((item) => {
        if (item === null || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("Элемент состава плана обмена должен быть объектом")
        }
        return item as Record<string, unknown>
      })
    : []
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new Error(`Не задан ${field} элемента ExtensionProperty`)
  return value
}

function requiredState(value: unknown): ExtensionPropertyItem["state"] {
  if (value === "Check" || value === "Modify") return value
  throw new Error(`Для элемента состава задан неизвестный State: ${String(value)}`)
}
