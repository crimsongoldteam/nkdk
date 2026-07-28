import type { ConfigurationContextFromXML } from "../context/types"
import type { MetadataItemRule } from "../orchestration/property/types"

export interface MetadataItemXmlImportAugmenter {
  augment(params: {
    context: ConfigurationContextFromXML
    rule: MetadataItemRule
    source: Record<string, unknown>
    yaml: Record<string, unknown>
  }): void
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
  const fromXML = params.context.fromXML
  if (!("metadataItemAugmenter" in fromXML) || typeof fromXML.metadataItemAugmenter !== "string") return
  const augmenter = augmenters.get(fromXML.metadataItemAugmenter)
  if (augmenter === undefined) {
    throw new Error(`Не зарегистрировано дополнение XML-import metadata-item: ${fromXML.metadataItemAugmenter}`)
  }
  augmenter.augment(params)
}
