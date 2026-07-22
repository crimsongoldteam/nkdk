import type { ConfigurationIndexAddressingMode, MetadataItemRule } from "./types"
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
  readonly referenceXML?: Record<string, unknown>
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
  | { readonly kind: "item"; readonly itemRule: MetadataItemRule }
  | {
      readonly kind: "collection"
      readonly itemRule: MetadataItemRule
      readonly yamlShape: "array" | "record"
      readonly xmlElement?: string
      readonly keyField?: string
      readonly nameFromYAMLKey?: (yamlKey: string) => string
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
