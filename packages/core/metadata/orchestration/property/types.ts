import type { DcsMetadataValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types"
import { SettingsParameterValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/parameterValue/types"
import { DateTimePropertyRule } from "~/metadata/commonObjects/dateTime/types"
import type { ExternalPicturePropertyRule } from "~/metadata/commonObjects/externalPicture/types"
import { FormattedI8nTextPropertyRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextPropertyRule } from "~/metadata/commonObjects/i8nText/types"
import type { ChildFormNamesPropertyRule } from "~/metadata/commonObjects/childFormNames/types"
import type { ChildSubsystemNamesPropertyRule } from "~/metadata/commonObjects/childSubsystemNames/types"
import type { ChildTemplateNamesPropertyRule } from "~/metadata/commonObjects/childTemplateNames/types"
import type { CypherSet } from "./cypherPredicate"
import type { XMLRootPropertyRule } from "~/metadata/commonObjects/xmlRoot/types"
import { MetadataValuePropertyRule } from "~/metadata/commonObjects/metadataValue/types"
import { NumberPropertyRule } from "~/metadata/commonObjects/number/types"
import { PredefinedCodePropertyRule } from "~/metadata/commonObjects/predefinedCode/types"
import { StringOrNumberPropertyRule } from "~/metadata/commonObjects/stringOrNumber/types"
import type { WSDefinitionSchemasPropertyRule } from "~/metadata/commonObjects/wsDefinitionSchemas/types"

import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { TableAdditionalSourceTypes } from "~/metadata/forms/commonObjects/tableAdditionalSource/types"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemType } from "../metadataItem/registry"
import { PropertyRuleType } from "./registry"

export type ReferenceScopeFilterName = "stringIndexedAttribute"

/** Ссылка на объект текущего объекта-владельца (target: "this"). */
export type ReferenceScopeThis =
  | { target: "this"; kind: "Form" }
  | { target: "this"; kind: "Template" }
  | { target: "this"; kind: "Attribute"; filter?: ReferenceScopeFilterName }

/** Ссылка на top-level объект одного из допустимых типов. */
export type ReferenceScopeTopLevel = {
  target: "topLevel"
  /** Допустимые префиксы типов, например ["Справочник", "Документ"]. */
  allowedTypes: string[]
}

export type ReferenceScope = ReferenceScopeThis | ReferenceScopeTopLevel

export interface MetadataItem {
  itemType: MetadataItemType
}

type DefaultValueFunction = (params: { context: ConfigurationContext; name?: string }) => any

export interface BasePropertyRule {
  /** Тип свойства */
  type: PropertyRuleType

  /** Обязательное свойство */
  required?: true

  /** Отключает свойство при любом экспорте/импорте */
  runtimeOnly?: true

  /** Свойство участвует только во внешней синхронизации и не входит в XML/YAML/модель. */
  syncExternalOnly?: true

  /** Порядок свойства при выгрузке в XML (используй только при необходимости) */
  order?: number

  /** Название ключа в YAML */
  yaml?: string

  /** Не экспортировать в YAML */
  toYAML?: false

  /** Не импортировать из YAML */
  fromYAML?: false

  /** Не экспортировать в корневой YAML */
  toPartialYAML?: false

  /** Значение по умолчанию в YAML (будет исключено из выбора)*/
  defaultValueYAML?: any | DefaultValueFunction

  /** Исключать YAML-default по модельному значению до преобразования типа. */
  omitDefaultValueYAMLBySource?: true

  /**
   * Подставлять defaultValueYAML при импорте, если значения нет ни в YAML, ни в source.
   * Используй только когда defaultValueYAML уже совместим с модельным значением.
   */
  applyModelDefaultValueYAMLOnImport?: true | { whenAnyYAMLKeyPresent: string[] }

  /** Название в XML, если не заполнено - будет использован ключ*/
  xml?: string

  /** Альтернативные названия XML-тега для импорта и round-trip по reference */
  xmlAliases?: string[]

  /** Значение по умолчанию в XML (будет выгружено как при пустом значении)*/
  defaultValueXML?: any

  /** Сохранять явно присутствующее XML-значение, даже если оно равно defaultValueXML. */
  preserveExplicitDefaultXML?: true

  /**
   * Сырая XML-форма пустого значения — подставляется напрямую, без прогона через typeExportFn и wrapWithNamespace.
   * Триггер срабатывания идентичен defaultValueXML.
   * Взаимоисключимо с defaultValueXML.
   * Примеры: "" — пустой тег, { "_xsi:nil": true } — nil-тег.
   */
  defaultValueXMLRaw?: any

  /**
   * Значение, возвращаемое при импорте из XML, когда тег ПРИСУТСТВУЕТ в XML, но пустой (значение undefined).
   * В отличие от defaultValue, применяется только при импорте из XML и только когда тег явно задан.
   * Примеры: [] для пустого Attributes, { items: {} } для пустого Synonym, "" для пустого Comment.
   */
  defaultValueXMLEmpty?: any

  /** Не импортировать из XML */
  fromXML?: false

  /**
   * XML-only preservation mode: export this property only when the reference metadata object
   * owns the same property key. Used for service tags that must be kept during round-trip
   * but never inferred for newly-created XML.
   */
  preserveFromReferenceXML?: true

  /** Не экспортировать в XML. Функция получает родительский metadataItem и опциональный context, возвращает `true` если экспортировать, `false` если пропустить */
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean)

  /** Родительские элементы в XML */
  xmlParents?: string[]

  /** XML namespace для элемента при экспорте: `xmlns="..."` */
  xmlNamespace?: string

  /**
   * Выгружать XML-значение с `_xsi:type`.
   * `true` используется типами с собственным фиксированным XML-типом, строка задает конкретный XML-тип из rules.ts.
   */
  typedXML?: true | string

  /** Передавать значение в форму в 1С */
  toEnterprise?: false

  /** Значение по умолчанию */
  defaultValue?: any | DefaultValueFunction

  /** Теги, по которым будет выгружаться свойство */
  tag?: string

  /** Имя элемента внутри коллекции MetadataItemLinks, если используется не xr:Item. */
  metadataItemLinksXMLItem?: "xr:Item" | "xr:Object"

  /** Если все поля пустые - это поле будет выгружено как значение */
  useAsShortValueYAML?: true

  /** Свойство используется только для построения референса */
  forReferenceOnly?: true

  /** Описание допустимых целей ссылки (используется для валидации и автодополнения). */
  referenceScope?: ReferenceScope

  /** Множество допустимых значений из Cypher-запроса к FalkorDB. Используется для валидации и автодополнения. */
  allowedValues?: CypherSet

  /**
   * Значение свойства хранится во внешнем файле, а не в YAML.
   * Путь к файлу: `<dir>/<parent.name>.<extension>`.
   */
  externalFile?: { dir: string; extension: string; nameFrom: "parent" }

  /**
   * Значение свойства вычисляется из наличия внешнего файла другого свойства.
   * Не хранится в YAML.
   */
  derivedFrom?: { externalFile: string }

  /**
   * Явная ASCII-метка kind'а для reference-ребра, порождаемого этим свойством
   * (SCREAMING_SNAKE_CASE). Перекрывает правило по умолчанию (перевод yaml-имени
   * через edgeKinds). Используется, когда yaml-имя коллидирует или неточно
   * отражает семантику ребра.
   */
  graphEdgeKind?: string

  /**
   * Путь к внешнему XML-файлу относительно директории объекта метаданных.
   * Свойство с этим полем не участвует в основном XML-файле объекта —
   * читается/пишется отдельно оркестратором.
   * Пример: "Ext/Predefined.xml"
   */
  filePath?: string

  /**
   * При отсутствии значения в YAML экспортировать внешний XML-файл из reference-модели.
   * Используй только для формата, где отсутствие YAML-значения означает сохранение файла как есть.
   */
  exportReferenceFileOnMissingValue?: true

  /**
   * Если true, при сериализации в YAML и JSON-схему значение этого свойства подставляется
   * напрямую как значение всего item-объекта (без обёртки ключом). Допустимо ровно одно
   * содержательное (не forReferenceOnly) свойство с этим флагом на правило.
   * Скоп — только YAML/JSON-схема. Модель данных и XML-сериализация не затрагиваются.
   */
  yamlInline?: true
}

