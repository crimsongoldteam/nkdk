import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importPropertiesFromXML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommands, FormCommandsXML, FormCommandXML } from "./types"

const importCommandFromXML = (context: ConfigurationContext, xml: FormCommandXML): FormCommand => {
  const properties = importPropertiesFromXML({
    context,
    xml,
    rule: FormCommandRules,
  })

  return {
    itemType: "FormCommand",
    name: xml._name,
    ...properties,
  }
}

export const importCommandsFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands => {
  if (!xml || !xml.Command) return []

  const xmlArray = Array.isArray(xml.Command) ? xml.Command : [xml.Command]

  return xmlArray.map((commandXml) => importCommandFromXML(context, commandXml as FormCommandXML))
}

registerTypeRule("FormCommands", "importFromXML", importCommandsFromXML)
