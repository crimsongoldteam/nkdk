import type { ConfigurationIndexAddressingMode, MetadataItemRule, PropertyRule } from "./types"
import type { YamlRuleCursor } from "./importYamlTypes"

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

export interface YAMLToXMLResult {
  readonly outputs: ReadonlyMap<string, Record<string, unknown>>
  readonly externalWrites: readonly YAMLToXMLExternalWrite[]
}

export type YAMLToXMLNestedRule =
  | {
      readonly kind: "item"
      readonly itemRule: MetadataItemRule
      readonly sparseYAML?: true
      readonly injectOwnerName?: true
      readonly transformOutput?: (params: {
        xml: Record<string, unknown>
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
      readonly mapItemOutput?: (params: {
        xml: Record<string, unknown>
        yaml: unknown
        name: string | undefined
        index: number
        itemRule: MetadataItemRule
        propertyRule: PropertyRule | undefined
        context: import("../../context/types").ConfigurationContextWithExportToXML
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
      readonly sparseItems?: true
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
