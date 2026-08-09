import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "./types"

export interface MetadataItemYamlToXmlAugmenter {
  augment(params: {
    readonly context: ConfigurationContextWithExportToXML
    readonly rule: MetadataItemRule
    readonly yaml: Readonly<Record<string, unknown>>
    readonly outputs: ReadonlyMap<string, Record<string, unknown>>
    readonly logicalAddress: string
  }): void
}

const augmenters = new Map<string, MetadataItemYamlToXmlAugmenter>()

export function registerMetadataItemYamlToXmlAugmenter(
  componentKind: string,
  augmenter: MetadataItemYamlToXmlAugmenter
): void {
  if (augmenters.has(componentKind)) {
    throw new Error(
      `Дополнение YAML-to-XML metadata-item уже зарегистрировано: ${componentKind}`
    )
  }
  augmenters.set(componentKind, augmenter)
}

export function augmentMetadataItemYamlToXml(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly rule: MetadataItemRule
  readonly yaml: Readonly<Record<string, unknown>>
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
}): void {
  const componentKind = params.context.exportToXML.componentKind
  const logicalAddress =
    params.context.exportToXML.configurationIndex?.logicalAddress
  if (componentKind === undefined || logicalAddress === undefined) return
  augmenters.get(componentKind)?.augment({ ...params, logicalAddress })
}
