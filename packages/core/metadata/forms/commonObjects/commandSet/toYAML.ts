import { PropertyRule } from "../../elements/calendarField/rules"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "@nkdk/runtime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("CommandSet", "exportToYAML", exportCommandSetToYAML)
