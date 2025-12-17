import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { ConfigurationSettings } from "../../configurationSettings/types"
import { UserVisibleEnterprise, UserVisibleKeysEnterprise, type UserVisible } from "./types"

export const exportUserVisibleToEnterprise = (
  userVisible: UserVisible | undefined,
  configurationSettings: ConfigurationSettings
): Partial<Record<UserVisibleKeysEnterprise, UserVisibleEnterprise>> | undefined => {
  if (!userVisible) return undefined

  const values: UserVisibleEnterprise = {}
  userVisible.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(item.value, configurationSettings)!
  })

  const key: UserVisibleKeysEnterprise = userVisible.common
    ? UserVisibleKeysEnterprise.Allow
    : UserVisibleKeysEnterprise.Deny
  return {
    [key]: values,
  }
}
