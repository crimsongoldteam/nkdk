import type { MetadataImportComponentDescriptor } from "@nkdk/runtime/rule-kit"
import { xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"

export type XmlImportComponentDescriptor = MetadataImportComponentDescriptor

export function resolveXmlImportRootItemName(root: XmlElementNode): string {
  let nodes = [root]
  for (const segment of ["Configuration", "Properties", "Name"]) {
    nodes = nodes.flatMap(node => xmlElementChildren(node, segment))
    if (nodes.length !== 1) throw new Error("Не задано имя корневого объекта XML-компонента")
  }
  const nameNode = nodes[0]!
  if (nameNode.attributes.length > 0 || nameNode.content.some(child => child.type !== "text")) {
    throw new Error("Не задано имя корневого объекта XML-компонента")
  }
  const name = xmlTextValue(nameNode)
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("Не задано имя корневого объекта XML-компонента")
  }
  return name
}

export function registerXmlImportComponentDescriptor(descriptor: XmlImportComponentDescriptor): void {
  const imports = contextualImports()
  if (imports === undefined) throw new Error("Не задан execution context import descriptors")
  imports.register(descriptor)
}

export function resolveXmlImportComponent(root: XmlElementNode): XmlImportComponentDescriptor {
  const contextual = contextualImports()
  if (contextual === undefined) throw new Error("Не задан execution context import descriptors")
  return contextual.resolve(root)
}

export function getRegisteredXmlImportComponentDescriptor(kind: string): XmlImportComponentDescriptor {
  const contextual = contextualImports()
  if (contextual === undefined) throw new Error("Не задан execution context import descriptors")
  return contextual.get(kind)
}

function contextualImports() {
  return currentOperationRegistrySet<{
    imports: {
      register(descriptor: XmlImportComponentDescriptor): void
      resolve(input: XmlElementNode): XmlImportComponentDescriptor
      get(kind: string): XmlImportComponentDescriptor
    }
  }>()?.imports
}
