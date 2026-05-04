/**
 * Реестр семантических видов рёбер графа метаданных.
 *
 * Поле kind — ASCII-метка (SCREAMING_SNAKE_CASE), используется как тип
 * отношения в Cypher (FalkorDB) и как идентификатор в логике (isOwning).
 * Поле yaml — русский YAML-ключ для round-trip и человекочитаемости,
 * сохраняется как property `yaml` на ребре.
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

interface EdgeKindEntry {
  yaml: string
  owning: boolean
}

const _byKind = new Map<string, EdgeKindEntry>([
  // Owning: дочерние объекты прикладных объектов
  ["ATTRIBUTE", { yaml: "Реквизит", owning: true }],
  ["TABULAR_SECTION", { yaml: "ТабличнаяЧасть", owning: true }],
  ["STANDARD_ATTRIBUTE", { yaml: "СтандартныйРеквизит", owning: true }],
  ["CHOICE_PARAMETER", { yaml: "ПараметрВыбора", owning: true }],
  ["CHOICE_PARAMETER_LINK", { yaml: "СвязьПараметровВыбора", owning: true }],
  ["ENUM_VALUE", { yaml: "ЗначениеПеречисления", owning: true }],
  ["DIMENSION", { yaml: "Измерение", owning: true }],
  // Owning: терминальные узлы (ПустаяСсылка и подобные)
  ["EMPTY_REF", { yaml: "ПустаяСсылка", owning: true }],
  // Owning: root-рёбра от itemTypePrefix-узла к узлу объекта
  ["METADATA_CATALOG", { yaml: "MetadataCatalog", owning: true }],
  ["METADATA_DOCUMENT", { yaml: "MetadataDocument", owning: true }],
  ["METADATA_ENUMERATION", { yaml: "MetadataEnumeration", owning: true }],
  // Owning: формы (PRD #112)
  ["FORM", { yaml: "Форма", owning: true }],
  // Owning: реквизиты формы (PRD #114)
  ["FORM_ATTRIBUTE", { yaml: "РеквизитФормы", owning: true }],
  // Owning: параметры формы (PRD #120)
  ["FORM_PARAMETER", { yaml: "ПараметрФормы", owning: true }],
  // Owning: команды формы
  ["FORM_COMMAND", { yaml: "КомандаФормы", owning: true }],
  // Owning: колонки реквизита формы (PRD #115)
  ["FORM_COLUMN", { yaml: "КолонкаФормы", owning: true }],
  // Owning: элементы формы (PRD #117)
  ["FORM_ELEMENT", { yaml: "ЭлементФормы", owning: true }],
  // Owning: дополнительные колонки формы (PRD #116)
  ["TABLE_EXTENSION", { yaml: "ДополнениеТаблицы", owning: true }],
  ["ADDITIONAL_COLUMN", { yaml: "ДополнительнаяКолонка", owning: true }],
  // Owning: устаревший вид из addRelation (backward compat)
  ["PARENT", { yaml: "Родитель", owning: true }],

  // Reference-виды
  ["TYPE", { yaml: "Тип", owning: false }],
  ["OBJECT", { yaml: "Объект", owning: false }],
  ["FIELD", { yaml: "Поле", owning: false }],
  ["VALUE", { yaml: "Значение", owning: false }],
  // Reference-виды форм (PRD #114)
  ["VALUE_TYPE", { yaml: "ТипЗначения", owning: false }],
  ["TYPE_RESTRICTION", { yaml: "ОграничениеТипа", owning: false }],
  ["AVAILABLE_TYPES", { yaml: "ДоступныеТипы", owning: false }],
  // Reference-ребро от прокси-узла к реальной ТЧ (PRD #116)
  ["TABLE", { yaml: "Таблица", owning: false }],
  // Reference: связанная таблица для команд формы
  ["ASSOCIATED_TABLE", { yaml: "СвязаннаяТаблица", owning: false }],
  // Reference: имя команды
  ["COMMAND_NAME", { yaml: "ИмяКоманды", owning: false }],
  // Reference: dataPath-рёбра (PRD #118)
  ["DATA_PATH", { yaml: "ПутьКДанным", owning: false }],
])

const _byYaml = new Map<string, string>()
for (const [kind, entry] of _byKind) _byYaml.set(entry.yaml, kind)

/**
 * Возвращает true, если kind является owning (composition) ребром.
 * Бросает Error для незарегистрированных видов.
 */
export function isOwning(kind: string): boolean {
  const entry = _byKind.get(kind)
  if (!entry) {
    throw new Error(
      `edgeKinds: неизвестный kind «${kind}». Зарегистрируйте его через registerEdgeKind().`,
    )
  }
  return entry.owning
}

/**
 * Регистрирует новый вид ребра.
 * kind — ASCII-метка SCREAMING_SNAKE_CASE.
 * yaml — русский YAML-ключ.
 */
export function registerEdgeKind(kind: string, params: { yaml: string; owning: boolean }): void {
  _byKind.set(kind, { yaml: params.yaml, owning: params.owning })
  _byYaml.set(params.yaml, kind)
}

/** Перевод русского YAML-ключа в ASCII kind. undefined для неизвестных. */
export function getKindByYaml(yaml: string): string | undefined {
  return _byYaml.get(yaml)
}

/** Перевод ASCII kind в русский YAML-ключ. undefined для неизвестных. */
export function getYamlByKind(kind: string): string | undefined {
  return _byKind.get(kind)?.yaml
}

/** Все известные ASCII kinds (для проверки инварианта). */
export function getKnownKinds(): readonly string[] {
  return [..._byKind.keys()]
}
