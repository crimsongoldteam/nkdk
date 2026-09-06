import { isXmlElementNode, xmlAttributeValue, xmlTextValue } from "@nkdk/runtime"

const typedDecimalXsi = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

export function readNumberXML(value: unknown): number | undefined {
  if (isXmlElementNode(value)) {
    const text = xmlTextValue(value)
    if (text !== "") return Number(text)
    const xsiType = xmlAttributeValue(value, "xsi:type")
    if (xsiType !== undefined && typedDecimalXsi.has(xsiType)
      || value.attributes.length === 0 && value.content.every(node => node.type === "text")) return undefined
    return Number.NaN
  }
  if (value !== null && typeof value === "object" && "_xsi:type" in value
    && typeof value["_xsi:type"] === "string" && typedDecimalXsi.has(value["_xsi:type"])) {
    const text = "#text" in value ? value["#text"] : undefined
    if (text === undefined || text === "") return undefined
    return typeof text === "number" ? text : Number(text)
  }
  const raw = value !== null && typeof value === "object" && "#text" in value ? value["#text"] : value
  return raw === undefined || raw === "" ? undefined : typeof raw === "number" ? raw : Number(raw)
}
