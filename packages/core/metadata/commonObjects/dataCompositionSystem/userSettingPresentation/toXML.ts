import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"

export const exportUserSettingPresentationToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: I8nText | undefined,
  referenceMetadata?: boolean
) => {
  if (!data) return undefined
  // data может прийти булевой из reference-импорта (forReference=true), когда исходный объект
  // не содержит этого поля. В этом случае рассматриваем его как признак "использовать reference".
  if (typeof data === "boolean") {
    if (data !== true) return undefined
    if (referenceMetadata !== undefined && typeof referenceMetadata === "object") {
      data = referenceMetadata as I8nText
    } else {
      return undefined
    }
  }
  if (typeof data === "string") {
    return { "_xsi:type": "xs:string", "#text": data }
  }
  if (!("items" in (data as object))) return undefined
  const items = Object.entries((data as I8nText).items)
  if (items.length === 0) return undefined

  if (items.length > 1) {
    const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
    if (!base) return undefined
    return { "_xsi:type": "v8:LocalStringType", ...base }
  }

  const referenceIsString = typeof referenceMetadata === "string" || referenceMetadata === true
  if (referenceIsString) {
    return { "_xsi:type": "xs:string", "#text": items[0][1] }
  }

  const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
  if (!base) return undefined
  return { "_xsi:type": "v8:LocalStringType", ...base }
}

registerTypeRule("UserSettingPresentation", "exportToXML", exportUserSettingPresentationToXML as any)
