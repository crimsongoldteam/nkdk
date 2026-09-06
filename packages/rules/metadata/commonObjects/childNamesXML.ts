import { isXmlElementNode, xmlTextValue } from "@nkdk/runtime"

/** Читает имена без XML-обёрток, сохраняя пустые позиции среди повторов. */
export function childNamesFromXML(value: unknown): unknown {
  if (isXmlElementNode(value)) return xmlTextValue(value) || undefined
  if (Array.isArray(value) && value.some(isXmlElementNode)) {
    return value.map(item => isXmlElementNode(item) ? xmlTextValue(item) || undefined : item)
  }
  return value
}
