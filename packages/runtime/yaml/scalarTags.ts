import { JSON_SCHEMA, defineScalarTag, load } from "js-yaml"

export type YAMLScalarTag = "xml" | "проверять" | "изменять"
export type YAMLScalarTagKey = string | number

export const EMPTY_XML_TAG_VALUE = "!xml" as const
export const PROPERTY_STATE_YAML_TAGS = ["проверять", "изменять"] as const

const propertyStateTagAliases = {
  проверять: "nkdkcheck",
  изменять: "nkdkextx",
} as const satisfies Record<(typeof PROPERTY_STATE_YAML_TAGS)[number], string>

const taggedScalarKind = Symbol("taggedYamlScalar")
const scalarTags = new WeakMap<object, Map<YAMLScalarTagKey, YAMLScalarTag>>()

export interface TaggedYAMLScalar {
  readonly [taggedScalarKind]: true
  readonly tag: YAMLScalarTag
  readonly value: unknown
}

export function taggedYAMLScalar(tag: YAMLScalarTag, value: unknown): TaggedYAMLScalar {
  return { [taggedScalarKind]: true, tag, value }
}

export function isTaggedYAMLScalar(value: unknown): value is TaggedYAMLScalar {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Partial<TaggedYAMLScalar>)[taggedScalarKind] === true
  )
}

export function markYAMLScalarTag(parent: object, key: YAMLScalarTagKey, tag: YAMLScalarTag): void {
  const marks = scalarTags.get(parent) ?? new Map<YAMLScalarTagKey, YAMLScalarTag>()
  marks.set(key, tag)
  scalarTags.set(parent, marks)
}

export function yamlScalarTagAt(parent: unknown, key: YAMLScalarTagKey): YAMLScalarTag | undefined {
  return typeof parent === "object" && parent !== null ? scalarTags.get(parent)?.get(key) : undefined
}

export function copyYAMLScalarTags(source: object, target: object): void {
  const marks = scalarTags.get(source)
  if (marks === undefined) return
  for (const [key, tag] of marks) markYAMLScalarTag(target, key, tag)
}

export function taggedScalarForDump(parent: object, key: YAMLScalarTagKey, value: unknown): unknown {
  const tag = yamlScalarTagAt(parent, key)
  return tag === undefined ? value : taggedYAMLScalar(tag, value)
}

export function propertyStateScalarTagValue(_tag: (typeof PROPERTY_STATE_YAML_TAGS)[number], payload: unknown): unknown {
  return payload === undefined ? {} : payload
}

export function propertyStateScalarTagPayload(
  _tag: (typeof PROPERTY_STATE_YAML_TAGS)[number],
  value: unknown
): string {
  if (isEmptyMapping(value)) return ""
  if (typeof value === "string") {
    if (value === "") return JSON.stringify(value)
    return load(value, { schema: JSON_SCHEMA }) === value ? value : JSON.stringify(value)
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value)
  throw new TypeError("Локальный тег режима поддерживает только скалярное или пустое значение")
}

export function xmlScalarTagValue(payload: string): string {
  return payload === "" ? EMPTY_XML_TAG_VALUE : `${EMPTY_XML_TAG_VALUE} ${payload}`
}

export function xmlScalarTagPayload(value: string): string {
  if (value === EMPTY_XML_TAG_VALUE) return ""
  return value.startsWith(`${EMPTY_XML_TAG_VALUE} `)
    ? value.slice(EMPTY_XML_TAG_VALUE.length + 1)
    : value
}

const explicitXmlTag = defineScalarTag("!xml", {
  resolve(value) {
    return taggedYAMLScalar("xml", xmlScalarTagValue(value))
  },
  identify(value) {
    return isTaggedYAMLScalar(value) && value.tag === "xml"
  },
  represent(value) {
    return xmlScalarTagPayload((value as TaggedYAMLScalar).value as string)
  },
})

const propertyStateTags = PROPERTY_STATE_YAML_TAGS.map((tag) =>
  defineScalarTag(`!${propertyStateTagAliases[tag]}`, {
    resolve(value) {
      return taggedYAMLScalar(tag, propertyStateScalarTagValue(tag, parsePropertyStatePayload(value)))
    },
    identify(value) {
      return isTaggedYAMLScalar(value) && value.tag === tag
    },
    represent(value) {
      return propertyStateScalarTagPayload(tag, (value as TaggedYAMLScalar).value)
    },
  })
)

function parsePropertyStatePayload(payload: string): unknown {
  if (payload === "") return undefined
  return load(payload, { schema: JSON_SCHEMA })
}

function isEmptyMapping(value: unknown): value is Record<string, never> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0
}

export function prepareYAMLScalarTagsForParser(text: string): string {
  return replacePropertyStateTags(text, (tag) => `!${propertyStateTagAliases[tag]}`)
}

export function restoreYAMLScalarTagsAfterDump(text: string): string {
  let result = text
  for (const tag of PROPERTY_STATE_YAML_TAGS) {
    result = result.replaceAll(`!${propertyStateTagAliases[tag]}`, `!${tag}`)
  }
  return result
}

function replacePropertyStateTags(
  text: string,
  replacement: (tag: (typeof PROPERTY_STATE_YAML_TAGS)[number]) => string
): string {
  let result = text
  for (const tag of PROPERTY_STATE_YAML_TAGS) {
    result = result.replace(new RegExp(`!${tag}(?=\\s|$)`, "gu"), replacement(tag))
  }
  return result
}

export const NKDK_YAML_SCHEMA = JSON_SCHEMA.withTags(explicitXmlTag, propertyStateTags)
