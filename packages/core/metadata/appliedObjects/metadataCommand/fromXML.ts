import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importPropertiesFromXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"

export const importMetadataCommandsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  xml: MetadataCommandsXML | MetadataCommandXML | undefined
): MetadataCommands | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataCommandXML) => importMetadataCommandFromXML(context, value)!)
}

const importMetadataCommandFromXML = (
  context: ConfigurationContext,
  xml: MetadataCommandXML | undefined
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties
  if (!props) {
    return {
      itemType: "MetadataCommand",
      name: "",
      group: "",
      synonym: { items: { [context.defaultLanguage]: "" } },
    }
  }

  const properties = importPropertiesFromXML({
    context,
    xml: props,
    rule: MetadataCommandRules,
  })

  if (!properties) return undefined

  const result: MetadataCommand = {
    ...properties,
    itemType: "MetadataCommand",
    name: props.Name,
  }

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataCommands", "importFromXML", importMetadataCommandsFromXML)
