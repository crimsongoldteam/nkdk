import { parseXmlDocumentWithSaxes, xmlElementsAtUniquePath, xmlTextValue } from "@nkdk/runtime"

/** Имена страниц, не содержимое HTML; повторы и исходный порядок сохраняются. */
export function readHelpPageLanguages(xml: string): string[] {
  return xmlElementsAtUniquePath(parseXmlDocumentWithSaxes(xml).roots, ["Help", "Page"])
    .filter(node => node.attributes.length === 0 && node.content.length > 0 && node.content.every(child => child.type === "text"))
    .map(xmlTextValue)
}
