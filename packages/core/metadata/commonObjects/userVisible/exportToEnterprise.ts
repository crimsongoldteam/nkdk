import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { PropertyRule, UserVisiblePropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, type UserVisible } from "./types"

export const exportUserVisibleToEnterprise = <AllowKey extends string, DenyKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined,
  keys: { allow: AllowKey; deny: DenyKey }
): Partial<Record<AllowKey | DenyKey, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, undefined, item.value)!
  })

  const key = userVisible.common ? keys.allow : keys.deny
  return {
    [key]: values,
  } as Partial<Record<AllowKey | DenyKey, UserVisibleEnterprise>>
}

const isUserVisiblePropertyRule = (rule: PropertyRule | undefined): rule is UserVisiblePropertyRule => {
  return rule !== undefined && "yamlAlt" in rule
}

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, undefined, item.value)!
  })

  if (!isUserVisiblePropertyRule(rule)) return undefined
  const key = userVisible.common ? rule.yaml : rule.yamlDeny
  if (!key) return undefined
  return {
    [key]: values,
  }
}

registerTypeRule("UserVisible", "exportToEnterprise", exportUserVisibleToYAML)
