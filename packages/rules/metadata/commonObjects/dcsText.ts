import { isXmlElementNode, xmlTextValue } from "@nkdk/runtime"

/** Читает смысловой текст СКД, не создавая промежуточный XML-объект. */
export function readDcsText(value: unknown, missingMessage: string, invalidMessage: string): string {
  if (value === undefined) throw new Error(missingMessage)
  if (typeof value === "string") return value
  if (isXmlElementNode(value)) {
    const text = xmlTextValue(value)
    if (text !== "") return text
    if (value.attributes.length === 0 && !value.content.some(node => node.type === "element")) throw new Error(missingMessage)
  } else if (value !== null && typeof value === "object" && "#text" in value && typeof value["#text"] === "string") {
    return value["#text"]
  }
  throw new Error(invalidMessage)
}
