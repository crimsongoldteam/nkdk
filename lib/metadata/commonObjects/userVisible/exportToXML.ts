import { TUserVisible, TUserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  userVisible: TUserVisible | undefined
): TUserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: TUserVisibleXML = []

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
