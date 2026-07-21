import { childUid } from "../../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { importMetadataItemFromXMLToYAML } from "../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { FormCommandRules } from "./rules"

export const importFormCommandsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  traversal,
}) => {
  const source = asRecord(xml)?.Command ?? xml
  const items = Array.isArray(source) ? source : source === undefined ? [] : [source]
  const collection = getConfigurationIndexCollectionContext(context)
  const entries = items.flatMap((value) => {
    const item = asRecord(value)
    if (item === undefined || typeof item._name !== "string") return []
    const itemContext =
      collection === undefined
        ? context
        : withConfigurationIndexLogicalAddress(
            context,
            childUid(collection.logicalAddress, "Команда", item._name)
          )
    const normalized = item.Representation === "TextPicture" ? { ...item, Representation: "PictureAndText" } : item
    const yaml = importMetadataItemFromXMLToYAML({
      context: itemContext,
      rule: FormCommandRules,
      xml: normalized,
      name: item._name,
      traversal: {
        ...traversal,
        yamlPath: [...traversal.yamlPath, item._name],
      },
    })
    return yaml === undefined ? [] : [[item._name, yaml] as const]
  })

  return entries.length === 0 ? undefined : Object.fromEntries(entries)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
