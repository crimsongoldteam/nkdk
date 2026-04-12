import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsYAML,
  MetadataCommandYAML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportMetadataItemToYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { MetadataCommandRules } from "./rules"

export const exportMetadataCommandsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataCommands | undefined
): MetadataCommandsYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(data.map((command) => [command.name, exportMetadataCommandToYAML(context, command)!]))
}

export const exportMetadataCommandToYAML = (
  context: ConfigurationContext,
  data: MetadataCommand | undefined
): MetadataCommandYAML | undefined => {
  if (!data) return undefined

  return exportMetadataItemToYAML({
    context,
    data,
    rule: MetadataCommandRules,
  }) as MetadataCommandYAML | undefined
}

registerTypeRule("MetadataCommands", "exportToYAML", exportMetadataCommandsToYAML)
