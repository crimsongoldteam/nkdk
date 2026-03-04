import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { PropertyRule, UserVisiblePropertyRule } from "~/metadata/metadataFactory/properties/types"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleYAML, type UserVisible } from "./types"

/** @deprecated */
export const exportUserVisibleToYAMLDeprecated = <AllowKey extends string, DenyKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  userVisible: UserVisible | undefined,
  keys: { allow: AllowKey; deny: DenyKey }
): Partial<Record<AllowKey | DenyKey, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleYAML = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToYAML(context, undefined, item.value)!
  })

  const key = userVisible.common ? keys.allow : keys.deny
  return {
    [key]: values,
  } as Partial<Record<AllowKey | DenyKey, UserVisibleYAML>>
}

export const exportUserVisibleToYAML = (
  context: ConfigurationContext,
  rule: UserVisiblePropertyRule,
  userVisible: UserVisible | undefined
): Partial<Record<string, UserVisibleYAML>> | undefined => {
  if (!userVisible) return undefined
  if (!rule.yaml) throw new Error("UserVisiblePropertyRule must have yaml property")

  const values: UserVisibleYAML = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToYAML(context, undefined, item.value)!
  })

  const key = userVisible.common ? rule.yaml : rule.yamlDeny

  return {
    [key]: values,
  }
}

registerTypeRule("UserVisible", "exportToYAML", exportUserVisibleToYAML as any)
