import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
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

export const exportUserVisibleToYAML = <T extends PropertyRule | undefined>(
  context: ConfigurationContext,
  rule: T,
  userVisible: UserVisible | undefined
):
  | Partial<Record<NonNullable<T>["yaml"] | NonNullable<NonNullable<T>["yamlAlt"]>, UserVisibleEnterprise>>
  | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, undefined, item.value)!
  })

  const key = userVisible.common ? rule?.yaml : rule?.yamlAlt
  if (!key) return undefined
  return {
    [key]: values,
  } as Partial<Record<NonNullable<T>["yaml"] | NonNullable<NonNullable<T>["yamlAlt"]>, UserVisibleEnterprise>>
}

registerTypeRule("UserVisible", "exportToEnterprise", exportUserVisibleToYAML)
