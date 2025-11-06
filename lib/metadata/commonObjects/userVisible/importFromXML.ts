import { TUserVisible, TUserVisibleXML } from "./types"

export default function importUseFromXML(
  xml: TUserVisibleXML | undefined
): TUserVisible | undefined {
  if (!xml) return undefined

  const result: TUserVisible = {
    common: xml.Common,
    values: xml.Value.map((item) => ({
      name: item._name.replace(/^Role\./, ""),
      value: item.value,
    })),
  }

  return result
}