export interface ChildItemsPropertyRule extends BasePropertyRule {
  type: "GroupChildItems" | "CommandBarChildItems" | "TableChildItems" | "PagesChildItems"
  defaultValue: []
  fromPartialYAML?: true
}

export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  /** Ключ в YAML в случае разрешения использования */
  yaml: string
  /** Ключ в YAML в случае запрета использования */
  yamlDeny: string
}

export interface StandardAttributeDescriptionPropertyRule extends BasePropertyRule {
  type: "StandardAttributeDescription"
  standartAttributeNames: Record<string, string>
}

export interface StandardAttributeDescriptionsPropertyRule extends BasePropertyRule {
  type: "StandardAttributeDescriptions"
  standartAttributeNames: Record<string, string>
  standartAttributeNamesXML?: (metadataItem: unknown) => Record<string, string>
}

export interface EventsPropertyRule extends BasePropertyRule {
  type: "Events"
  /**
   * Маппинг: ключ события в metadata -> ключ в YAML (русский синоним).
   * Пример: onChange -> "ПриИзменении"
   */
  items: Record<string, string>
}

export interface TableAdditionalSourcePropertyRule extends BasePropertyRule {
  type: "TableAdditionalSource"
  additionalSourceType: TableAdditionalSourceTypes
  forSingleElement?: true
}

