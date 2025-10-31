import { importI8nTextFromXML } from "~/lib/metadata/i8nText/importI8nTextFromXML"
import { TChoiceList } from "./types"

export const importChoiceListFromXML = (xml: any | undefined): TChoiceList | undefined => {
  if (!xml) return undefined

  const rawItems = (xml["xr:Item"] ?? xml.Item ?? []) as any[]
  const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems]

  const items = itemsArray.map((item) => {
    const checkStateRaw = item["xr:CheckState"] ?? item.CheckState
    const valueNode = item["xr:Value"] ?? item.Value
    const i18n = importI8nTextFromXML(valueNode?.Presentation)

    const presentation = i18n?.ru ?? (i18n ? Object.values(i18n)[0] : "") ?? ""
    const value = valueNode && typeof valueNode.Value === "string" ? valueNode.Value : ""

    return {
      presentation,
      checkState: typeof checkStateRaw === "number" ? checkStateRaw : Number(checkStateRaw ?? 0),
      value,
    }
  })

  return { items }
}
