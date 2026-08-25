import {
  objectRecordOrUndefined,
  type XmlElementNode,
  withConfigurationIndexYamlCollectionItemContext,
  xmlElementChildren,
} from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { FilterItemComparisonRules, FilterItemGroupRules } from "./rules"

export const importFilterItemFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, xml, traversal }) => {
  const xmlRecord = objectRecordOrUndefined(xml)
  const source = xmlRecord?.["_xsi:type"] === undefined ? (xmlRecord?.["dcsset:item"] ?? xml) : xml
  const itemNodes = traversal.xmlNodes?.flatMap(filterItemNodes)
  const items = itemNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemNodes.map(({ compatibilityValue }) => compatibilityValue)
  const result = items.flatMap((value, index) => {
    const item = objectRecordOrUndefined(value)
    const itemRule =
      item?.["_xsi:type"] === "dcsset:FilterItemComparison"
        ? FilterItemComparisonRules
        : item?.["_xsi:type"] === "dcsset:FilterItemGroup"
          ? FilterItemGroupRules
          : undefined
    if (item === undefined || itemRule === undefined) return []

    const itemNode = itemNodes?.[index]
    const { xmlNodes: _parentXmlNodes, ...itemTraversal } = traversal
    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: itemRule,
      xml: itemNode ?? item,
      traversal: {
        ...itemTraversal,
        yamlPath: [...traversal.yamlPath, index],
        ...(itemNode === undefined ? {} : { xmlNodes: [itemNode] }),
      },
    })
    return yaml === undefined ? [] : [yaml]
  })

  return result.length === 0 ? undefined : result
}

function filterItemNodes(node: XmlElementNode): XmlElementNode[] {
  if (objectRecordOrUndefined(node.compatibilityValue)?.["_xsi:type"] !== undefined) return [node]
  return xmlElementChildren(node, "dcsset:item")
}
