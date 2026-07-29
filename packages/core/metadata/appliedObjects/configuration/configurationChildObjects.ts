import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexXmlNodeLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { ConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { readOmittedTypedNames } from "../../commonObjects/omittedChildren"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ConfigurationChildObjectsXML } from "./childObjects"

const PROPERTY_KEY = "childObjects"
const PROPERTY_TYPE = "ConfigurationChildObjects"

function normalizeNames(value: unknown): string[] {
  if (typeof value === "string") return [value]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

registerTypeRule("ConfigurationChildObjects", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || typeof xml !== "object" || xml === null || Array.isArray(xml)) return

  const items = flattenChildObjects(xml)
  if (items.length === 0) return
  collection.collector.setOmittedChildren(getConfigurationIndexXmlNodeLogicalAddress(collection), {
    kind: "typedNames",
    items,
  })
})

export function configurationChildObjectsFromIndex(
  runtime: ConfigurationIndexExportRuntime | undefined,
  current: ConfigurationChildObjectsXML
): ConfigurationChildObjectsXML {
  const currentItems = flattenChildObjects(current)
  assertUniqueItems(currentItems)

  const propertyRuntime = runtime?.withPropertyContext(PROPERTY_KEY)
  const savedItems =
    propertyRuntime === undefined ? undefined : readOmittedTypedNames(propertyRuntime.omittedChildren(), PROPERTY_TYPE)
  if (savedItems !== undefined) assertUniqueItems(savedItems)
  if (currentItems.length === 0) return {}
  if (propertyRuntime === undefined) return current

  const currentKeys = new Set(currentItems.map(itemKey))
  const preserved = savedItems?.filter((item) => currentKeys.has(itemKey(item))) ?? []
  const preservedKeys = new Set(preserved.map(itemKey))
  const merged = [...preserved, ...currentItems.filter((item) => !preservedKeys.has(itemKey(item)))]
  propertyRuntime.collector.setOmittedChildren(
    propertyRuntime.xmlNodeLogicalAddress ?? propertyRuntime.logicalAddress,
    { kind: "typedNames", items: merged }
  )

  const result: ConfigurationChildObjectsXML = {}
  for (const { xmlName, name } of merged) {
    const previous = result[xmlName]
    result[xmlName] = previous === undefined ? name : Array.isArray(previous) ? [...previous, name] : [previous, name]
  }
  return result
}

function flattenChildObjects(xml: object): { xmlName: string; name: string }[] {
  return Object.entries(xml).flatMap(([xmlName, value]) => normalizeNames(value).map((name) => ({ xmlName, name })))
}

function assertUniqueItems(items: readonly { xmlName: string; name: string }[]): void {
  const seen = new Set<string>()
  for (const item of items) {
    const key = itemKey(item)
    if (seen.has(key)) {
      throw new Error(`Дублирующаяся пара ${item.xmlName}/${item.name} в omittedChildren`)
    }
    seen.add(key)
  }
}

function itemKey(item: { xmlName: string; name: string }): string {
  return `${item.xmlName}\0${item.name}`
}
