import { getConfigurationIndexCollectionContext, getConfigurationIndexXmlNodeLogicalAddress } from "../../configurationIndex/collector/context"
import type { ConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ConfigurationChildObjectsXML } from "./childObjects"

const PROPERTY_KEY = "childObjects"

function normalizeNames(value: unknown): string[] {
  if (typeof value === "string") return [value]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function encodeEntry(xmlName: string, itemName: string): string {
  return JSON.stringify([xmlName, itemName])
}

function decodeEntry(value: string): readonly [string, string] | undefined {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string"
      ? [parsed[0], parsed[1]]
      : undefined
  } catch {
    return undefined
  }
}

registerTypeRule("ConfigurationChildObjects", "collectConfigurationIndexFromXML", ({ context, xml }) => {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || typeof xml !== "object" || xml === null || Array.isArray(xml)) return

  const order = Object.entries(xml).flatMap(([xmlName, value]) =>
    normalizeNames(value).map((itemName) => encodeEntry(xmlName, itemName))
  )
  collection.collector.setOrder(getConfigurationIndexXmlNodeLogicalAddress(collection), order)
})

export function configurationChildObjectsFromIndex(
  runtime: ConfigurationIndexExportRuntime | undefined
): ConfigurationChildObjectsXML | undefined {
  const propertyRuntime = runtime?.withPropertyContext(PROPERTY_KEY)
  if (propertyRuntime === undefined) return undefined
  const order = propertyRuntime.xmlNode()?.order
  if (order === undefined) return undefined
  propertyRuntime.collector.setOrder(
    propertyRuntime.xmlNodeLogicalAddress ?? propertyRuntime.logicalAddress,
    order
  )

  const result: ConfigurationChildObjectsXML = {}
  for (const encoded of order) {
    const entry = decodeEntry(encoded)
    if (entry === undefined) continue
    const [xmlName, itemName] = entry
    const previous = result[xmlName]
    result[xmlName] =
      previous === undefined ? itemName : Array.isArray(previous) ? [...previous, itemName] : [previous, itemName]
  }
  return result
}
