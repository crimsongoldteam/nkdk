import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { PropertyRule, UserVisiblePropertyRule } from "~/metadata/metadataFactory/properties/types"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, type UserVisible } from "./types"

/** @deprecated */
export const exportUserVisibleToEnterprise = <AllowKey extends string, DenyKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
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
  rule: UserVisiblePropertyRule<any>,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")

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
