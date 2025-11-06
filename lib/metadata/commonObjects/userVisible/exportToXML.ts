import { TUserVisible, TUserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  userVisible: TUserVisible | undefined
): TUserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: TUserVisibleXML = {
    "xr:Common": userVisible.common,
    "xr:Value":
      userVisible.values.length > 0
        ? userVisible.values.map((item) => ({
            _name: `Role.${item.name}`,
            "#text": item.value,
          }))
        : undefined,
  }

  return result
}
