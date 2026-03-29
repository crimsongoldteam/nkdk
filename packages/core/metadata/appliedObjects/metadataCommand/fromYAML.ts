import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsYAML,
  MetadataCommandYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importMetadataItemFromYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"

export const importMetadataCommandFromYAML = (
  context: ConfigurationContext,
  data: MetadataCommandYAML | undefined,
  name: string
): MetadataCommand | undefined => {
  if (!data) return undefined

  const raw = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: MetadataCommandRules,
    name,
    source: { name } as MetadataCommand,
  })
  if (raw == undefined) return undefined

  const result: MetadataCommand = {
    ...raw,
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
