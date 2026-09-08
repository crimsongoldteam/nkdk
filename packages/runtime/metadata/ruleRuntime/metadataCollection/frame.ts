import { isXmlElementNode, type XmlElementNode } from "../../../xml/import/document"
import type { YAMLToXMLNestedRule } from "../property/fromYAMLToXMLTypes"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import type { ExecutionPath } from "../property/executionPath"
import type { XmlAnomalyAnnotations } from "../../../yaml/xmlAnomalyAnnotations"

type Descriptor = Extract<YAMLToXMLNestedRule, { kind: "collection" }>
export type MetadataCollectionSource = {
  readonly kind: "xml"
  readonly value: XmlElementNode | Record<string, unknown>
  readonly name?: string
  readonly occurrence?: number
  readonly pathKey?: string | number
} | {
  readonly kind: "yaml"
  readonly value: unknown
  readonly name?: string
  readonly occurrence?: number
  readonly pathKey?: string | number
}

export interface MetadataCollectionItem {
  readonly source: MetadataCollectionSource
  readonly index: number
  readonly name: string | undefined
  readonly occurrence: number
  readonly path: ExecutionPath<string | number>
  readonly rule: MetadataItemRule
  readonly value: unknown
}

export interface MetadataCollectionItemFrame<Context> extends MetadataCollectionItem {
  readonly context: Context
}

/** Общий порядок детей, маршруты, позиции и ленивый контекст обоих направлений. */
export function createMetadataCollectionFrame<Context>(params: {
  readonly descriptor: Descriptor
  readonly propertyRule?: PropertyRule
  readonly annotations?: XmlAnomalyAnnotations
  readonly path: ExecutionPath<string | number>
  readonly prepareContext: (item: MetadataCollectionItem) => Context
}) {
  let defaultRule: MetadataItemRule | undefined
  return {
    visit<Input>(
      inputs: Iterable<Input>,
      read: (input: Input, index: number) => MetadataCollectionSource,
      consume: (item: MetadataCollectionItemFrame<Context>, input: Input) => void,
    ): void {
      const occurrences = new Map<string, number>()
      let index = 0
      for (const input of inputs) {
        const position = index++
        const source = read(input, position)
        const name = source.name
        const occurrence = source.occurrence ?? (name === undefined ? 0 : occurrences.get(name) ?? 0)
        if (name !== undefined) occurrences.set(name, occurrence + 1)
        let selectedRule: MetadataItemRule | undefined
        let normalized = false
        let value: unknown
        let contextReady = false
        let context: Context
        const item: MetadataCollectionItemFrame<Context> = {
          source, index: position, name, occurrence,
          path: params.path.child(source.pathKey ?? (params.descriptor.yamlShape === "array" ? position : name ?? position)),
          get rule() {
            if (selectedRule !== undefined) return selectedRule
            defaultRule ??= (params.propertyRule === undefined ? undefined
              : params.descriptor.itemRuleFromProperty?.(params.propertyRule)) ?? params.descriptor.itemRule
            selectedRule = source.kind === "xml"
              ? (isXmlElementNode(source.value) ? params.descriptor.resolveXMLItemRule?.(source.value) : undefined) ?? defaultRule
              : params.descriptor.resolveItemRule?.({ yaml: source.value, name, index: position, propertyRule: params.propertyRule }) ?? defaultRule
            return selectedRule
          },
          get value() {
            if (!normalized) {
              value = source.kind === "xml" ? source.value
                : params.descriptor.normalizeItemYAML?.({ itemRule: item.rule, yaml: source.value,
                    name, index: position, propertyRule: params.propertyRule, annotations: params.annotations }) ?? source.value
              normalized = true
            }
            return value
          },
          get context() {
            if (!contextReady) {
              context = params.prepareContext(item)
              contextReady = true
            }
            return context
          },
        }
        consume(item, input)
      }
    },
  }
}
