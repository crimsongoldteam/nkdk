import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const importCommandSetFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CommandSetEnterprise | undefined
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
