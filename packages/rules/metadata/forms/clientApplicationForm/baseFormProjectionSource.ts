import { hasYAMLRuntimeMetadataAt, type XmlAnomalyAnnotations } from "@nkdk/runtime"

/** Чтение одной границы проекции; дочерний объект не требует сборки всего YAML. */
export interface BaseFormProjectionSource {
  keys(): readonly string[]
  has(key: string): boolean
  read(key: string): unknown
  child(key: string): BaseFormProjectionSource | undefined
  hasRuntimeMetadata(key: string, annotations?: XmlAnomalyAnnotations): boolean
  readonly metadataSource?: object
}

/** Уже имеющийся YAML обычной проверки/экспорта используется без копирования. */
export function yamlBaseFormProjectionSource(yaml: Record<string, unknown>): BaseFormProjectionSource {
  return {
    keys: () => Object.keys(yaml),
    has: key => Object.hasOwn(yaml, key),
    read: key => yaml[key],
    child(key) {
      const value = yaml[key]
      if (value === undefined) return undefined
      if (value === null || typeof value !== "object") {
        throw new Error(`Поле проекции основы ${key} должно быть объектом`)
      }
      return yamlBaseFormProjectionSource(value as Record<string, unknown>)
    },
    hasRuntimeMetadata: (key, annotations) => hasYAMLRuntimeMetadataAt(yaml, key, annotations),
    metadataSource: yaml,
  }
}
