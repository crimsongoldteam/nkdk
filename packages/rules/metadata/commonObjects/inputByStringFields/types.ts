import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { TypeRulesOperations } from "@nkdk/runtime/rule-kit"
import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../ruleBuilder"
import {
  inputByStringDefaultYAML,
  type InputByStringStandardField,
} from "./defaultValue"

export type { InputByStringStandardField } from "./defaultValue"

export interface InputByStringFieldsWidePropertyRule extends WidePropertyRuleBase {
  type: "InputByStringFields"
  standardFields: readonly InputByStringStandardField[]
}

type InputByStringFieldsRuleParams = Omit<
  InputByStringFieldsWidePropertyRule,
  "type" | "evaluateWhenYAMLMissing" | "implicitValueYAML"
>

interface InputByStringDefaultValueParams {
  context: ConfigurationContext
  name?: string
  operation: TypeRulesOperations
  yaml?: unknown
}

export function inputByStringFieldsRule<const Params extends InputByStringFieldsRuleParams>(
  params: WideExactRuleParams<InputByStringFieldsRuleParams, Params>
): Readonly<{
  type: "InputByStringFields"
  evaluateWhenYAMLMissing: true
  implicitValueYAML: (params: InputByStringDefaultValueParams) => string[]
} & Params> {
  const rule = defineWidePropertyRule("InputByStringFields", {
    ...params,
    evaluateWhenYAMLMissing: true as const,
  })

  return {
    ...rule,
    implicitValueYAML: ({ yaml }: InputByStringDefaultValueParams) =>
      inputByStringDefaultYAML({ ...rule, standardFields: params.standardFields }, yaml),
  }
}
