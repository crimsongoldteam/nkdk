/**
 * YAML-имена служебных сегментов пути к полю метаданных,
 * которые вырезаются при компрессии до компактного node ID.
 *
 * Соответствуют значениям полей в MetadataFieldsRulesToYAML:
 *   Attribute → Реквизит, TabularSection → ТабличнаяЧасть,
 *   StandardAttribute → СтандартныйРеквизит,
 *   Dimension → Измерение, Resource → Ресурс.
 */
const TRANSPARENT_SEGMENTS = new Set([
  "Реквизит",
  "ТабличнаяЧасть",
  "СтандартныйРеквизит",
  "Измерение",
  "Ресурс",
])

/**
 * Сжимает YAML-путь к полю метаданных до компактного node ID,
 * вырезая служебные сегменты-контейнеры (Реквизит, ТабличнаяЧасть,
 * СтандартныйРеквизит, Измерение, Ресурс).
 *
 * Применяется после convertPath — на пути уже в YAML-формате.
 * MetadataItemLink/MetadataValue-пути приходят уже сжатыми; эту
 * функцию следует вызывать только для MetadataField-путей.
 *
 * Примеры:
 *   "Справочник.X.Реквизит.Y"                   → "Справочник.X.Y"
 *   "Справочник.X.ТабличнаяЧасть.Z.Реквизит.W"  → "Справочник.X.Z.W"
 *   "Справочник.X.СтандартныйРеквизит.Y"         → "Справочник.X.Y"
 *   "РегистрСведений.X.Измерение.Y"               → "РегистрСведений.X.Y"
 *   "Справочник.X.Y"                              → "Справочник.X.Y"
 */
export function compressMetadataFieldPath(path: string): string {
  if (!path) return path
  const parts = path.split(".")
  return parts.filter((p) => !TRANSPARENT_SEGMENTS.has(p)).join(".")
}
