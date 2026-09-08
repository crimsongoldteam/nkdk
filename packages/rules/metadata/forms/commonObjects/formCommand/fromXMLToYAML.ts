import {
  childUid,
  objectRecordOrUndefined,
  projectNamedXmlCollectionForImportWithRuntimeKeys,
  type XmlElementNode,
  xmlElementChildren,
} from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../../../ruleRuntime/metadataItem/fromXMLToYAML"
import { prepareNamedCollectionImportItem, type ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { FormCommandRules } from "./rules"
import { isMetadataNameYAML } from "../../../commonObjects/metadataName/types"
import { enterNestedYamlRule } from "../../../ruleRuntime/property/yamlRuleCursor"
import { namedXmlInputs } from "../namedXmlInputs"

type ImportedFormCommand = {
  name: string
  placement: ReturnType<typeof prepareNamedCollectionImportItem>
  rulePath: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]["rulePath"]
  xmlNode?: XmlElementNode
}

export const importFormCommandsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const commandNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node, "Command"))
  const source = commandNodes === undefined ? objectRecordOrUndefined(xml)?.Command ?? xml : undefined
  const items = commandNodes
    ?? formCommandCompatibilityItems(source)
  const collection = getConfigurationIndexCollectionContext(context)
  const entries: Array<{ key: string; value: Record<string, unknown>; invalid?: true }> = []
  const importedItems: ImportedFormCommand[] = []

  for (const { name, source: importXml, node: itemXmlNode } of namedXmlInputs(items)) {
    const placement = prepareNamedCollectionImportItem(traversal, importedItems.length)
    const itemContext = formCommandItemContext(context, collection, name)
    const itemTraversal = enterNestedYamlRule(
      placement.traversal,
      FormCommandRules.itemType,
    )
    const yaml = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: FormCommandRules,
      xml: importXml,
      name,
      traversal: {
        ...itemTraversal,
        ...(itemXmlNode === undefined ? {} : { xmlNodes: [itemXmlNode] }),
      },
    })
    const yamlRecord = objectRecordOrUndefined(yaml)
    if (yamlRecord === undefined) continue
    entries.push({
      key: name,
      value: yamlRecord,
      ...(isMetadataNameYAML(name) ? {} : { invalid: true }),
    })
    importedItems.push({
      placement,
      name,
      rulePath: itemTraversal.rulePath,
      ...(itemXmlNode === undefined ? {} : { xmlNode: itemXmlNode }),
    })
  }

  if (entries.length === 0) return undefined
  const projected = projectNamedXmlCollectionForImportWithRuntimeKeys({
    entries,
    annotations: traversal.annotations,
    ...(traversal.mode === "facts" ? { ephemeral: true as const } : {}),
  })
  for (const [index, item] of importedItems.entries()) {
    const runtimeKey = projected.runtimeKeys[index]!
    const yamlPath = item.placement.place(projected.yaml, runtimeKey, item.name, item.xmlNode)
    traversal.collector.acceptItem({
      itemType: FormCommandRules.itemType,
      name: item.name,
      yamlPath,
      rulePath: item.rulePath,
    })
  }

  return projected.yaml
}

function formCommandCompatibilityItems(source: unknown): readonly unknown[] {
  if (source === undefined) return []
  return Array.isArray(source) ? source : [source]
}

function formCommandItemContext(
  context: Parameters<ImportFromXMLToYAMLFunction>[0]["context"],
  collection: ReturnType<typeof getConfigurationIndexCollectionContext>,
  name: string,
): Parameters<ImportFromXMLToYAMLFunction>[0]["context"] {
  return collection === undefined
    ? context
    : withConfigurationIndexLogicalAddress(
        context,
        childUid(collection.logicalAddress, "Команда", name),
      )
}
