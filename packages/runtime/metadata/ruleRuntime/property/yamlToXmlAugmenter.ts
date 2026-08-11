import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "./types"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export interface MetadataItemYamlToXmlAugmenter {
  augment(params: {
    readonly context: ConfigurationContextWithExportToXML
    readonly rule: MetadataItemRule
    readonly yaml: Readonly<Record<string, unknown>>
    readonly outputs: ReadonlyMap<string, Record<string, unknown>>
    readonly logicalAddress: string
  }): void
}

export interface MetadataItemYamlToXmlAugmenterContribution {
  readonly componentKind: string
  readonly augmenter: MetadataItemYamlToXmlAugmenter
}

export interface MetadataItemYamlToXmlAugmenterRegistry {
  augment(params: Parameters<typeof augmentMetadataItemYamlToXml>[0]): void
}

export function createMetadataItemYamlToXmlAugmenterRegistry(
  contributions: readonly MetadataItemYamlToXmlAugmenterContribution[],
): MetadataItemYamlToXmlAugmenterRegistry {
  const instanceAugmenters = new Map<string, MetadataItemYamlToXmlAugmenter>()
  for (const { componentKind, augmenter } of contributions) {
    if (instanceAugmenters.has(componentKind)) {
      throw new Error(`Дополнение YAML-to-XML metadata-item уже зарегистрировано: ${componentKind}`)
    }
    instanceAugmenters.set(componentKind, augmenter)
  }
  return { augment: (params) => augmentFromRegistry(instanceAugmenters, params) }
}

export function registerMetadataItemYamlToXmlAugmenter(
  componentKind: string,
  augmenter: MetadataItemYamlToXmlAugmenter
): void {
  const registry = currentPropertyRuleRegistrySet<{
    registerMetadataItemYamlToXmlAugmenter(kind: string, value: MetadataItemYamlToXmlAugmenter): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerMetadataItemYamlToXmlAugmenter(componentKind, augmenter)
}

export function augmentMetadataItemYamlToXml(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly rule: MetadataItemRule
  readonly yaml: Readonly<Record<string, unknown>>
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
}): void {
  const registry = currentPropertyRuleRegistrySet<{
    augmentMetadataItemYamlToXml(value: typeof params): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.augmentMetadataItemYamlToXml(params)
}

function augmentFromRegistry(
  registry: ReadonlyMap<string, MetadataItemYamlToXmlAugmenter>,
  params: Parameters<typeof augmentMetadataItemYamlToXml>[0],
): void {
  const componentKind = params.context.exportToXML.componentKind
  const logicalAddress =
    params.context.exportToXML.configurationIndex?.logicalAddress
  if (componentKind === undefined || logicalAddress === undefined) return
  registry.get(componentKind)?.augment({ ...params, logicalAddress })
}
