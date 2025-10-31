import { TUse, TUseXML } from "./types"

export default function importUseFromXML(xml: TUseXML | undefined): TUse | undefined {
  if (!xml) return undefined

  const result: TUse = {
    common: xml.Common,
    values: xml.Value.map((item) => ({
      name: item._name.replace(/^Role\./, ""),
      value: item.value,
    })),
  }

  return result
}
