import { isXmlElementNode, xmlTextValue } from "@nkdk/runtime"

export function readSystemEnumerationXMLText(value: unknown): string | undefined {
  if (isXmlElementNode(value)) return xmlTextValue(value) || undefined
  const raw = value !== null && typeof value === "object"
    ? "#text" in value ? value["#text"] : undefined
    : value
  return typeof raw === "string" ? raw : undefined
}
