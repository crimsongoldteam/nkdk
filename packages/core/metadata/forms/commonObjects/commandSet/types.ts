import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import { Type } from "typebox"
import type { Static } from "typebox"

export interface CommandSetXML {
  ExcludedCommand: string | string[]
}

export type CommandSet = string[]

export const CommandSetJSONSchema = Type.Array(Type.String())

export type CommandSetYAML = Static<typeof CommandSetJSONSchema>

export interface CommandSetWidePropertyRule extends WidePropertyRuleBase {
  type: "CommandSet"
}

export type CommandSetRuleParams = Omit<CommandSetWidePropertyRule, "type">

export function commandSetRule<const Params extends CommandSetRuleParams>(
  params: WideExactRuleParams<CommandSetRuleParams, Params>
): Readonly<{ type: "CommandSet" } & Params> {
  return defineWidePropertyRule("CommandSet", params)
}
