import type { MetadataItemRule, PropertyRule } from "./types"
import type { ConfigurationIndexAddressingMode, YAMLPropertySource } from "./ruleContracts"
export type { YAMLPropertySource } from "./ruleContracts"
import type { DeferredRulePathSegment, YamlRuleCursor } from "./importYamlTypes"
import type { DeferredValuePath } from "./deferredObjectValues"
import type { XmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"

export interface YAMLToXMLOutputRequest {
  readonly key: string
  readonly tags?: readonly string[]
  readonly referenceXML?: unknown
  readonly context?: import("../../context/types").ConfigurationContextWithExportToXML
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
  readonly propertyTypeProfiling: boolean
  propertyCount: number
  nestedItemCount: number
  atomicFromYAMLCount: number
  atomicToXMLCount: number
  rulesPassCount: 1
  propertyPaths: string[]
  planningMs: number
  propertyConversionMs: number
  deferredFinalizeMs: number
  directHashMs: number
  mismatchDocumentMs: number
  propertyTypeProfiles: Record<string, YAMLToXMLPropertyTypeProfile>
}

export interface YAMLToXMLPropertyTypeProfile {
  propertyCount: number
  inclusiveMs: number
  exclusiveMs: number
}

export interface YAMLToXMLItemConversionParams {
  readonly context: import("../../context/types").ConfigurationContextWithExportToXML
  readonly yaml: unknown
  readonly annotations?: XmlAnomalyAnnotations
  readonly rule: MetadataItemRule
  readonly name?: string
  readonly namePropertyKey?: string
  readonly sourceItemName?: string
  readonly outputs: readonly YAMLToXMLOutputRequest[]
  readonly propertyValues?: ReadonlyMap<string, unknown>
  readonly sparseYAML?: true
  readonly omitDefaultsForSparseYAML?: true
  readonly externalWriteFactory?: YAMLToXMLExternalWriteFactory
  readonly profile?: YAMLToXMLProfile
  readonly rulePath?: readonly (string | number)[]
  readonly deferredRulePath?: readonly DeferredRulePathSegment[]
}

export const createYAMLToXMLProfile = (options: { readonly propertyTypes?: boolean } = {}): YAMLToXMLProfile => ({
  propertyTypeProfiling: options.propertyTypes === true,
  propertyCount: 0,
  nestedItemCount: 0,
  atomicFromYAMLCount: 0,
  atomicToXMLCount: 0,
  rulesPassCount: 1,
  propertyPaths: [],
  planningMs: 0,
  propertyConversionMs: 0,
  deferredFinalizeMs: 0,
  directHashMs: 0,
  mismatchDocumentMs: 0,
  propertyTypeProfiles: {},
})

export interface SelectedBaseYAMLInput {
  readonly kind: "selectedBaseYAML"
  readonly baseFormSourceKind: "saved" | "projected"
  readonly baseFormYAML: unknown
  readonly currentConfigurationFormYAML: unknown
}

export type YAMLToXMLNestedRule =
  | {
      readonly kind: "externalFile"
      readonly convert: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        yaml: unknown
        ownerYAML: unknown
        baseYAML?: unknown
        baseYAMLContext?: import("../../context/types").ConfigurationContextWithExportToXML
        baseConfigurationIndex?: import("../../configurationIndex/localReader").LocalConfigurationIndexReader
        name: string
        referenceXML: Record<string, unknown> | undefined
      }) => Record<string, unknown> | undefined
    }
  | {
      readonly kind: "item"
      readonly itemRule: MetadataItemRule
      /** Идентификатор каждого элемента обязателен в режиме существующих identity. */
      readonly requiredIdentity?: "xmlId"
      readonly itemRuleFromProperty?: (propertyRule: PropertyRule) => MetadataItemRule | undefined
      readonly configurationIndexAddressing?: import("./types").ConfigurationIndexAddressingMode
      readonly sparseYAML?: true
      readonly injectOwnerName?: true
      readonly normalizeYAML?: (params: {
        yaml: unknown
        annotations?: XmlAnomalyAnnotations
        name: string | undefined
        propertyRule: PropertyRule
      }) => unknown
      readonly resolveContext?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        name: string | undefined
        propertyRule: PropertyRule
      }) => import("../../context/types").ConfigurationContextWithExportToXML
      readonly resolveItemName?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        yaml: unknown
        ownerName: string | undefined
        propertyRule: PropertyRule
      }) => string | undefined
      readonly resolveItemContext?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        name: string | undefined
        itemName: string | undefined
        propertyRule: PropertyRule
      }) => import("../../context/types").ConfigurationContextWithExportToXML
      readonly transformOutput?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        xml: Record<string, unknown>
        yaml: unknown
        referenceXML: Record<string, unknown> | undefined
        propertyRule: PropertyRule
        source: YAMLPropertySource
        itemName: string | undefined
      }) => unknown
    }
  | {
      readonly kind: "collection"
      readonly itemRule: MetadataItemRule
      /** Идентификатор каждого элемента обязателен в режиме существующих identity. */
      readonly requiredIdentity?: "xmlId"
      readonly itemRuleFromProperty?: (propertyRule: PropertyRule) => MetadataItemRule | undefined
      readonly resolveItemRule?: (params: {
        yaml: unknown
        name: string | undefined
        index: number
        propertyRule: PropertyRule | undefined
      }) => MetadataItemRule
      readonly resolveItemContext?: (params: {
        context: import("../../context/types").ConfigurationContextWithExportToXML
        yaml: unknown
        name: string | undefined
        index: number
        itemRule: MetadataItemRule
        propertyRule: PropertyRule | undefined
      }) => import("../../context/types").ConfigurationContextWithExportToXML
      readonly normalizeItemYAML?: (params: {
        yaml: unknown
        annotations?: XmlAnomalyAnnotations
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
