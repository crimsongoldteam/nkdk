import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ImportFromYAMLFunctionNew, UserVisiblePropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleYAML, type UserVisible } from "./types"

/** @deprecated */
export const importUserVisibleFromYAMLDeprecated = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  valueAllow: Record<string, StringboolYAML> | undefined,
  valueDeny: Record<string, StringboolYAML> | undefined
): UserVisible | undefined => {
  if (valueAllow === undefined && valueDeny === undefined) {
    return undefined
  }

  const common = valueAllow !== undefined

  const value = common ? valueAllow : valueDeny!

  const values = Object.entries(value).map(([key, val]) => {
    const name = key
    const parsedValue = importBooleanFromYAML(context, undefined, val)
    return {
      name,
      value: parsedValue!,
    }
  })

  return {
    common,
    values,
  }
}

export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, rule, value: valueAllow, yaml } = params
  const userVisibleRule = rule as UserVisiblePropertyRule

  const valueDeny = yaml?.[userVisibleRule.yamlDeny] as Record<string, StringboolYAML> | undefined
  if (valueAllow === undefined && valueDeny === undefined) {
    return undefined
  }

  const common = valueAllow !== undefined

  const value = common ? valueAllow! : valueDeny!

  const values = Object.entries(value).map(([key, val]) => {
    const name = key
    const parsedValue = importBooleanFromYAML(context, undefined, val)
    return {
      name,
      value: parsedValue!,
    }
  })

  return {
    common,
    values,
  }
}

registerTypeRule("UserVisible", "importFromYAML", importUserVisibleFromYAML)
