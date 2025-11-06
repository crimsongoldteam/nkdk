import { TUserVisible, TUserVisibleXML } from "./types"

export default function exportUserVisibleToXML(
  userVisible: TUserVisible | undefined
): TUserVisibleXML | undefined {
  if (!userVisible) return undefined

  const result: TUserVisibleXML = {
    Common: userVisible.common,
    Value: userVisible.values.map((item) => ({
      _name: `Role.${item.name}`,
      "#text": item.value,
    })),
  }

  return result
}
