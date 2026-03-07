import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsYAML,
  MetadataCommandYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"

export const importMetadataCommandFromYAML = (
  context: ConfigurationContext,
  data: MetadataCommandYAML | undefined,
  name: string
): MetadataCommand | undefined => {
  if (!data) return undefined

  const raw = importPropertiesFromYAML({
    context,
    yaml: data,
    metadataRule: MetadataCommandRules,
    name,
    source: { name } as MetadataCommand,
  }) as MetadataCommand & { itemType?: "MetadataCommand" }

  const { itemType: _itemType, ...rest } = raw
  const result: MetadataCommand = {
    ...rest,
    itemType: "MetadataCommand",
    name,
  }

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}

export const importMetadataCommandsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataCommandsYAML | undefined
): MetadataCommands | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => importMetadataCommandFromYAML(context, value, name)!)
}

registerTypeRule("MetadataCommands", "importFromYAML", importMetadataCommandsFromYAML)
