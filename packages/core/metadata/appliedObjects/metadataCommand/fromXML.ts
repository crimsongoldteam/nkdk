import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importMetadataItemFromXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"

export const importMetadataCommandsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: MetadataCommandsXML | MetadataCommandXML | undefined
): MetadataCommands | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataCommandXML) => importMetadataCommandFromXML(context, value)!)
}

const importMetadataCommandFromXML = (
  context: ConfigurationContextFromXML,
  xml: MetadataCommandXML | undefined
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties
  if (!props) {
    return {
      itemType: MetadataCommandRules.itemType,
      name: "",
      group: "",
      synonym: { items: { [context.defaultLanguage]: "" } },
    }
  }

  const properties = importMetadataItemFromXML({
    context,
    xml: props,
    rule: MetadataCommandRules,
  })

  if (!properties) return undefined

  const result: MetadataCommand = {
    ...properties,
    name: props.Name,
  }

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataCommands", "importFromXML", importMetadataCommandsFromXML)
