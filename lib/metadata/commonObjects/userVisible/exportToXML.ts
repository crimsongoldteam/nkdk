import { TUserVisible, TUserVisibleXML } from "./types"

export const exportUserVisibleToXML = (
  userVisible: TUserVisible | undefined
): TUserVisibleXML | undefined => {
  if (!userVisible) return undefined

  const result: TUserVisibleXML = {
    Common: userVisible.common,
    Value:
      userVisible.values.length > 0
        ? {
            Item: userVisible.values.map((item) => ({
              _name: `Role.${item.name}`,
              "#text": item.value,
            })),
          }
        : undefined, // empty object will be exported as <Value />
  }

  return result
}
