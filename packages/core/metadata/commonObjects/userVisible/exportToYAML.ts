import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/exportToYAML"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, type UserVisible } from "./types"

export const exportUserVisibleToYAML = <AllowKey extends string, DenyKey extends string>(
  context: ConfigurationContext,
  _rule: PropertyRule,
  userVisible: UserVisible | undefined,
  keys: { allow: AllowKey; deny: DenyKey }
): Partial<Record<AllowKey | DenyKey, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToYAML(context, _rule, item.value)!
  })

  const key = userVisible.common ? keys.allow : keys.deny
  return {
    [key]: values,
  } as Partial<Record<AllowKey | DenyKey, UserVisibleEnterprise>>
}
