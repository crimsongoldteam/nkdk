import { defineMappingTag } from "js-yaml"

export type YAMLMappingTag = "xml/order"

const mappingTags = new WeakMap<object, YAMLMappingTag>()

export function markYAMLMappingTag(value: object, tag: YAMLMappingTag): void {
  mappingTags.set(value, tag)
}

export function yamlMappingTagOf(value: unknown): YAMLMappingTag | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? mappingTags.get(value)
    : undefined
}

export function copyYAMLMappingTag(source: object, target: object): void {
  const tag = yamlMappingTagOf(source)
  if (tag !== undefined) markYAMLMappingTag(target, tag)
}

const xmlOrderMappingTag = defineMappingTag<Map<unknown, unknown>, Record<string, unknown>>(
  "!xml/order",
  {
    create: () => new Map(),
    addPair(carrier, key, value) {
      if (carrier.has(key)) return "duplicated mapping key"
      carrier.set(key, value)
      return ""
    },
    has: (carrier, key) => carrier.has(key),
    keys: (result) => Object.keys(result),
    get: (result, key) => result[String(key)],
    finalize(carrier) {
      const result = Object.fromEntries(carrier) as Record<string, unknown>
      markYAMLMappingTag(result, "xml/order")
      return result
    },
    identify: (value) => yamlMappingTagOf(value) === "xml/order",
    represent: (value) => new Map(Object.entries(value as Record<string, unknown>)),
  },
)

export const NKDK_YAML_MAPPING_TAGS = [xmlOrderMappingTag] as const
