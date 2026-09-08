import { copyYAMLRuntimeMetadata, type XmlAnomalyAnnotationTable } from "@nkdk/runtime"
import type { BaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjectionSource"

export function createBaseFormProofPreparation(
  source: BaseFormProjectionSource,
  annotations: XmlAnomalyAnnotationTable,
): (yaml: Record<string, unknown>, path: readonly (string | number)[]) => void {
  const prepared = new WeakSet<object>()
  return (yaml, path) => {
    if (prepared.has(yaml)) return
    let value: BaseFormProjectionSource | undefined = source
    for (const segment of path) value = value?.child(String(segment))
    if (value !== undefined) {
      replaceMapping(yaml, value)
      prepared.add(yaml)
    }
  }

  function replaceMapping(target: Record<string, unknown>, value: BaseFormProjectionSource): void {
    for (const key of Object.keys(target)) {
      if (!value.has(key) && annotations.at(target, key)?.kind !== "raw") delete target[key]
    }
    for (const key of value.keys()) {
      if (isPrepared(target[key])) continue
      replaceValue(target, key, value)
    }
    if (value.metadataSource !== undefined) copyYAMLRuntimeMetadata(value.metadataSource, target)
  }

  function replaceValue(target: Record<string, unknown> | unknown[], key: string | number, source: BaseFormProjectionSource): void {
    const mapping = target as Record<string | number, unknown>
    const previous = mapping[key]
    const child = previous !== null && typeof previous === "object" ? source.child(String(key)) : undefined
    if (isRecord(previous) && child !== undefined && !Array.isArray(child.metadataSource)) {
      replaceMapping(previous, child)
    } else if (Array.isArray(previous) && child !== undefined && Array.isArray(child.metadataSource)) {
      previous.length = child.keys().length
      for (let index = 0; index < previous.length; index += 1) {
        if (!isPrepared(previous[index])) replaceValue(previous, index, child)
      }
      if (child.metadataSource !== undefined) copyYAMLRuntimeMetadata(child.metadataSource, previous)
    } else {
      mapping[key] = source.read(String(key))
    }
  }

  function isPrepared(value: unknown): boolean {
    return value !== null && typeof value === "object" && prepared.has(value)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
