import {
  XML_ABSENT_TAG_VALUE,
  markYAMLScalarTag,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import type {
  PropertyRule,
  StandardAttributeDescriptionsPropertyRule,
  YAMLPropertySource,
} from "@nkdk/runtime/rule-kit"

export function markAbsentStandardAttributeItems(params: {
  yaml: Record<string, unknown>
  rule: StandardAttributeDescriptionsPropertyRule
  presentInternalNames: ReadonlySet<string>
}): Record<string, unknown> {
  for (const [internalName, yamlName] of Object.entries(params.rule.standartAttributeNames ?? {})) {
    if (params.presentInternalNames.has(internalName)) continue
    params.yaml[yamlName] = XML_ABSENT_TAG_VALUE
    markYAMLScalarTag(params.yaml, yamlName, "xml/absent")
  }
  return params.yaml
}

export function isAbsentStandardAttributeItem(params: {
  collectionYAML: unknown
  internalName: string | undefined
  propertyRule: PropertyRule | undefined
}): boolean {
  if (!isRecord(params.collectionYAML) || params.internalName === undefined) return false
  const rule = params.propertyRule as StandardAttributeDescriptionsPropertyRule | undefined
  const yamlName = rule?.standartAttributeNames?.[params.internalName]
  return (
    yamlName !== undefined &&
    params.collectionYAML[yamlName] === XML_ABSENT_TAG_VALUE &&
    yamlScalarTagAt(params.collectionYAML, yamlName) === "xml/absent"
  )
}

export function sourceWithoutAbsentStandardAttributes(
  source: YAMLPropertySource,
  propertyRule: StandardAttributeDescriptionsPropertyRule,
): YAMLPropertySource {
  return {
    itemName: source.itemName,
    has: (propertyKey) => source.has(propertyKey),
    raw(propertyKey) {
      const value = source.raw(propertyKey)
      if (propertyKey !== "standardAttributes" || !isRecord(value)) return value
      return Object.fromEntries(
        Object.entries(value).filter(([yamlName]) => {
          const internalName = Object.entries(propertyRule.standartAttributeNames ?? {}).find(
            ([, candidate]) => candidate === yamlName,
          )?.[0]
          return !isAbsentStandardAttributeItem({
            collectionYAML: value,
            internalName,
            propertyRule,
          })
        }),
      )
    },
    yamlKey: (propertyKey) => source.yamlKey(propertyKey),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
