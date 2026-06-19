import type { DcsMetadataValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types"
import { SettingsParameterValuePropertyRule } from "~/metadata/commonObjects/dataCompositionSystem/parameterValue/types"
import { DateTimePropertyRule } from "~/metadata/commonObjects/dateTime/types"
import type { ExternalFilePropertyRule } from "~/metadata/commonObjects/externalFile/types"
import type { ExternalPicturePropertyRule } from "~/metadata/commonObjects/externalPicture/types"
import type { FieldsListPropertyRule } from "~/metadata/commonObjects/fieldsList/types"
import { FormattedI8nTextPropertyRule } from "~/metadata/commonObjects/formattedI8nText/types"
import { I8nTextPropertyRule } from "~/metadata/commonObjects/i8nText/types"
import type { ChildFormNamesPropertyRule } from "~/metadata/commonObjects/childFormNames/types"
import type { ChildSubsystemNamesPropertyRule } from "~/metadata/commonObjects/childSubsystemNames/types"
import type { ChildTemplateNamesPropertyRule } from "~/metadata/commonObjects/childTemplateNames/types"
import type { MetadataTargetConstraint } from "~/metadata/commonObjects/metadataTargets/types"
import type { TypeDescriptionAllowedTypes } from "~/metadata/commonObjects/typeDescription/types"
import type { XMLRootPropertyRule } from "~/metadata/commonObjects/xmlRoot/types"
import { MetadataValuePropertyRule } from "~/metadata/commonObjects/metadataValue/types"
import { NumberPropertyRule } from "~/metadata/commonObjects/number/types"
import { PredefinedCodePropertyRule } from "~/metadata/commonObjects/predefinedCode/types"
import { StringOrNumberPropertyRule } from "~/metadata/commonObjects/stringOrNumber/types"
import type { WSDefinitionSchemasPropertyRule } from "~/metadata/commonObjects/wsDefinitionSchemas/types"
import type { TypeRulesOperations } from "./fn"

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

type DefaultValueFunction = (params: {
  context: ConfigurationContext
  name?: string
  operation: TypeRulesOperations
  yaml?: any
}) => any

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

  /** Значение, подразумеваемое отсутствием YAML-ключа; при выгрузке не пишется явно. */
  implicitValueYAML?: any | DefaultValueFunction

  /** Исключать неявное YAML-значение по модельному значению до преобразования типа. */
  omitImplicitValueYAMLBySource?: true

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
   * Может использоваться вместе с defaultValueXML: defaultValueXML чистит модель при импорте,
   * defaultValueXMLRaw восстанавливает точную пустую XML-форму при экспорте.
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

  /**
   * Для preserveFromReferenceXML: разрешить экспорт, когда reference-модель отсутствует.
   * Если reference есть, свойство всё равно экспортируется только при наличии в reference.
   */
  exportWithoutReferenceXML?: true

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
  metadataItemLinksXMLItem?: string

  /** Режим YAML-представления ссылок на роли. По умолчанию сохраняется полная ссылка. */
  roleReferenceYAML?: "full" | "name"

  /** Свойство используется только для построения референса */
  forReferenceOnly?: true

  /**
   * @deprecated Используется только старым sync форм и шаблонов до переноса на metadataTarget.
   * Новые правила должны использовать metadataTarget.
   */
  referenceScope?: ReferenceScope

  /**
   * Описание допустимой цели metadata-значения. Используется schema и validate.
   */
  metadataTarget?: MetadataTargetConstraint

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
  yaml: string
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
  allowedTypes?: TypeDescriptionAllowedTypes
}

export type DataPathAllowedKind = "boolean" | "dateTime" | "Picture" | "scalar" | "object" | "tableSource"

export interface DataPathPropertyRule extends BasePropertyRule {
  type: "DataPath"
  defaultType?: string
  allowedKinds?: readonly DataPathAllowedKind[]
  allowComposite?: boolean
  allowOpaqueMultipleValue?: boolean
}

export interface MetadataTypePropertyRule extends BasePropertyRule {
  type: "MetadataType" | "MetadataTypeCollection"
  typeValue: string
}

export interface InternalInfoPropertyRule extends BasePropertyRule {
  type: "InternalInfo"
  items?: Array<{ name: string; category: string }>
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
    | "ExternalFile"
    | "ExternalPicture"
    | "ExternalFormItemFile"
    | "WSDefinitionSchemas"
    | "FieldsList"
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
  | ExternalFilePropertyRule
  | ExternalFormItemFilePropertyRule
  | ExternalPicturePropertyRule
  | WSDefinitionSchemasPropertyRule
  | FieldsListPropertyRule

type PropertiesType = Record<string, PropertyRule>

export interface ItemXML {
  [key: string]: any
}

export interface UniqueNameScope {
  collections: readonly string[]
  message?: string
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

  /**
   * Коллекции, внутри которых имена дочерних элементов должны быть уникальны.
   */
  uniqueNameScopes?: readonly UniqueNameScope[]

  /** @deprecated */
  eventsTag?: string

  /**
   * значение xsi:type для элемента
   */
  xsiType?: string

  /**
   * Префикс типа объекта в предметном пути метаданных (например "Справочник" для MetadataCatalog).
   */
  itemTypePrefix?: string

  /**
   * Имя XML-папки в дампе конфигурации (например "Catalogs", "Documents", "DocumentNumerators", "Sequences").
   * Если задано — правило считается корневым и участвует в обходе configuration walker'а.
   * Если не задано — правило внутреннее (Command, Predefined и т.п.).
   */
  xmlDir?: string

  /**
   * Дочерние коллекции, которые оркестратор должен обойти для обработки Module/Template-свойств.
   * Ключ в модели (`propertyKey`) указывает на Record<itemName, itemData>;
   * `itemRule` содержит правила, в которых могут быть Module-свойства с функциональными путями.
   * `fileItemRule` задаёт полное правило с XMLRoot, если элемент коллекции пишется в отдельный XML-файл.
   * Пути вычисляются относительно корня владельца (того же outputDir/name/).
   */
  childCollections?: ReadonlyArray<{
    propertyKey: string
    itemRule: MetadataItemRule
    fileItemRule?: MetadataItemRule
    nkdkDir?: string | ((params: { name: string; parentName?: string }) => string)
    xmlDir?: string | ((params: { name: string; parentName?: string }) => string)
  }>
}
