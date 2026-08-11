import type { MetadataImportComponentDescriptor } from "@nkdk/runtime/rule-kit"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"

export type XmlImportComponentDescriptor = MetadataImportComponentDescriptor

export function resolveXmlImportRootItemName(root: Readonly<Record<string, unknown>>): string {
  const configuration = root["Configuration"]
  const properties = isRecord(configuration) ? configuration["Properties"] : undefined
  const name = isRecord(properties) ? properties["Name"] : undefined
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

export function resolveXmlImportComponent(root: Record<string, unknown>): XmlImportComponentDescriptor {
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
      resolve(input: Readonly<Record<string, unknown>>): XmlImportComponentDescriptor
      get(kind: string): XmlImportComponentDescriptor
    }
  }>()?.imports
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
