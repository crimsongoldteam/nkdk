import { ConfigurationSettings } from "../../configurationSettings/types"
import { UserVisible, UserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  _configurationSettings: ConfigurationSettings,
  userVisible: UserVisible | undefined
): UserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: UserVisibleXML = []

  result.push({
    "xr:Common": userVisible.common,
  })

  for (const item of userVisible.values) {
    result.push({
      "xr:Value": {
        _name: `Role.${item.name}`,
        "#text": item.value,
      },
    })
  }

  return result
}
