import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { MetadataItemRule } from "../property/types"

export interface MetadataItemXmlImportAugmenter {
  augment(params: {
    context: ConfigurationContextFromXML
    rule: MetadataItemRule
    source: Record<string, unknown>
    yaml: Record<string, unknown>
  }): void
}

export interface MetadataItemXmlImportAugmenterContribution {
  readonly name: string
  readonly augmenter: MetadataItemXmlImportAugmenter
}

export interface MetadataItemXmlImportAugmenterRegistry {
  apply(params: Parameters<typeof applyMetadataItemXmlImportAugmenter>[0]): void
}

export function createMetadataItemXmlImportAugmenterRegistry(
  contributions: readonly MetadataItemXmlImportAugmenterContribution[],
): MetadataItemXmlImportAugmenterRegistry {
  const instanceAugmenters = new Map<string, MetadataItemXmlImportAugmenter>()
  for (const { name, augmenter } of contributions) {
    if (instanceAugmenters.has(name)) throw new Error(`Дополнение XML-import metadata-item уже зарегистрировано: ${name}`)
    instanceAugmenters.set(name, augmenter)
  }
  return { apply: (params) => applyFromRegistry(instanceAugmenters, params) }
}

const augmenters = new Map<string, MetadataItemXmlImportAugmenter>()

export function registerMetadataItemXmlImportAugmenter(
  name: string,
  augmenter: MetadataItemXmlImportAugmenter
): void {
  if (augmenters.has(name)) throw new Error(`Дополнение XML-import metadata-item уже зарегистрировано: ${name}`)
  augmenters.set(name, augmenter)
}

export function applyMetadataItemXmlImportAugmenter(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  source: Record<string, unknown>
  yaml: Record<string, unknown>
}): void {
  applyFromRegistry(augmenters, params)
}

function applyFromRegistry(
  registry: ReadonlyMap<string, MetadataItemXmlImportAugmenter>,
  params: Parameters<typeof applyMetadataItemXmlImportAugmenter>[0],
): void {
  const fromXML = params.context.fromXML
  if (!("metadataItemAugmenter" in fromXML) || typeof fromXML.metadataItemAugmenter !== "string") return
  const augmenter = registry.get(fromXML.metadataItemAugmenter)
  if (augmenter === undefined) {
    throw new Error(`Не зарегистрировано дополнение XML-import metadata-item: ${fromXML.metadataItemAugmenter}`)
  }
  augmenter.augment(params)
}
