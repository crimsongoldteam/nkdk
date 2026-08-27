import { JSON_SCHEMA, defineMappingTag, defineScalarTag, defineSequenceTag, load } from "js-yaml"
export type YAMLScalarTagKey = string | number

export const PROPERTY_STATE_YAML_TAGS = ["проверять", "изменять"] as const
export const XML_REPRESENTATION_YAML_TAGS = ["xml/string", "xml/standard-attributes"] as const
export const XML_ANNOTATION_TAGS = ["raw", "invalid", "important"] as const

export type PropertyStateYAMLTag = (typeof PROPERTY_STATE_YAML_TAGS)[number]
export type XMLRepresentationYAMLTag = (typeof XML_REPRESENTATION_YAML_TAGS)[number]
export type YAMLScalarTag = PropertyStateYAMLTag | XMLRepresentationYAMLTag

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

const xmlRepresentationTags = XML_REPRESENTATION_YAML_TAGS.map((tag) =>
  defineScalarTag(`!${tag}`, {
    resolve(value) {
      if (tag === "xml/standard-attributes") {
        if (value !== "") throw new TypeError("!xml/standard-attributes не принимает значение")
        return taggedYAMLScalar(tag, undefined)
      }
      return taggedYAMLScalar(tag, value)
    },
    identify(value) {
      return isTaggedYAMLScalar(value) && value.tag === tag
    },
    represent(value) {
      const payload = (value as TaggedYAMLScalar).value
      if (tag === "xml/standard-attributes") {
        if (payload !== undefined) throw new TypeError("!xml/standard-attributes не принимает значение")
        return ""
      }
      if (typeof payload !== "string") {
        throw new TypeError("Тег !xml/string поддерживает только строковое значение")
      }
      return payload
    },
  })
)

const xmlAnnotationTags = XML_ANNOTATION_TAGS.flatMap((tag) => [
  defineScalarTag(`!xml/${tag}`, {
    resolve(value) {
      return tag === "raw" ? (value === "" ? undefined : value) : parseYAMLScalarPayload(value)
    },
    identify: () => false,
  }),
  xmlAnnotationMappingTag(`!xml/${tag}`),
  defineSequenceTag<unknown[], unknown[]>(`!xml/${tag}`, {
    create: () => [],
    addItem: (carrier, value) => { carrier.push(value) },
    identify: () => false,
  }),
  ...(tag === "raw" ? [] : [
    defineScalarTag(`!xml/${tag}/`, {
      matchByTagPrefix: true,
      resolve: (value) => parseYAMLScalarPayload(value),
      identify: () => false,
    }),
    xmlAnnotationMappingTag(`!xml/${tag}/`, true),
    defineSequenceTag<unknown[], unknown[]>(`!xml/${tag}/`, {
      matchByTagPrefix: true,
      create: () => [],
      addItem: (carrier, value) => { carrier.push(value) },
      identify: () => false,
    }),
  ]),
])

function xmlAnnotationMappingTag(tag: string, matchByTagPrefix = false) {
  return defineMappingTag<Record<string, unknown>, Record<string, unknown>>(tag, {
    ...(matchByTagPrefix ? { matchByTagPrefix: true } : {}),
    create: () => ({}),
    addPair(carrier, key, value) {
      const stringKey = String(key)
      if (Object.prototype.hasOwnProperty.call(carrier, stringKey)) return "duplicated mapping key"
      carrier[stringKey] = value
      return ""
    },
    has: (carrier, key) => Object.prototype.hasOwnProperty.call(carrier, String(key)),
    keys: (result) => Object.keys(result),
    get: (result, key) => result[String(key)],
    identify: () => false,
    represent: (value) => new Map(Object.entries(value)),
  })
}

function parseYAMLScalarPayload(value: string): unknown {
  if (value === "") return undefined
  if (value.trim() === "") return value
  return load(value, { schema: JSON_SCHEMA })
}

function parsePropertyStatePayload(payload: string): unknown {
  if (payload === "") return undefined
  if (payload.trim() === "") return payload
  return load(payload, { schema: JSON_SCHEMA })
}

function isEmptyMapping(value: unknown): value is Record<string, never> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0
}

export function isPropertyStateYAMLTag(tag: unknown): tag is PropertyStateYAMLTag {
  return tag === "проверять" || tag === "изменять"
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

export const NKDK_YAML_SCHEMA = JSON_SCHEMA.withTags(
  xmlAnnotationTags,
  propertyStateTags,
  xmlRepresentationTags,
)
