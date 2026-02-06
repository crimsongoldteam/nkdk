import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { PropertyRule, UserVisiblePropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, type UserVisible } from "./types"

/** @deprecated */
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

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, undefined, item.value)!
  })

  const key = userVisible.common ? rule.yaml : rule.yamlDeny

  return {
    [key]: values,
  }
}

registerTypeRule("UserVisible", "exportToEnterprise", exportUserVisibleToYAML as any)
