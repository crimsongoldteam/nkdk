import { isXmlElementNode, parseXmlDocumentWithSaxes, xmlElementChildren, xmlExport, type XmlElementNode } from "@nkdk/runtime"
import { readXMLFileAsString } from "./readAndParseXMLFile"
import { testFixturesDir } from "./testFixturesDir"

/** Строит исходный XML для тестов с программно заданными значениями. */
export function xmlElementFromTestValue(name: string, value: unknown): XmlElementNode {
  if (isXmlElementNode(value)) return value
  const root = parseXmlDocumentWithSaxes(xmlExport({ [name]: value })).roots[0]
  if (root === undefined) throw new Error("Тестовое значение должно создавать XML-элемент")
  return root
}

/** Выбирает исходные корни свойства, не создавая объектную копию XML. */
export function readPropertyXML(params: {
  readonly xmlString?: string
  readonly path?: string
  readonly importMetaUrl?: string
  readonly xmlRootTag?: string
}): XmlElementNode | readonly XmlElementNode[] | undefined {
  if (params.xmlString === undefined && params.path === undefined) throw new Error("Не задан тестовый XML")
  const xml = params.xmlString ?? readXMLFileAsString(
    params.path!, params.importMetaUrl === undefined ? undefined : testFixturesDir(params.importMetaUrl),
  )
  const document = parseXmlDocumentWithSaxes(xml)
  const roots = params.xmlRootTag === undefined ? document.roots : document.roots.filter(node => node.name === params.xmlRootTag)
  return roots.length === 1 ? roots[0] : roots.length === 0 ? undefined : roots
}

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
