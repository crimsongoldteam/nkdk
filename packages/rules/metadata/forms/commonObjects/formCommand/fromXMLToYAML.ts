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
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { FormCommandRules } from "./rules"
import { isMetadataNameYAML } from "../../../commonObjects/metadataName/types"
import { enterNestedYamlRule } from "../../../ruleRuntime/property/yamlRuleCursor"

type ImportedFormCommand = {
  name: string
  sourceYamlPath: readonly (string | number)[]
  rulePath: Parameters<ImportFromXMLToYAMLFunction>[0]["traversal"]["rulePath"]
  xmlNode?: XmlElementNode
}

export const importFormCommandsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const source = objectRecordOrUndefined(xml)?.Command ?? xml
  const commandNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node, "Command"))
  const items = commandNodes?.map(({ compatibilityValue }) => compatibilityValue)
    ?? formCommandCompatibilityItems(source)
  const collection = getConfigurationIndexCollectionContext(context)
  const entries: Array<{ key: string; value: Record<string, unknown>; invalid?: true }> = []
  const importedItems: ImportedFormCommand[] = []

  for (const [index, value] of items.entries()) {
    const item = objectRecordOrUndefined(value)
    if (item === undefined || typeof item._name !== "string") continue
    const name = item._name
    const itemContext = formCommandItemContext(context, collection, name)
    const itemTraversal = enterNestedYamlRule(
      { ...traversal, yamlPath: [...traversal.yamlPath, name] },
      FormCommandRules.itemType,
    )
    const itemXmlNode = commandNodes?.[index]
    const importXml = itemXmlNode ?? item
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
      name,
      sourceYamlPath: itemTraversal.yamlPath,
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
    const yamlPath = [...traversal.yamlPath, runtimeKey]
    if (runtimeKey !== item.sourceYamlPath.at(-1)) {
      traversal.audit?.rekeyYamlPath(item.sourceYamlPath, yamlPath, item.xmlNode)
    }
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
