import type { YAMLScalarTag } from "./scalarTags"

const mappingKeyTags = new WeakMap<object, Map<string, YAMLScalarTag>>()

export function markYAMLMappingKeyTag(
  parent: object,
  key: string,
  tag: YAMLScalarTag,
): void {
  const tags = mappingKeyTags.get(parent) ?? new Map<string, YAMLScalarTag>()
  tags.set(key, tag)
  mappingKeyTags.set(parent, tags)
}

export function yamlMappingKeyTagAt(
  parent: unknown,
  key: string,
): YAMLScalarTag | undefined {
  return typeof parent === "object" && parent !== null
    ? mappingKeyTags.get(parent)?.get(key)
    : undefined
}

export function copyYAMLMappingKeyTags(source: object, target: object): void {
  for (const [key, tag] of mappingKeyTags.get(source) ?? []) {
    markYAMLMappingKeyTag(target, key, tag)
  }
}

export function moveYAMLMappingKeyTag(
  parent: object,
  currentKey: string,
  nextKey: string,
): void {
  const tags = mappingKeyTags.get(parent)
  const tag = tags?.get(currentKey)
  if (tag === undefined) return
  tags!.delete(currentKey)
  tags!.set(nextKey, tag)
}
