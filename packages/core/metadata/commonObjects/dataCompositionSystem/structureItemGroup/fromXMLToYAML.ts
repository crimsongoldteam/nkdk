import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { getTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { yamlPropertyUid } from "../../../configurationIndex/logicalAddress"
import type { ConfigurationContextFromXML } from "../../../context/types"

export const importStructureItemGroupFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const importGroupItems = getTypeRule("StructureItemGroupCollection", "importFromXMLToYAML")
  if (importGroupItems === undefined) return undefined

  const result: unknown[] = []
  const visit = (value: unknown): void => {
    const group = asRecord(value)
    if (group === undefined || group["_xsi:type"] !== "dcsset:StructureItemGroup") return
    const nodeContext = contextForStructureNode(context, result.length)
    const groupItemsContext = contextForYamlProperty(nodeContext, "ПоляГруппировки")
    const groupItems = asRecord(group["dcsset:groupItems"])?.["dcsset:item"]
    const yaml = importGroupItems({
      context: groupItemsContext,
      rule: { type: "StructureItemGroupCollection" },
      xml: groupItems,
      name,
      traversal: { ...traversal, yamlPath: [...traversal.yamlPath, result.length] },
    })
    result.push(...asArray(yaml))
    asArray(group["dcsset:item"]).forEach(visit)
  }
  visit(xml)
  return result.length === 0 ? undefined : result
}

function contextForStructureNode(
  context: ConfigurationContextFromXML,
  flatIndex: number
): ConfigurationContextFromXML {
  let result = context
  for (let index = 0; index < flatIndex; index += 1) {
    result = contextForYamlProperty(result, "Структура")
  }
  return result
}

function contextForYamlProperty(
  context: ConfigurationContextFromXML,
  propertyName: string
): ConfigurationContextFromXML {
  const collection = getConfigurationIndexCollectionContext(context)
  if (collection === undefined || collection.yamlPathAddressing !== true) return context
  const address = yamlPropertyUid(collection.logicalAddress, propertyName)
  return withConfigurationIndexXmlNodeLogicalAddress(
    withConfigurationIndexLogicalAddress(context, address),
    address
  )
}

function asArray(value: unknown): unknown[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
