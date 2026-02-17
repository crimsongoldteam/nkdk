import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ImportFromYAMLFunctionNew, registerTypeRule, UserVisiblePropertyRule } from "~/metadata/metadataFactory"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, type UserVisible } from "./types"

/** @deprecated */
export const importUserVisibleFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  valueAllow: Record<string, StringboolEnterprise> | undefined,
  valueDeny: Record<string, StringboolEnterprise> | undefined
): UserVisible | undefined => {
  if (valueAllow === undefined && valueDeny === undefined) {
    return undefined
  }

  const common = valueAllow !== undefined

  const value = common ? valueAllow : valueDeny!

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = importBooleanFromEnterprise(context, undefined, val)
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
  value: UserVisibleEnterprise | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, rule, value: valueAllow, yaml } = params
  const userVisibleRule = rule as UserVisiblePropertyRule

  const valueDeny = yaml?.[userVisibleRule.yamlDeny] as Record<string, StringboolEnterprise> | undefined
  if (valueAllow === undefined && valueDeny === undefined) {
    return undefined
  }

  const common = valueAllow !== undefined

  const value = common ? valueAllow! : valueDeny!

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = importBooleanFromEnterprise(context, undefined, val)
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

registerTypeRule("UserVisible", "importFromEnterprise", importUserVisibleFromYAML)
