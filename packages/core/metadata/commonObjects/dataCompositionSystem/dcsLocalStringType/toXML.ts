import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { DcsLocalStringTypeReference } from "./types"

const exportAsLocalString = (context: ConfigurationContext, data: I8nText) => {
  const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
  if (!base) return undefined
  return { "_xsi:type": "v8:LocalStringType", ...base }
}

export const exportDcsLocalStringTypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: I8nText | string | undefined,
  referenceMetadata?: DcsLocalStringTypeReference
) => {
  if (!data) return undefined

  if (typeof data === "string") {
    return { "_xsi:type": "xs:string", "#text": data }
  }

  if (!("items" in (data as object))) return undefined
  const items = Object.entries(data.items)
  if (items.length === 0) return undefined

  if (items.length > 1) {
    return exportAsLocalString(context, data)
  }

  if (typeof referenceMetadata === "string") {
    return { "_xsi:type": "xs:string", "#text": items[0][1] }
  }

  return exportAsLocalString(context, data)
}

registerTypeRule("DcsLocalStringType", "exportToXML", exportDcsLocalStringTypeToXML as any)
