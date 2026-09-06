import { isXmlElementNode, xmlTextValue } from "@nkdk/runtime"

export function readBooleanXML(value: unknown): boolean | undefined {
  const raw = isXmlElementNode(value) ? xmlTextValue(value)
    : value !== null && typeof value === "object" && "#text" in value ? value["#text"] : value
  return raw === "true" || raw === true ? true : raw === "false" || raw === false ? false : undefined
}
