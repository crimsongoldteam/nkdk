import { withConfigurationIndexYamlCollectionItemContext } from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { CalculatedFieldOrderExpressionRules } from "./rules"

export const importCalculatedFieldOrderExpressionFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const itemXmlNodes = traversal.xmlNodes?.filter(
    (node) => node.name === "dcssch:orderExpression",
  )
  const source = itemXmlNodes === undefined ? asRecord(xml)?.["dcssch:orderExpression"] ?? xml : undefined
  const items = itemXmlNodes === undefined
    ? Array.isArray(source) ? source : source === undefined ? [] : [source]
    : itemXmlNodes
  const result = items.flatMap((item, index) => {
    const itemXmlNode = itemXmlNodes?.[index]
    const { xmlNodes: _parentXmlNodes, ...itemTraversal } = traversal
    const yaml = importMetadataItemFromXMLToYAML({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: CalculatedFieldOrderExpressionRules,
      xml: itemXmlNode ?? item,
      traversal: {
        ...itemTraversal,
        pathCursor: traversal.pathCursor.child(index),
        ...(itemXmlNode === undefined ? {} : { xmlNodes: [itemXmlNode] }),
      },
    })
    return yaml === undefined ? [] : [yaml]
  })

  return result.length === 0 ? undefined : result
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
