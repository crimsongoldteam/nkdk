import { copyYAMLRuntimeMetadata, type XmlAnomalyAnnotationTable } from "@nkdk/runtime"
import { importedYamlValueAtPath } from "./yamlPathValue"

export function createBaseFormProofPreparation(
  source: Record<string, unknown>,
  annotations: XmlAnomalyAnnotationTable,
): (yaml: Record<string, unknown>, path: readonly (string | number)[]) => void {
  const prepared = new WeakSet<object>()
  return (yaml, path) => {
    if (prepared.has(yaml)) return
    const value = importedYamlValueAtPath(source, path)
    if (isRecord(value)) {
      replaceMapping(yaml, value)
      prepared.add(yaml)
    }
  }

  function replaceMapping(target: Record<string, unknown>, value: Record<string, unknown>): void {
    for (const key of Object.keys(target)) {
      if (!Object.hasOwn(value, key) && annotations.at(target, key)?.kind !== "raw") delete target[key]
    }
    for (const key of Object.keys(value)) {
      if (isPrepared(target[key])) continue
      replaceValue(target, key, value[key])
    }
    copyYAMLRuntimeMetadata(value, target)
  }

  function replaceValue(target: Record<string, unknown> | unknown[], key: string | number, value: unknown): void {
    const mapping = target as Record<string | number, unknown>
    const previous = mapping[key]
    if (isRecord(previous) && isRecord(value)) {
      replaceMapping(previous, value)
    } else if (Array.isArray(previous) && Array.isArray(value)) {
      previous.length = value.length
      for (let index = 0; index < value.length; index += 1) {
        if (!isPrepared(previous[index])) replaceValue(previous, index, value[index])
      }
      copyYAMLRuntimeMetadata(value, previous)
    } else {
      mapping[key] = value
    }
  }

  function isPrepared(value: unknown): boolean {
    return value !== null && typeof value === "object" && prepared.has(value)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
