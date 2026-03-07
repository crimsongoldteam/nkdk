import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../../context/types"
import { CommandSet, CommandSetYAML } from "./types"

export const exportCommandSetToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandSet | undefined
): CommandSetYAML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandSetYAML = []
  for (const command of data) {
    if (command !== undefined && command !== null && command.length > 0) {
      result.push(command)
    }
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("CommandSet", "exportToYAML", exportCommandSetToYAML)