export interface TypeDescriptionPropertyRule extends BasePropertyRule {
  type: "TypeDescription"
  addTypeDescriptionAttributeToXML?: true
  declareTypeNamespaceXML?: boolean
}

export interface DataPathPropertyRule extends BasePropertyRule {
  type: "DataPath"
  defaultType: string
}

export interface MetadataTypePropertyRule extends BasePropertyRule {
  type: "MetadataType" | "MetadataTypeCollection"
  typeValue: string
}

export interface InternalInfoPropertyRule extends BasePropertyRule {
  type: "InternalInfo"
  items: Array<{ name: string; category: string }>
  forReferenceOnly: true
  getName?: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => string
  thisNode?: boolean
}

export interface ModulePropertyRule extends BasePropertyRule {
  type: "Module"
  /** Путь к файлу на nkdk-стороне (относительно корня объекта), строка или функция от { name } */
  nkdkPath: string | ((params: { name: string; parentName?: string }) => string)
  /** Путь к файлу на xml-стороне (относительно директории объекта), строка или функция от { name } */
  xmlPath: string | ((params: { name: string; parentName?: string }) => string)
}

export interface TemplatePropertyRule extends BasePropertyRule {
  type: "Template"
  /** Путь к файлу на nkdk-стороне (относительно корня объекта), строка или функция от { name } */
  nkdkPath: string | ((params: { name: string; parentName?: string }) => string)
  /** Путь к файлу на xml-стороне (относительно директории объекта), строка или функция от { name } */
  xmlPath: string | ((params: { name: string; parentName?: string }) => string)
}

export interface HelpPropertyRule extends BasePropertyRule {
  type: "Help"
  /** Путь к Ext/Help.xml относительно директории объекта */
  filePath: string
  /** Путь к Help.xml на XML-стороне, если он отличается от filePath. */
  xmlPath?: string | ((params: { name: string }) => string)
  /** Папка с HTML-файлами на nkdk-стороне (например "Справка") */
  nkdkDir: string
}

export interface ExternalFormItemFilePropertyRule extends BasePropertyRule {
  type: "ExternalFormItemFile"
  /** Имя файла внутри Ext/Form/Items/<Элемент>, например Picture или HeaderPicture. */
  xml: string
  /** Каталог на YAML-стороне, например Картинки или КартинкиШапки. */
  yaml: string
  syncExternalOnly: true
}

export interface CleanPropertyRule extends BasePropertyRule {
  type: Exclude<
    PropertyRuleType,
    | "SystemEnumeration"
    | "I8nText"
    | "FormattedI8nText"
    | "Events"
    | "UserVisible"
    | "TableAdditionalSource"
    | "StandardAttributeDescription"
    | "StandardAttributeDescriptions"
    | "TypeDescription"
    | "DataPath"
    | "MetadataType"
    | "MetadataTypeCollection"
    | "InternalInfo"
    | "XMLRoot"
    | "ChildFormNames"
    | "ChildTemplateNames"
    | "ChildSubsystemNames"
    | "GroupChildItems"
    | "CommandBarChildItems"
    | "TableChildItems"
    | "PagesChildItems"
    | "MetadataValue"
    | "MetadataDcsMetadataValue"
    | "SettingsParameterValue"
    | "SettingsParameterValueCollection"
    | "number"
    | "PredefinedCode"
    | "StringOrNumber"
    | "dateTime"
    | "Module"
    | "Template"
    | "Help"
    | "ExternalPicture"
    | "ExternalFormItemFile"
    | "WSDefinitionSchemas"
  >
}

