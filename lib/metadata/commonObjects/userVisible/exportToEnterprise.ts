import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { Context } from "../../context/types"
import { UserVisibleEnterprise, UserVisibleKeysEnterprise, type UserVisible } from "./types"

export const exportUserVisibleToEnterprise = (
  context: Context,
  userVisible: UserVisible | undefined
): Partial<Record<UserVisibleKeysEnterprise, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(context, item.value)!
  })

  const key: UserVisibleKeysEnterprise = userVisible.common
    ? UserVisibleKeysEnterprise.Allow
    : UserVisibleKeysEnterprise.Deny
  return {
    [key]: values,
  }
}
