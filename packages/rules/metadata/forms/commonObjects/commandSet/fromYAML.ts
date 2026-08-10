import { PropertyRule } from "../../elements/calendarField/rules"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { ConfigurationContext } from "@nkdk/runtime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("CommandSet", "importFromYAML", importCommandSetFromYAML)
