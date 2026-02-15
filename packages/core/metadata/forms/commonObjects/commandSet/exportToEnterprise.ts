import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../../context/types"
import { CommandSet, CommandSetEnterprise } from "./types"

export const exportCommandSetToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: CommandSet | undefined
): CommandSetEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  const result: CommandSetEnterprise = []
  for (const command of data) {
    if (command !== undefined && command !== null && command.length > 0) {
      result.push(command)
    }
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("CommandSet", "exportToEnterprise", exportCommandSetToEnterprise)
