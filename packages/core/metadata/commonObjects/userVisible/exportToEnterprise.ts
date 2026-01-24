import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleEnterprise, UserVisibleKeysEnterprise, type UserVisible } from "./types"

export const exportUserVisibleToEnterprise = (
  context: ConfigurationContext,
  userVisible: UserVisible | undefined,
  keys?: { allow: UserVisibleKeysEnterprise; deny: UserVisibleKeysEnterprise }
): Partial<Record<UserVisibleKeysEnterprise, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, item.value)!
  })

  const allowKey = keys?.allow ?? UserVisibleKeysEnterprise.Allow
  const denyKey = keys?.deny ?? UserVisibleKeysEnterprise.Deny

  const key: UserVisibleKeysEnterprise = userVisible.common ? allowKey : denyKey
  return {
    [key]: values,
  }
}
