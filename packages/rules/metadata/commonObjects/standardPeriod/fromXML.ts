import { StandardPeriod, StandardPeriodXML } from "./types"
import { isXmlElementNode, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"

const getText = (value: { "#text"?: string } | string | undefined): string | undefined => {
  if (typeof value === "string") return value
  return value?.["#text"]
}

export const importStandardPeriodFromXML = (data: StandardPeriodXML | XmlElementNode | undefined): StandardPeriod | undefined => {
  if (data === undefined) return undefined

  const readText = (name: keyof StandardPeriodXML): string | undefined => {
    if (!isXmlElementNode(data)) return getText(data[name])
    const child = xmlElementChildren(data, name)[0]
    if (child === undefined) return undefined
    if (child.content.length === 0 && child.attributes.length === 0) return ""
    return child.content.some(node => node.type === "text") ? xmlTextValue(child) : undefined
  }
  const variant = readText("v8:variant")
  if (variant === undefined) return undefined

  const result: StandardPeriod = { variant: variant as StandardPeriod["variant"] }
  const startDate = readText("v8:startDate")
  const endDate = readText("v8:endDate")

  if (startDate !== undefined) result.startDate = startDate
  if (endDate !== undefined) result.endDate = endDate

  return result
}
