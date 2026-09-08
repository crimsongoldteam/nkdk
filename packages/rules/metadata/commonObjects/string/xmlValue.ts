import { isXmlElementNode, xmlTextValue } from "@nkdk/runtime"

export function readStringXML(value: unknown): string | undefined {
  if (isXmlElementNode(value)) return xmlTextValue(value) || undefined
  if (value === undefined) return undefined
  if (value !== null && typeof value === "object") {
    const text = "#text" in value ? value["#text"] : undefined
    return text === undefined ? undefined : String(text)
  }
  return String(value)
}
