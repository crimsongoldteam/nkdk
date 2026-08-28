import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
  getConfigurationIndexChildren,
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
  type ConfigurationContextFromXML,
} from "@nkdk/runtime"

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
import {
  canonicalNamedChildren,
  childrenToPersist,
  mergeSavedChildren,
} from "../../commonObjects/omittedChildren"

export function importConfigurationExtensionCollectionState(params: {
  readonly context: ConfigurationContextFromXML
  readonly rule: MetadataItemRule
  readonly source: Record<string, unknown>
  readonly yaml: Record<string, unknown>
}): void {
  const borrowed = params.context.fromXML.currentXMLDefaultVariant === "adopted"
  if (params.rule.itemType === "ExchangePlanContent") {
    const items = arrayOfRecords(params.yaml.items)
    persistExchangePlanItemOrder(params.context, items)
    if (!borrowed) {
      if (params.source.ExtensionProperty !== undefined || params.yaml.extensionProperties !== undefined) {
        throw new Error("ExtensionProperty недопустим для full ExchangePlanContent")
      }
      return
    }
    const states = arrayOfRecords(params.yaml.extensionProperties).map((item) => ({
      metadata: requiredString(item.metadata, "Metadata"),
      state: requiredState(item.state),
    }))
    params.yaml.items = joinExchangePlanExtensionContent(items, states)
    delete params.yaml.extensionProperties
    return
  }
  if (params.rule.properties.extensionState === undefined) return
  if (!borrowed) {
    if (params.source.ExtensionState !== undefined) {
      throw new Error(`ExtensionState недопустим для full ${params.rule.itemType}`)
    }
    return
  }
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
    const orderedItems = orderExchangePlanItems(split.items, getConfigurationIndexChildren(params.context))
    const enabledMetadata = orderedItems.map((item) =>
      importMetadataObjectStringFromYAML(params.context!, metadataRule, requiredString(item.Метаданные, "Метаданные"))
    )
    for (const output of params.outputs.values()) {
      const outputItems = arrayOfRecords(output.Item)
      const outputByMetadata = new Map(outputItems.map((item) => [item.Metadata, item]))
      output.Item = enabledMetadata.map((metadata) => outputByMetadata.get(metadata)).filter(isRecord)
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

function persistExchangePlanItemOrder(
  context: ConfigurationContextFromXML,
  items: readonly Readonly<Record<string, unknown>>[],
): void {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || items.length === 0) return
  const names = items.map((item) => requiredString(item.Метаданные, "Метаданные"))
  const actual = names.map((name) => ({ xmlName: "Item", name }))
  const saved = childrenToPersist(actual, canonicalNamedChildren("Item", names))
  if (saved !== undefined) {
    collection.collector.setChildren(getConfigurationIndexCollectionXmlNodeLogicalAddress(collection), saved)
  }
}

function orderExchangePlanItems(
  items: readonly Record<string, unknown>[],
  saved: ReturnType<typeof getConfigurationIndexChildren>,
): Record<string, unknown>[] {
  const byMetadata = new Map(items.map((item) => [requiredString(item.Метаданные, "Метаданные"), item]))
  const names = [...byMetadata.keys()]
  const current = names.map((name) => ({ xmlName: "Item", name }))
  return mergeSavedChildren(current, saved, canonicalNamedChildren("Item", names))
    .map(({ name }) => byMetadata.get(name))
    .filter(isRecord)
}

function isRecord(value: Record<string, unknown> | undefined): value is Record<string, unknown> {
  return value !== undefined
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
