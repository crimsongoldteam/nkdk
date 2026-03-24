import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromXML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommands, FormCommandsXML, FormCommandXML } from "./types"

const importCommandFromXML = (context: ConfigurationContextFromXML, xml: FormCommandXML): FormCommand => {
  const properties = importMetadataItemFromXML({
    context,
    xml,
    rule: FormCommandRules,
  })

  return {
    itemType: FormCommandRules.itemType,
    name: xml._name,
    ...properties,
  }
}

export const importCommandsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands => {
  if (!xml || !xml.Command) return []

  const xmlArray = Array.isArray(xml.Command) ? xml.Command : [xml.Command]

  return xmlArray.map((commandXml) => importCommandFromXML(context, commandXml as FormCommandXML))
}

registerTypeRule("FormCommands", "importFromXML", importCommandsFromXML)
