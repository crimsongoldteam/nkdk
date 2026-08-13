import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationIndexChild, ConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { childrenToPersist, mergeSavedChildren } from "../../commonObjects/omittedChildren"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { STANDARD_CHILD_OBJECT_TYPE_ORDER } from "./childObjects"
import type { ConfigurationChildObjectsXML } from "./childObjects"

const PROPERTY_KEY = "childObjects"
const XML_METADATA = Symbol.for("metadata")
const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")

export const metadataPropertyRule000 = definePropertyTypeRule(
  "ConfigurationChildObjects",
  "collectConfigurationIndexFromXML",
  ({ context, xml }) => {
    const collection = getConfigurationIndexCollectionContext(context)
    if (collection === undefined || !isRecord(xml)) return
    const actual = flattenChildObjects(xml)
    const saved = rootChildrenToPersist(actual)
    if (saved !== undefined) {
      collection.collector.setChildren(
        getConfigurationIndexCollectionXmlNodeLogicalAddress(collection),
        saved,
      )
    }
  },
)

export function configurationChildObjectsFromIndex(
  runtime: ConfigurationIndexExportRuntime | undefined,
  current: ConfigurationChildObjectsXML,
): ConfigurationChildObjectsXML {
  const currentItems = flattenChildObjects(current)
  assertUniqueItems(currentItems)
  if (currentItems.length === 0) return {}
  const canonical = canonicalRootChildren(currentItems)
  const propertyRuntime = runtime?.withPropertyContext(PROPERTY_KEY)
  const saved = propertyRuntime?.children()
  const merged = saved === undefined ? canonical : mergeRootChildren(currentItems, saved, canonical)
  const toPersist = rootChildrenToPersist(merged)
  if (propertyRuntime !== undefined && toPersist !== undefined) {
    propertyRuntime.collector.setChildren(
      propertyRuntime.xmlNodeLogicalAddress ?? propertyRuntime.logicalAddress,
      toPersist,
    )
  }
  return buildChildObjects(merged)
}

function mergeRootChildren(
  current: readonly ConfigurationIndexChild[],
  saved: readonly ConfigurationIndexChild[],
  canonical: readonly ConfigurationIndexChild[],
): ConfigurationIndexChild[] {
  assertUniqueItems(saved)
  const currentKeys = new Set(current.map(itemKey))
  const savedCurrentCount = saved.filter((item) => currentKeys.has(itemKey(item))).length
  if (savedCurrentCount === current.length) return mergeSavedChildren(current, saved, canonical)

  const savedKinds = new Set<string>(saved.map(({ xmlName }) => xmlName))
  return STANDARD_CHILD_OBJECT_TYPE_ORDER.flatMap((xmlName) => {
    const currentKind = current.filter((item) => item.xmlName === xmlName)
    const canonicalKind = canonical.filter((item) => item.xmlName === xmlName)
    const savedKind = savedKinds.has(xmlName) ? saved.filter((item) => item.xmlName === xmlName) : undefined
    return mergeSavedChildren(currentKind, savedKind, canonicalKind)
  })
}

function rootChildrenToPersist(actual: readonly ConfigurationIndexChild[]): ConfigurationIndexChild[] | undefined {
  assertUniqueItems(actual)
  const canonical = canonicalRootChildren(actual)
  if (childrenToPersist(actual, canonical) === undefined) return undefined
  if (!hasCanonicalKindOrder(actual)) return actual.map(copyChild)
  const changedKinds = new Set<string>()
  for (const xmlName of STANDARD_CHILD_OBJECT_TYPE_ORDER) {
    const actualKind = actual.filter((item) => item.xmlName === xmlName)
    const canonicalKind = canonical.filter((item) => item.xmlName === xmlName)
    if (childrenToPersist(actualKind, canonicalKind) !== undefined) changedKinds.add(xmlName)
  }
  const result = actual.filter((item) => changedKinds.has(item.xmlName)).map(copyChild)
  return result.length === 0 ? undefined : result
}

function canonicalRootChildren(items: readonly ConfigurationIndexChild[]): ConfigurationIndexChild[] {
  assertUniqueItems(items)
  const rank = new Map<string, number>(STANDARD_CHILD_OBJECT_TYPE_ORDER.map((xmlName, index) => [xmlName, index]))
  return items.map(copyChild).sort((left, right) => {
    const typeOrder = (rank.get(left.xmlName) ?? Number.MAX_SAFE_INTEGER)
      - (rank.get(right.xmlName) ?? Number.MAX_SAFE_INTEGER)
    return typeOrder || left.name.localeCompare(right.name, "ru")
  })
}

function hasCanonicalKindOrder(items: readonly ConfigurationIndexChild[]): boolean {
  const rank = new Map<string, number>(STANDARD_CHILD_OBJECT_TYPE_ORDER.map((xmlName, index) => [xmlName, index]))
  let previous = -1
  for (const item of items) {
    const current = rank.get(item.xmlName) ?? Number.MAX_SAFE_INTEGER
    if (current < previous) return false
    previous = current
  }
  return true
}

function buildChildObjects(items: readonly ConfigurationIndexChild[]): ConfigurationChildObjectsXML {
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

function flattenChildObjects(xml: object): ConfigurationIndexChild[] {
  const childOrder = getXMLChildOrder(xml)
  if (childOrder !== undefined) {
    return childOrder.flatMap(({ key: xmlName, index }) => {
      const name = normalizeNames((xml as Record<string, unknown>)[xmlName])[index]
      return name === undefined ? [] : [{ xmlName, name }]
    })
  }
  return Object.entries(xml).flatMap(([xmlName, value]) =>
    xmlName === "#text" ? [] : normalizeNames(value).map((name) => ({ xmlName, name })),
  )
}

function getXMLChildOrder(xml: object): Array<{ key: string; index: number }> | undefined {
  const metadata = (xml as Record<PropertyKey, unknown>)[XML_METADATA]
  if (!isRecord(metadata) || !Array.isArray(metadata.childOrder)) return undefined
  return metadata.childOrder.filter(
    (entry): entry is { key: string; index: number } =>
      isRecord(entry) && typeof entry.key === "string" && Number.isInteger(entry.index) && Number(entry.index) >= 0,
  )
}

function normalizeNames(value: unknown): string[] {
  const result: string[] = []
  for (const item of Array.isArray(value) ? value : [value]) {
    if (typeof item === "string") result.push(item)
  }
  return result
}

function assertUniqueItems(items: readonly ConfigurationIndexChild[]): void {
  const seen = new Set<string>()
  for (const item of items) {
    const key = itemKey(item)
    if (seen.has(key)) throw new Error(`Дублирующаяся пара ${item.xmlName}/${item.name} в children`)
    seen.add(key)
  }
}

function itemKey(item: ConfigurationIndexChild): string {
  return `${item.xmlName}\0${item.name}`
}

function copyChild(item: ConfigurationIndexChild): ConfigurationIndexChild {
  return { xmlName: item.xmlName, name: item.name }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
