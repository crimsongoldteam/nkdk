import {
  objectRecordOrUndefined,
  isXmlElementNode,
  xmlAttributeValue,
  type XmlElementNode,
  withConfigurationIndexYamlCollectionItemContext,
  xmlElementChildren,
} from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export const importFilterItemFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const itemNodes = traversal.xmlNodes?.flatMap(filterItemNodes)
  const xmlRecord = itemNodes === undefined ? objectRecordOrUndefined(xml) : undefined
  const source = xmlRecord?.["_xsi:type"] === undefined ? (xmlRecord?.["dcsset:item"] ?? xml) : xml
  const items = itemNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemNodes
  const result = items.flatMap((value, index) => {
    const itemNode = isXmlElementNode(value) ? value : undefined
    const item = itemNode === undefined ? objectRecordOrUndefined(value) : undefined
    const type = itemNode === undefined ? item?.["_xsi:type"]
      : xmlAttributeValue(itemNode, "xsi:type")
    const itemRule =
      type === "dcsset:FilterItemComparison"
        ? FilterItemComparisonRules
        : type === "dcsset:FilterItemGroup"
          ? FilterItemGroupRules
          : undefined
    if (itemRule === undefined) return []

    const { xmlNodes: _parentXmlNodes, ...itemTraversal } = traversal
    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: itemRule,
      xml: itemNode ?? item,
      traversal: {
        ...itemTraversal,
        pathCursor: traversal.pathCursor.child(index),
        ...(itemNode === undefined ? {} : { xmlNodes: [itemNode] }),
      },
    })
    return yaml === undefined ? [] : [yaml]
  })

  return result.length === 0 ? undefined : result
}

function filterItemNodes(node: XmlElementNode): XmlElementNode[] {
  if (xmlAttributeValue(node, "xsi:type") !== undefined) return [node]
  return xmlElementChildren(node, "dcsset:item")
}
