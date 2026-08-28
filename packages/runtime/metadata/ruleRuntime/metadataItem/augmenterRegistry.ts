import type { ConfigurationContextFromXML, XMLImportObjectVariant } from "../../context/types"
import type { MetadataItemRule } from "../property/types"
import { currentPropertyRuleRegistrySet } from "../property/propertyRuleExecutionContext"

export interface MetadataItemXmlImportAugmenter {
  resolveCurrentXMLDefaultVariant?(params: MetadataItemXmlImportVariantParams): XMLImportObjectVariant | undefined
  augment(params: MetadataItemXmlImportAugmentParams): void
}

export interface MetadataItemXmlImportVariantParams {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  source: Record<string, unknown>
}

export interface MetadataItemXmlImportAugmentParams extends MetadataItemXmlImportVariantParams {
  yaml: Record<string, unknown>
}

export interface MetadataItemXmlImportAugmenterContribution {
  readonly name: string
  readonly augmenter: MetadataItemXmlImportAugmenter
}

export interface MetadataItemXmlImportAugmenterRegistry {
  apply(params: Parameters<typeof applyMetadataItemXmlImportAugmenter>[0]): void
  resolveCurrentXMLDefaultVariant(
    params: MetadataItemXmlImportVariantParams,
  ): XMLImportObjectVariant | undefined
}

export function createMetadataItemXmlImportAugmenterRegistry(
  contributions: readonly MetadataItemXmlImportAugmenterContribution[],
): MetadataItemXmlImportAugmenterRegistry {
  const instanceAugmenters = new Map<string, MetadataItemXmlImportAugmenter>()
  for (const { name, augmenter } of contributions) {
    if (instanceAugmenters.has(name)) throw new Error(`Дополнение XML-import metadata-item уже зарегистрировано: ${name}`)
    instanceAugmenters.set(name, augmenter)
  }
  return {
    apply: (params) => applyFromRegistry(instanceAugmenters, params),
    resolveCurrentXMLDefaultVariant: (params) => resolveFromRegistry(instanceAugmenters, params),
  }
}

export function registerMetadataItemXmlImportAugmenter(
  name: string,
  augmenter: MetadataItemXmlImportAugmenter
): void {
  const registry = currentPropertyRuleRegistrySet<{
    registerMetadataItemXmlImportAugmenter(name: string, value: MetadataItemXmlImportAugmenter): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.registerMetadataItemXmlImportAugmenter(name, augmenter)
}

export function applyMetadataItemXmlImportAugmenter(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  source: Record<string, unknown>
  yaml: Record<string, unknown>
}): void {
  const registry = currentPropertyRuleRegistrySet<{
    applyMetadataItemXmlImportAugmenter(value: typeof params): void
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  registry.applyMetadataItemXmlImportAugmenter(params)
}

export function resolveMetadataItemXMLDefaultVariant(
  params: MetadataItemXmlImportVariantParams,
): XMLImportObjectVariant | undefined {
  const registry = currentPropertyRuleRegistrySet<{
    resolveMetadataItemXMLDefaultVariant(
      value: MetadataItemXmlImportVariantParams,
    ): XMLImportObjectVariant | undefined
  }>()
  if (registry === undefined) throw new Error("Не задан execution context property rules")
  return registry.resolveMetadataItemXMLDefaultVariant(params)
}

export function withResolvedXMLImportObjectVariant(
  context: ConfigurationContextFromXML,
  resolved: XMLImportObjectVariant | undefined,
): ConfigurationContextFromXML {
  return {
    ...context,
    fromXML: {
      ...context.fromXML,
      currentXMLDefaultVariant:
        resolved ?? context.fromXML.currentXMLDefaultVariant ?? "full",
    },
  }
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

function resolveFromRegistry(
  registry: ReadonlyMap<string, MetadataItemXmlImportAugmenter>,
  params: MetadataItemXmlImportVariantParams,
): XMLImportObjectVariant | undefined {
  const augmenter = selectedAugmenter(registry, params.context)
  return augmenter?.resolveCurrentXMLDefaultVariant?.(params)
}

function selectedAugmenter(
  registry: ReadonlyMap<string, MetadataItemXmlImportAugmenter>,
  context: ConfigurationContextFromXML,
): MetadataItemXmlImportAugmenter | undefined {
  const fromXML = context.fromXML
  if (!("metadataItemAugmenter" in fromXML) || typeof fromXML.metadataItemAugmenter !== "string") return undefined
  const augmenter = registry.get(fromXML.metadataItemAugmenter)
  if (augmenter === undefined) {
    throw new Error(`Не зарегистрировано дополнение XML-import metadata-item: ${fromXML.metadataItemAugmenter}`)
  }
  return augmenter
}