export interface SettingsParameterValueCollectionPropertyRule extends BasePropertyRule {
  type: "SettingsParameterValueCollection"
  /** Правило для параметра, если нет в `parameterRules` */
  defaultItemRule?: SettingsParameterValuePropertyRule
  /** Переопределения по имени параметра (`dcscor:parameter` / ключ YAML) */
  parameterRules?: Partial<Record<string, SettingsParameterValuePropertyRule>>
}

// export interface CustomExportPropertyRule extends BasePropertyRule {
//   type?: never
//   exportToYAML: (context: ConfigurationContext, rule: PropertyRule, data: any) => any
// }

export type PropertyRule =
  | SystemEnumerationPropertyRule
  | UserVisiblePropertyRule
  | I8nTextPropertyRule
  | FormattedI8nTextPropertyRule
  | EventsPropertyRule
  | CleanPropertyRule
  | TableAdditionalSourcePropertyRule
  | StandardAttributeDescriptionPropertyRule
  | StandardAttributeDescriptionsPropertyRule
  | InternalInfoPropertyRule
  | ChildItemsPropertyRule
  | TypeDescriptionPropertyRule
  | DataPathPropertyRule
  | MetadataTypePropertyRule
  | MetadataValuePropertyRule
  | DcsMetadataValuePropertyRule
  | SettingsParameterValuePropertyRule
  | SettingsParameterValueCollectionPropertyRule
  | NumberPropertyRule
  | PredefinedCodePropertyRule
  | StringOrNumberPropertyRule
  | DateTimePropertyRule
  | XMLRootPropertyRule
  | ChildFormNamesPropertyRule
  | ChildTemplateNamesPropertyRule
  | ChildSubsystemNamesPropertyRule
  | ModulePropertyRule
  | TemplatePropertyRule
  | HelpPropertyRule
  | ExternalFormItemFilePropertyRule
  | ExternalPicturePropertyRule
  | WSDefinitionSchemasPropertyRule

type PropertiesType = Record<string, PropertyRule>

export interface ItemXML {
  [key: string]: any
}

export interface MetadataItemRule extends MetadataItem {
  /**
   * Тип объекта метаданных
   */
  itemType: MetadataItemType

  /**
   * Свойства объекта метаданных
   */
  properties: PropertiesType

  /** @deprecated */
  eventsTag?: string

  /**
   * значение xsi:type для элемента
   */
  xsiType?: string

  /**
   * Префикс типа объекта в NodeId графа (например "Справочник" для MetadataCatalog).
   * Используется вместо хардкода в graph.ts.
   */
  itemTypePrefix?: string

  /**
   * Имя XML-папки в дампе конфигурации (например "Catalogs", "Documents", "DocumentNumerators", "Sequences").
   * Если задано — правило считается корневым и участвует в обходе configuration walker'а.
   * Если не задано — правило внутреннее (Command, Predefined и т.п.).
   */
  xmlDir?: string

  /**
   * Пути к XML-тегам-контейнерам, которые должны присутствовать в результате exportPropertiesToXML
   * всегда, даже пустыми. Каждый путь — массив ключей от корня результата, симметричный xmlParents
   * на уровне PropertyRule. Пример: [["Catalog", "ChildObjects"]].
   * Может содержать объект { path, tag } для создания контейнера только при экспорте с указанным тегом.
   */
  requiredXMLParents?: ReadonlyArray<ReadonlyArray<string> | { path: ReadonlyArray<string>; tag?: string }>

  /**
   * Имена терминальных узлов, которые материализуются как composition-дочки при импорте объекта.
   * Пример: ["ПустаяСсылка"] — создаёт узел `<prefix>.<name>.ПустаяСсылка` с owning-ребром.
   */
  graphTerminals?: ReadonlyArray<string>

  /**
   * Дочерние коллекции, которые оркестратор должен обойти для обработки Module/Template-свойств.
   * Ключ в модели (`propertyKey`) указывает на Record<itemName, itemData>;
   * `itemRule` содержит правила, в которых могут быть Module-свойства с функциональными путями.
   * Пути вычисляются относительно корня владельца (того же outputDir/name/).
   */
  childCollections?: ReadonlyArray<{
    propertyKey: string
    itemRule: MetadataItemRule
  }>
}
