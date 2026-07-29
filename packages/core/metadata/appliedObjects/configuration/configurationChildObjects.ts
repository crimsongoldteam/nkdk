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
const XML_METADATA = Symbol.for("metadata")
const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")

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
  if (propertyRuntime === undefined) return buildChildObjects(currentItems)

  const currentKeys = new Set(currentItems.map(itemKey))
  const preserved = savedItems?.filter((item) => currentKeys.has(itemKey(item))) ?? []
  const preservedKeys = new Set(preserved.map(itemKey))
  const merged = [...preserved, ...currentItems.filter((item) => !preservedKeys.has(itemKey(item)))]
  propertyRuntime.collector.setOmittedChildren(
    propertyRuntime.xmlNodeLogicalAddress ?? propertyRuntime.logicalAddress,
    { kind: "typedNames", items: merged }
  )

  return buildChildObjects(merged)
}

function buildChildObjects(items: readonly { xmlName: string; name: string }[]): ConfigurationChildObjectsXML {
  const result: ConfigurationChildObjectsXML = {}
  for (const { xmlName, name } of items) {
    const previous = result[xmlName]
    result[xmlName] = previous === undefined ? name : Array.isArray(previous) ? [...previous, name] : [previous, name]
  }
  Object.defineProperty(result, XML_ORDERED_CHILDREN, {
    value: items.map(({ xmlName, name }) => ({ key: xmlName, value: name })),
    enumerable: false,
  })
  return result
}

function flattenChildObjects(xml: object): { xmlName: string; name: string }[] {
  const childOrder = getXMLChildOrder(xml)
  if (childOrder !== undefined) {
    return childOrder.flatMap(({ key: xmlName, index }) => {
      const name = normalizeNames((xml as Record<string, unknown>)[xmlName])[index]
      return name === undefined ? [] : [{ xmlName, name }]
    })
  }
  return Object.entries(xml).flatMap(([xmlName, value]) =>
    xmlName === "#text" ? [] : normalizeNames(value).map((name) => ({ xmlName, name }))
  )
}

function getXMLChildOrder(xml: object): Array<{ key: string; index: number }> | undefined {
  const metadata = (xml as Record<PropertyKey, unknown>)[XML_METADATA]
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) return undefined
  const childOrder = (metadata as Record<string, unknown>).childOrder
  if (!Array.isArray(childOrder)) return undefined
  return childOrder.filter(
    (entry): entry is { key: string; index: number } =>
      typeof entry === "object" &&
      entry !== null &&
      !Array.isArray(entry) &&
      typeof (entry as Record<string, unknown>).key === "string" &&
      Number.isInteger((entry as Record<string, unknown>).index) &&
      (entry as Record<string, number>).index >= 0
  )
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
