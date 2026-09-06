import { parseXmlDocumentWithSaxes, xmlElementChildren, type XmlElementNode } from "@nkdk/runtime"

/** Запрещает тестируемому преобразователю читать старое представление любого узла. */
export function parseStructuralXMLWithoutCompatibility(xml: string): XmlElementNode {
  const root = parseXmlDocumentWithSaxes(xml).roots[0]
  if (root === undefined) throw new Error("Тестовый XML должен содержать корневой элемент")
  const nodes = [root]
  for (const node of nodes) {
    nodes.push(...xmlElementChildren(node))
    Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
  }
  return root
}
