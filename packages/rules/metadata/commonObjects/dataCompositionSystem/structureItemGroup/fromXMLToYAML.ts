import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import {
  getConfigurationIndexCollectionContext,
  objectRecordOrUndefined,
  type XmlElementNode,
  withConfigurationIndexLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
  xmlElementChildren,
} from "@nkdk/runtime"
import { yamlPropertyUid } from "@nkdk/runtime"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"

export const importStructureItemGroupFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const importGroupItems = getTypeRule("StructureItemGroupCollection", "importFromXMLToYAML")
  if (importGroupItems === undefined) return undefined

  const result: unknown[] = []
  const visit = (value: unknown, xmlNode?: XmlElementNode): void => {
    const group = objectRecordOrUndefined(xmlNode?.compatibilityValue ?? value)
    if (group === undefined || group["_xsi:type"] !== "dcsset:StructureItemGroup") return
    const flatIndex = result.length
    const yamlPath = [...traversal.yamlPath, flatIndex]
    const nodeContext = contextForStructureNode(context, flatIndex)
    const groupItemsContext = contextForYamlProperty(nodeContext, "ПоляГруппировки")
    const groupItems = objectRecordOrUndefined(group["dcsset:groupItems"])?.["dcsset:item"]
    const groupItemsNode = xmlNode === undefined
      ? undefined
      : xmlElementChildren(xmlNode, "dcsset:groupItems")[0]
    claimKnownGroupStructure({
      xmlNode,
      groupItemsNode,
      traversal,
      yamlPath,
    })
    const groupItemNodes = groupItemsNode === undefined
      ? undefined
      : xmlElementChildren(groupItemsNode, "dcsset:item")
    const { xmlNodes: _parentXmlNodes, ...groupItemsTraversal } = traversal
    const yaml = importGroupItems({
      context: groupItemsContext,
      rule: { type: "StructureItemGroupCollection" },
      xml: groupItemNodes?.map(({ compatibilityValue }) => compatibilityValue) ?? groupItems,
      name,
      traversal: {
        ...groupItemsTraversal,
        yamlPath,
        ...(groupItemNodes === undefined ? {} : { xmlNodes: groupItemNodes }),
      },
    })
    result.push(...asArray(yaml))
    const nestedGroupNodes = xmlNode === undefined
      ? undefined
      : xmlElementChildren(xmlNode, "dcsset:item")
    const nestedGroups = nestedGroupNodes?.map(({ compatibilityValue }) => compatibilityValue)
      ?? asArray(group["dcsset:item"])
    nestedGroups.forEach((nestedGroup, index) => {
      const nestedGroupNode = nestedGroupNodes?.[index]
      if (nestedGroupNode !== undefined) {
        traversal.audit?.claim(nestedGroupNode, {
          itemType: "StructureItemGroup",
          propertyKey: "item",
          propertyType: "StructureItemGroup",
          yamlPath: [...traversal.yamlPath, result.length],
          rulePath: [...traversal.rulePath, { propertyKey: "item" }],
        })
      }
      visit(nestedGroup, nestedGroupNode)
    })
  }
  const rootNodes = traversal.xmlNodes
  const roots = rootNodes?.map(({ compatibilityValue }) => compatibilityValue) ?? asArray(xml)
  roots.forEach((root, index) => visit(root, rootNodes?.[index]))
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

function claimKnownGroupStructure(params: {
  xmlNode?: XmlElementNode
  groupItemsNode?: XmlElementNode
  traversal: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]
  yamlPath: readonly (string | number)[]
}): void {
  const audit = params.traversal.audit
  if (audit === undefined) return
  const boundary = {
    itemType: "StructureItemGroup",
    yamlPath: [...params.yamlPath],
    rulePath: params.traversal.rulePath,
  }
  if (params.groupItemsNode !== undefined) audit.claim(params.groupItemsNode, boundary)
  const xsiType = params.xmlNode?.attributes.find(
    ({ name, value }) => name === "xsi:type" && value === "dcsset:StructureItemGroup",
  )
  if (xsiType !== undefined) audit.claim(xsiType, boundary)
}
