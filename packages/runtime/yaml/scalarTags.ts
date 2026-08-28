import { JSON_SCHEMA, defineMappingTag, defineScalarTag, defineSequenceTag, load } from "js-yaml"
export type YAMLScalarTagKey = string | number

export const PROPERTY_STATE_YAML_TAGS = ["проверять", "изменять"] as const
export const XML_REPRESENTATION_YAML_TAGS = ["xml/string", "xml/name", "xml/standard-attributes"] as const
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
const valueTags = new WeakMap<object, PropertyStateYAMLTag>()

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

export function markYAMLValueTag(value: object, tag: PropertyStateYAMLTag): void {
  valueTags.set(value, tag)
}

export function yamlValueTag(value: unknown): PropertyStateYAMLTag | undefined {
  return typeof value === "object" && value !== null ? valueTags.get(value) : undefined
}

export function copyYAMLValueTag(source: object, target: object): void {
  const tag = valueTags.get(source)
  if (tag !== undefined) valueTags.set(target, tag)
}

export function copyYAMLScalarTags(
  source: object,
  target: object,
  keys?: ReadonlySet<YAMLScalarTagKey>,
): void {
  const marks = scalarTags.get(source)
  if (marks === undefined) return
  for (const [key, tag] of marks) {
    if (keys === undefined || keys.has(key)) markYAMLScalarTag(target, key, tag)
  }
}

export function taggedScalarForDump(
  parent: object,
  key: YAMLScalarTagKey,
  value: unknown,
  sourceValue: unknown = value,
): unknown {
  const tag = yamlScalarTagAt(parent, key) ?? yamlValueTag(sourceValue)
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

const propertyStateTags = PROPERTY_STATE_YAML_TAGS.flatMap((tag) => {
  const tagName = `!${propertyStateTagAliases[tag]}`
  return [
    defineScalarTag(tagName, {
      resolve(value) {
        return taggedYAMLScalar(tag, propertyStateScalarTagValue(tag, parsePropertyStatePayload(value)))
      },
      identify(value) {
        return isTaggedYAMLScalar(value) && value.tag === tag && !isCompositePropertyStateValue(value.value)
      },
      represent(value) {
        return propertyStateScalarTagPayload(tag, (value as TaggedYAMLScalar).value)
      },
    }),
    defineMappingTag<Record<string, unknown>, TaggedYAMLScalar>(tagName, {
      create: createMappingCarrier,
      addPair: addMappingPair,
      has: hasMappingKey,
      keys: (result) => Object.keys(result.value as Record<string, unknown>),
      get: (result, key) => (result.value as Record<string, unknown>)[String(key)],
      finalize: (carrier) => taggedYAMLScalar(tag, carrier),
      identify: (value) => isTaggedYAMLScalar(value)
        && value.tag === tag
        && isNonEmptyMapping(value.value),
      represent: (value) => new Map(Object.entries((value as TaggedYAMLScalar).value as Record<string, unknown>)),
    }),
    defineSequenceTag<unknown[], TaggedYAMLScalar>(tagName, {
      create: () => [],
      addItem: (carrier, value) => { carrier.push(value) },
      finalize: (carrier) => taggedYAMLScalar(tag, carrier),
      identify: (value) => isTaggedYAMLScalar(value)
        && value.tag === tag
        && Array.isArray(value.value),
      represent: (value) => (value as TaggedYAMLScalar).value as unknown[],
    }),
  ]
})

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
        throw new TypeError(`Тег !${tag} поддерживает только строковое значение`)
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
    create: createMappingCarrier,
    addPair: addMappingPair,
    has: hasMappingKey,
    keys: (result) => Object.keys(result),
    get: (result, key) => result[String(key)],
    identify: () => false,
    represent: (value) => new Map(Object.entries(value)),
  })
}

function createMappingCarrier(): Record<string, unknown> {
  return {}
}

function addMappingPair(carrier: Record<string, unknown>, key: unknown, value: unknown): string {
  const stringKey = String(key)
  if (Object.prototype.hasOwnProperty.call(carrier, stringKey)) return "duplicated mapping key"
  carrier[stringKey] = value
  return ""
}

function hasMappingKey(carrier: Record<string, unknown>, key: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(carrier, String(key))
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

function isNonEmptyMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length > 0
}

function isCompositePropertyStateValue(value: unknown): boolean {
  return Array.isArray(value) || isNonEmptyMapping(value)
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
