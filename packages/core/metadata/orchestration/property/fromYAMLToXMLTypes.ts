import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "./types"
import type { YamlRuleCursor } from "./importYamlTypes"
import type { DeferredValuePath } from "./deferredObjectValues"

export interface YAMLPropertySource {
  readonly itemName?: string
  has(propertyKey: string): boolean
  raw(propertyKey: string): unknown
  yamlKey(propertyKey: string): string | undefined
}

export interface YAMLToXMLOutputRequest {
  readonly key: string
  readonly tags?: readonly string[]
  readonly referenceXML?: unknown
}

export type YAMLToXMLExternalWrite =
  | { readonly kind: "copy"; readonly sourcePath: string; readonly targetPath: string }
  | { readonly kind: "xml"; readonly targetPath: string; readonly value: Record<string, unknown> }
  | { readonly kind: "handler"; run(): Promise<void> }

export type YAMLToXMLExternalWriteFactory = (params: {
  readonly context: import("../../context/types").ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly source: YAMLPropertySource
  readonly name: string | undefined
  readonly propertyKey: string
  readonly propertyRule: PropertyRule
  readonly referenceValue: unknown
}) => readonly YAMLToXMLExternalWrite[]

export interface YAMLToXMLResult {
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly deferredByOutput: ReadonlyMap<string, readonly DeferredValuePath[]>
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
}

export interface YAMLToXMLProfile {
  propertyCount: number
  nestedItemCount: number
  atomicFromYAMLCount: number
  atomicToXMLCount: number
  rulesPassCount: 1
  propertyPaths: string[]
}

export const createYAMLToXMLProfile = (): YAMLToXMLProfile => ({
  propertyCount: 0,
  nestedItemCount: 0,
  atomicFromYAMLCount: 0,
  atomicToXMLCount: 0,
  rulesPassCount: 1,
  propertyPaths: [],
})

export type YAMLToXMLNestedRule =
  | {
      readonly kind: "externalFile"
      readonly convert: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        yaml: unknown
        name: string
        referenceXML: Record<string, unknown> | undefined
      }) => Record<string, unknown>
    }
  | {
      readonly kind: "item"
      readonly itemRule: MetadataItemRule
      readonly sparseYAML?: true
      readonly injectOwnerName?: true
      readonly normalizeYAML?: (params: {
        yaml: unknown
        name: string | undefined
        propertyRule: PropertyRule
      }) => unknown
      readonly resolveContext?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        name: string | undefined
        propertyRule: PropertyRule
      }) => import("../../context/types").ConfigurationContextWithExportToXML
      readonly transformOutput?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        xml: Record<string, unknown>
        yaml: unknown
        referenceXML: Record<string, unknown> | undefined
        propertyRule: PropertyRule
        source: YAMLPropertySource
      }) => unknown
    }
  | {
      readonly kind: "collection"
      readonly itemRule: MetadataItemRule
      readonly itemRuleFromProperty?: (propertyRule: PropertyRule) => MetadataItemRule | undefined
      readonly resolveItemRule?: (params: {
        yaml: unknown
        name: string | undefined
        index: number
        propertyRule: PropertyRule | undefined
      }) => MetadataItemRule
      readonly normalizeItemYAML?: (params: {
        yaml: unknown
        name: string | undefined
        index: number
        propertyRule: PropertyRule | undefined
      }) => unknown
      readonly referenceIdentity?: {
        fromYAML(params: { yaml: unknown; name: string | undefined; itemRule: MetadataItemRule }): string | undefined
        fromXML(params: { xml: Record<string, unknown>; itemRule: MetadataItemRule }): string | undefined
      }
      readonly mapItemOutput?: (params: {
        xml: Record<string, unknown>
        yaml: unknown
        name: string | undefined
        index: number
        itemRule: MetadataItemRule
        propertyRule: PropertyRule | undefined
        context: import("../../context/types").ConfigurationContextWithExportToXML
        collectionYAML: unknown
        referenceXML: Record<string, unknown> | undefined
      }) => unknown
      readonly unwrapReferenceItem?: (params: {
        xml: Record<string, unknown>
        itemRule: MetadataItemRule
      }) => Record<string, unknown> | undefined
      readonly yamlShape: "array" | "record"
      readonly xmlElement?: string
      readonly keyField?: string
      readonly nameFromYAMLKey?: (yamlKey: string) => string
      readonly nameFromYAMLKeyForProperty?: (params: { yamlKey: string; propertyRule: PropertyRule }) => string
      readonly completeItemNames?: (params: {
        source: YAMLPropertySource
        propertyRule: PropertyRule
      }) => readonly string[]
      readonly preserveReferenceItems?: true
      /** Восстанавливать из индекса имена элементов, намеренно опущенных в YAML. */
      readonly preserveOmittedItemNames?: true
      readonly sparseItems?: true
      readonly omitDefaultsForSparseItems?: true
      readonly omitDefaultsForSparseItem?: (params: {
        yaml: unknown
        name: string | undefined
        referenceXML: Record<string, unknown> | undefined
        propertyRule: PropertyRule | undefined
      }) => boolean
      readonly omitEmptyOutput?: true
      readonly configurationIndexUidSegment?: string
      readonly configurationIndexAddressing?: ConfigurationIndexAddressingMode
    }
  | {
      readonly kind: "polymorphicRecord"
      resolveItemRule(params: { yaml: Record<string, unknown>; name: string }): MetadataItemRule
    }

export interface YAMLToXMLTraversal extends YamlRuleCursor {
  readonly source: YAMLPropertySource
}
