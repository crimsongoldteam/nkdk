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
 * Объект является дочерней коллекцией (не должен сплющиваться в props родителя),
 * если **все** его значения первого уровня — plain-объекты, и таких значений
 * больше одного. Это отличает attributes/standardAttributes
 * (ключи — имена сущностей, значения — объекты, >1 ключа)
 * от I8nText ({ items: { ru, en } }, ровно 1 ключ).
 */
const isChildCollection = (v: Record<string, unknown>): boolean => {
  const vals = Object.values(v)
  return vals.length > 1 && vals.every(isPlainObject)
}

/**
 * Раскладывает поля JS-модели в плоский Record<string, GraphPrimitive | GraphPrimitive[]>:
 * - скаляры → p_<имя>
 * - plain-объекты сплющиваются по '_' (numberQualifiers.digits → p_numberQualifiers_digits)
 *   но дочерние коллекции (attributes, tabularSections, standardAttributes и т.д.)
 *   **не сплющиваются** — они уже вынесены в отдельные узлы.
 * - массивы примитивов сохраняются под p_<имя>
 * - массивы объектов и пустые массивы выкидываются
 * - itemType и _uuid выкидываются на любом уровне.
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
      continue
    }

    if (isPlainObject(value)) {
      if (isChildCollection(value)) continue
      flattenInto(out, `${fullKey}_`, value)
      continue
    }
  }
}