import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import type { ComponentAddress } from "../components/address"
import type { MetadataItemRule } from "../orchestration/property/types"

export interface XmlImportComponentDescriptor {
  readonly kind: string
  readonly rootRule: MetadataItemRule
  detect(root: Record<string, unknown>): boolean
  resolveAddress(root: Record<string, unknown>): ComponentAddress
  readonly baseAddress?: ComponentAddress
  readonly metadataItemAugmenter?: string
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

registerXmlImportComponentDescriptor({
  kind: "configuration",
  rootRule: MetadataConfigurationRules,
  detect(root) {
    const configuration = root["Configuration"]
    if (!isRecord(configuration)) return false
    const properties = configuration["Properties"]
    return !isRecord(properties) || !("ConfigurationExtensionPurpose" in properties)
  },
  resolveAddress: () => ({ kind: "configuration" }),
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
