import { xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { readBooleanXML } from "../../commonObjects/boolean/xmlValue"

/** Поля одного app-значения: только непосредственные дети, без копии XML. */
export function applicationXMLValue(node: XmlElementNode) {
  const fields = new Map<string, XmlElementNode>()
  for (const child of xmlElementChildren(node)) {
    if (!fields.has(child.name)) fields.set(child.name, child)
  }
  return {
    text(name: string): string {
      const child = fields.get(`app:${name}`)
      return child === undefined ? "" : xmlTextValue(child)
    },
    boolean(name: string): boolean {
      return readBooleanXML(fields.get(`app:${name}`)) ?? false
    },
  }
}
