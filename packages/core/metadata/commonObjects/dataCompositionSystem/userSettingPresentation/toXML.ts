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
  const items = Object.entries(data.items)
  if (items.length === 0) return undefined

  if (items.length > 1) {
    const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
    if (!base) return undefined
    return { "_xsi:type": "v8:LocalStringType", ...base }
  }

  if (referenceMetadata === true) {
    return { "_xsi:type": "xs:string", "#text": items[0][1] }
  }

  const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
  if (!base) return undefined
  return { "_xsi:type": "v8:LocalStringType", ...base }
}

registerTypeRule("UserSettingPresentation", "exportToXML", exportUserSettingPresentationToXML as any)
