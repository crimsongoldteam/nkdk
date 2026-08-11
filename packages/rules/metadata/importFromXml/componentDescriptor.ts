import type { MetadataImportComponentDescriptor } from "@nkdk/runtime/rule-kit"

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

const descriptorsByKind = new Map<string, XmlImportComponentDescriptor>()

export function registerXmlImportComponentDescriptor(descriptor: XmlImportComponentDescriptor): void {
  if (descriptorsByKind.has(descriptor.kind)) {
    throw new Error(`Вид XML-компонента уже зарегистрирован: ${descriptor.kind}`)
  }
  descriptorsByKind.set(descriptor.kind, descriptor)
}

export function resolveXmlImportComponent(root: Record<string, unknown>): XmlImportComponentDescriptor {
  const matches = [...descriptorsByKind.values()].filter((descriptor) => descriptor.detect(root))
  if (matches.length === 0) throw new Error("Не найдено описание XML-компонента")
  if (matches.length > 1) {
    throw new Error(`Несколько описаний XML-компонента распознали корень: ${matches.map(({ kind }) => kind).join(", ")}`)
  }
  return matches[0] as XmlImportComponentDescriptor
}

export function getRegisteredXmlImportComponentDescriptor(kind: string): XmlImportComponentDescriptor {
  const descriptor = descriptorsByKind.get(kind)
  if (descriptor === undefined) throw new Error(`Не найдено описание XML-компонента: ${kind}`)
  return descriptor
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
