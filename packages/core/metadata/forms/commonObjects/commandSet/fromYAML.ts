import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../../context/types"
import { CommandSet, CommandSetYAML } from "./types"

export const importCommandSetFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandSetYAML | undefined
): CommandSet | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandSet = []
  for (const command of data) {
    if (command !== undefined && command !== null && command.length > 0) {
      result.push(command)
    }
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("CommandSet", "importFromYAML", importCommandSetFromYAML)
