import type { YamlPath } from "../../diagnostics/types"
import { isExplicitYAMLString } from "../../../yaml/explicitString"
import { isTaggedYAMLScalar, yamlValueTag, type YAMLScalarTag } from "../../../yaml/scalarTags"
import type { DirectImportFactsSink } from "./importYamlTypes"
import type { MetadataItemRule } from "./types"

export function acceptNestedPropertyFactLeaves(params: {
  readonly facts: DirectImportFactsSink | undefined
  readonly itemType: string
  readonly itemRule: MetadataItemRule
  readonly propertyKey: string
  readonly yamlPath: YamlPath
  readonly value: unknown
  readonly presentInXML: boolean
  readonly retainContainers: boolean
  readonly exportedToYAML?: true
}): void {
  const facts = params.facts
  if (facts === undefined) return
  const path = [...params.yamlPath]
  const emit = (value: unknown, propertyKey: string, scalarTag: YAMLScalarTag | undefined) => facts.acceptProperty({
    itemType: params.itemType,
    itemRule: params.itemRule,
    propertyKey,
    yamlPath: [...path],
    value,
    ...(scalarTag === undefined ? {} : { scalarTag }),
    presentInXML: params.presentInXML,
    ...(params.exportedToYAML === true ? { exportedToYAML: true } : {}),
  })
  const parents: { entries: Iterator<readonly [string | number, unknown]>; depth: number }[] = []
  let current = params.value
  for (;;) {
    const taggedScalar = isTaggedYAMLScalar(current) ? current : undefined
    const value = taggedScalar === undefined ? current : taggedScalar.value
    const scalarTag = taggedScalar?.tag ?? yamlValueTag(value)
    const container = value !== null && typeof value === "object" && !isExplicitYAMLString(value)
    if (container && (scalarTag !== undefined || params.retainContainers)) {
      emit(Array.isArray(value) ? [] : {}, container ? `$container:${params.propertyKey}` : params.propertyKey, scalarTag)
    }
    if (container) {
      const entries = propertyEntries(value)
      const next = entries.next()
      if (!next.done) {
        parents.push({ entries, depth: path.length })
        path.push(next.value[0])
        current = next.value[1]
        continue
      }
    }
    if (!container || !params.retainContainers) {
      emit(value, params.propertyKey, scalarTag)
    }
    for (;;) {
      const parent = parents.at(-1)
      if (parent === undefined) return
      path.length = parent.depth
      const next = parent.entries.next()
      if (!next.done) {
        path.push(next.value[0])
        current = next.value[1]
        break
      }
      parents.pop()
    }
  }
}

function* propertyEntries(value: object): IterableIterator<readonly [string | number, unknown]> {
  if (Array.isArray(value)) {
    const length = value.length
    for (let index = 0; index < length; index++) yield [index, value[index]]
  } else {
    for (const key of Object.keys(value)) yield [key, Reflect.get(value, key)]
  }
}
