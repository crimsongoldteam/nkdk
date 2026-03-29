import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { importMetadataItemFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommands, FormCommandsYAML, FormCommandYAML } from "./types"

export const importCommandsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormCommandsYAML | undefined
): FormCommands => {
  if (!data) return []

  return Object.entries(data)
    .map(([name, value]) => importCommandFromYAML(context, value, name))
    .filter((cmd): cmd is FormCommand => cmd !== undefined)
}

const importCommandFromYAML = (
  context: ConfigurationContext,
  yaml: FormCommandYAML | undefined,
  name: string
): FormCommand | undefined => {
  if (!yaml) return undefined

  const properties = importMetadataItemFromYAML({
    context,
    yaml,
    rule: FormCommandRules,
    name,
  })

  if (properties == undefined) return undefined

  return {
    ...properties,
    name,
  }
}

registerTypeRule("FormCommands", "importFromYAML", importCommandsFromYAML)
