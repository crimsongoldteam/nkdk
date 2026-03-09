import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportPropertiesToYAML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommands, FormCommandsYAML } from "./types"

export const exportCommandsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormCommands | undefined
): FormCommandsYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return Object.fromEntries(
    data.map((command) => [
      command.name,
      exportPropertiesToYAML({ context, data: command, rule: FormCommandRules }) ?? {},
    ])
  )
}

registerTypeRule("FormCommands", "exportToYAML", exportCommandsToYAML)
