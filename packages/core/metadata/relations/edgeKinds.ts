/**
 * Реестр семантических видов рёбер графа метаданных.
 *
 * Owning-рёбра (бывший kind: "composition") — связывают владельца с дочерними
 * узлами, которые удаляются при инвалидации файла-владельца.
 *
 * Reference-рёбра (бывший kind: "reference") — указывают на узлы, которые
 * превращаются в заглушки при инвалидации файла.
 *
 * Все используемые в кодовой базе виды должны быть зарегистрированы здесь
 * или через registerEdgeKind. isOwning бросает для неизвестных видов.
 */

const _owning = new Set<string>([
  // Дочерние объекты прикладных объектов
  "Реквизит",
  "ТабличнаяЧасть",
  "СтандартныйРеквизит",
  "ЗначениеПеречисления",
  // Root-рёбра от itemTypePrefix-узла к узлу объекта
  "MetadataCatalog",
  "MetadataDocument",
  "MetadataEnumeration",
  // Устаревший вид из addRelation (backward compat)
  "Родитель",
])

const _known = new Set<string>([
  ..._owning,
  // Reference-виды
  "Тип",
])

/**
 * Возвращает true, если kind является owning (composition) ребром.
 * Бросает Error для незарегистрированных видов.
 */
export function isOwning(kind: string): boolean {
  if (!_known.has(kind)) {
    throw new Error(
      `edgeKinds: неизвестный kind «${kind}». Зарегистрируйте его через registerEdgeKind().`,
    )
  }
  return _owning.has(kind)
}

/**
 * Регистрирует новый вид ребра.
 * Используется новыми модулями (PRD #112 и далее) для добавления kind'ов.
 */
export function registerEdgeKind(name: string, { owning }: { owning: boolean }): void {
  _known.add(name)
  if (owning) _owning.add(name)
}
