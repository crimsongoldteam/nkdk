import { JSON_SCHEMA, defineScalarTag } from "js-yaml"

export type YAMLScalarTag = "xml"
export type YAMLScalarTagKey = string | number

const taggedScalarKind = Symbol("taggedYamlScalar")
const scalarTags = new WeakMap<object, Map<YAMLScalarTagKey, YAMLScalarTag>>()

export interface TaggedYAMLScalar {
  readonly [taggedScalarKind]: true
  readonly tag: YAMLScalarTag
  readonly value: string
}

export function taggedYAMLScalar(tag: YAMLScalarTag, value: string): TaggedYAMLScalar {
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
  return tag === undefined || typeof value !== "string" ? value : taggedYAMLScalar(tag, value)
}

const explicitXmlTag = defineScalarTag("!xml", {
  resolve(value) {
    return taggedYAMLScalar("xml", value)
  },
  identify(value) {
    return isTaggedYAMLScalar(value) && value.tag === "xml"
  },
  represent(value) {
    return (value as TaggedYAMLScalar).value
  },
})

export const NKDK_YAML_SCHEMA = JSON_SCHEMA.withTags(explicitXmlTag)
