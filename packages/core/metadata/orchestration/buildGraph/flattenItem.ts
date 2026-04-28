import { GraphPrimitive } from "./types"

/** Поля JS-модели, которые НЕ попадают в props узла. */
const SKIP_KEYS = new Set(["itemType", "_uuid"])

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype

const isPrimitive = (v: unknown): v is GraphPrimitive =>
  v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"

const isPrimitiveArray = (v: unknown): v is GraphPrimitive[] =>
  Array.isArray(v) && v.every(isPrimitive)

/**
 * Раскладывает поля JS-модели в плоский Record<string, GraphPrimitive | GraphPrimitive[]>:
 * - скаляры → p_<имя>
 * - plain-объекты сплющиваются по '_' (numberQualifiers.digits → p_numberQualifiers_digits)
 * - массивы примитивов сохраняются под p_<имя>
 * - массивы объектов и пустые массивы выкидываются
 *   (массивы объектов уезжают в отдельные узлы через type-specific buildGraphFromModel)
 * - itemType и _uuid выкидываются на любом уровне.
 *
 * Type-specific перекраивание (TypeDescription с примесью ссылочных типов как рёбра,
 * MetadataValue → ref-рёбра и т.д.) уже выполнено существующими handler'ами на стадии
 * buildGraphFromModel — flattenItem не пытается это «исправлять». Если в node.item остался
 * массив объектов — он либо уже вынесен в отдельные узлы, либо был лишней копией; в
 * любом случае мы его игнорируем и не дублируем как props.
 */
export function flattenItem(
  item: unknown,
): Record<string, GraphPrimitive | GraphPrimitive[]> {
  const result: Record<string, GraphPrimitive | GraphPrimitive[]> = {}
  if (!isPlainObject(item)) return result
  flattenInto(result, "p_", item)
  return result
}

function flattenInto(
  out: Record<string, GraphPrimitive | GraphPrimitive[]>,
  prefix: string,
  obj: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (SKIP_KEYS.has(key)) continue
    if (value === undefined) continue

    const fullKey = `${prefix}${key}`

    if (isPrimitive(value)) {
      out[fullKey] = value
      continue
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue
      if (isPrimitiveArray(value)) {
        out[fullKey] = value
      }
      // Массивы объектов — пропускаем: уехали в отдельные узлы.
      continue
    }

    if (isPlainObject(value)) {
      flattenInto(out, `${fullKey}_`, value)
      continue
    }

    // Прочее (классы, функции и т.д.) — игнорируем.
  }
}
