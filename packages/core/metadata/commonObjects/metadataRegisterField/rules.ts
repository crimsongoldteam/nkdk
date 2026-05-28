import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { PropertyRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const emptySynonym = { items: {} }
const registerParentItemTypes = [
  "MetadataAccumulationRegister",
  "MetadataInformationRegister",
  "MetadataAccountingRegister",
  "MetadataCalculationRegister",
] as const

const getRegisterParentItemType = (context?: ConfigurationContextWithExportToXML): string | undefined => {
  if (!context) return undefined
  const parent = getParentFromContext(context, [...registerParentItemTypes] as never[])
  return registerParentItemTypes.includes(parent.itemType as (typeof registerParentItemTypes)[number])
    ? parent.itemType
    : undefined
}

const isMetadataRegisterResource = (context?: ConfigurationContextWithExportToXML): boolean =>
  context ? getParentFromContext(context).itemType === "MetadataRegisterResource" : false

const exportInformationRegisterOrExplicit =
  (propertyKey: string) =>
  (metadataItem: unknown, context?: ConfigurationContextWithExportToXML): boolean => {
    const parentItemType = getRegisterParentItemType(context)
    if (parentItemType === undefined) return true
    if (parentItemType === "MetadataInformationRegister") return true
    return (
      metadataItem !== null &&
      metadataItem !== undefined &&
      typeof metadataItem === "object" &&
      Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)
    )
  }

export const commonRegisterFieldProperties = {
  uuid: uuidPropertyRule,
  name: {
    xml: "Name",
    type: "string",
    required: true,
    xmlParents: propertiesParents,
    order: 1,
  },
  synonym: {
    yaml: "Синоним",
    xml: "Synonym",
    type: "I8nText",
    excludeIfEqualNameYAML: true,
    defaultValue: ({
      context,
      yaml,
      name,
      operation,
    }: {
      context: ConfigurationContext
      yaml?: unknown
      name?: string
      operation?: string
    }) =>
      operation === "importFromYAML" && name && yaml !== null && typeof yaml === "object" && !Array.isArray(yaml)
        ? addDefaultLanguageNameToSynonym(context, undefined, name)
        : emptySynonym,
    defaultValueXMLEmpty: emptySynonym,
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    emptyAsRawXML: true,
    order: 2,
  },
  comment: {
    yaml: "Комментарий",
    xml: "Comment",
    type: "string",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 3,
  },
  type: {
    yaml: "Тип",
    type: "TypeDescription",
    xml: "Type",
    useAsShortValueYAML: true,
    xmlParents: propertiesParents,
    order: 4,
  },
  passwordMode: {
    yaml: "РежимПароля",
    xml: "PasswordMode",
    type: "boolean",
    defaultValueXML: false,
    xmlParents: propertiesParents,
    order: 5,
  },
  format: {
    yaml: "Формат",
    xml: "Format",
    type: "I8nText",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 6,
  },
  editFormat: {
    yaml: "ФорматРедактирования",
    xml: "EditFormat",
    type: "I8nText",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 7,
  },
  toolTip: {
    yaml: "Подсказка",
    xml: "ToolTip",
    type: "I8nText",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 8,
  },
  markNegatives: {
    yaml: "ВыделятьОтрицательные",
    xml: "MarkNegatives",
    type: "boolean",
    defaultValueXML: false,
    xmlParents: propertiesParents,
    order: 9,
  },
  mask: {
    yaml: "Маска",
    xml: "Mask",
    type: "string",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 10,
  },
  multiLine: {
    yaml: "МногострочныйРежим",
    xml: "MultiLine",
    type: "boolean",
    defaultValueXML: false,
    xmlParents: propertiesParents,
    order: 11,
  },
  extendedEdit: {
    yaml: "РасширенноеРедактирование",
    xml: "ExtendedEdit",
    type: "boolean",
    defaultValueXML: false,
    xmlParents: propertiesParents,
    order: 12,
  },
  minValue: {
    yaml: "МинимальноеЗначение",
    xml: "MinValue",
    type: "MinMaxValue",
    xmlParents: propertiesParents,
    typedXML: "xs:string",
    defaultValueXMLRaw: { "_xsi:nil": true },
    order: 13,
  },
  maxValue: {
    yaml: "МаксимальноеЗначение",
    xml: "MaxValue",
    type: "MinMaxValue",
    xmlParents: propertiesParents,
    typedXML: "xs:string",
    defaultValueXMLRaw: { "_xsi:nil": true },
    order: 14,
  },
  fillFromFillingValue: {
    yaml: "ЗаполнятьИзДанныхЗаполнения",
    xml: "FillFromFillingValue",
    type: "boolean",
    defaultValueXML: false,
    xmlParents: propertiesParents,
    toXML: exportInformationRegisterOrExplicit("fillFromFillingValue"),
    order: 15,
  },
  fillValue: {
    yaml: "ЗначениеЗаполнения",
    xml: "FillValue",
    type: "MetadataValue",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: { "_xsi:nil": true },
    toXML: exportInformationRegisterOrExplicit("fillValue"),
    order: 16,
  },
  fillChecking: {
    yaml: "ПроверкаЗаполнения",
    xml: "FillChecking",
    type: "SystemEnumeration",
    typeSE: "FillChecking",
    defaultValueXML: "DontCheck",
    defaultValueYAML: "DontCheck",
    xmlParents: propertiesParents,
    order: 17,
  },
  choiceFoldersAndItems: {
    yaml: "ВыборГруппИЭлементов",
    xml: "ChoiceFoldersAndItems",
    type: "SystemEnumeration",
    typeSE: "FoldersAndItemsUse",
    defaultValueXML: "Items",
    defaultValueYAML: "Items",
    xmlParents: propertiesParents,
    order: 18,
  },
  choiceParameterLinks: {
    yaml: "СвязиПараметровВыбора",
    xml: "ChoiceParameterLinks",
    type: "ChoiceParameterLinks",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 19,
  },
  choiceParameters: {
    yaml: "ПараметрыВыбора",
    xml: "ChoiceParameters",
    type: "ChoiceParameters",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 20,
  },
  quickChoice: {
    yaml: "БыстрыйВыбор",
    xml: "QuickChoice",
    type: "SystemEnumeration",
    typeSE: "UseQuickChoice",
    defaultValueXML: "Auto",
    defaultValueYAML: "Auto",
    xmlParents: propertiesParents,
    order: 21,
  },
  createOnInput: {
    yaml: "СозданиеПриВводе",
    xml: "CreateOnInput",
    type: "SystemEnumeration",
    typeSE: "CreateOnInput",
    defaultValueXML: "Auto",
    defaultValueYAML: "Auto",
    xmlParents: propertiesParents,
    order: 22,
  },
  choiceForm: {
    yaml: "ФормаВыбора",
    xml: "ChoiceForm",
    type: "string",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 23,
  },
  linkByType: {
    yaml: "СвязьПоТипу",
    xml: "LinkByType",
    type: "TypeLink",
    xmlParents: propertiesParents,
    defaultValueXMLRaw: "",
    order: 24,
  },
  choiceHistoryOnInput: {
    yaml: "ИсторияВыбораПриВводе",
    xml: "ChoiceHistoryOnInput",
    type: "SystemEnumeration",
    typeSE: "ChoiceHistoryOnInput",
    defaultValueXML: "Auto",
    defaultValueYAML: "Auto",
    xmlParents: propertiesParents,
    order: 25,
  },
  indexing: {
    yaml: "Индексирование",
    xml: "Indexing",
    type: "SystemEnumeration",
    typeSE: "Indexing",
    defaultValueXML: "DontIndex",
    defaultValueYAML: "DontIndex",
    xmlParents: propertiesParents,
    toXML: (metadataItem: unknown, context?: ConfigurationContextWithExportToXML): boolean => {
      const parentItemType = getRegisterParentItemType(context)
      if (parentItemType === undefined) return true
      if (parentItemType === "MetadataInformationRegister") return true
      if (!isMetadataRegisterResource(context)) return true
      return (
        metadataItem !== null &&
        metadataItem !== undefined &&
        typeof metadataItem === "object" &&
        Object.prototype.hasOwnProperty.call(metadataItem, "indexing")
      )
    },
    order: 27,
  },
  fullTextSearch: {
    yaml: "ПолнотекстовыйПоиск",
    xml: "FullTextSearch",
    type: "SystemEnumeration",
    typeSE: "UseFullTextSearch",
    defaultValueXML: "Use",
    defaultValueYAML: "Use",
    xmlParents: propertiesParents,
    order: 28,
  },
  dataHistory: {
    yaml: "ИсторияДанных",
    xml: "DataHistory",
    type: "SystemEnumeration",
    typeSE: "DataHistoryUse",
    defaultValueXML: "Use",
    defaultValueYAML: "Use",
    xmlParents: propertiesParents,
    toXML: exportInformationRegisterOrExplicit("dataHistory"),
    order: 29,
  },
  binaryDataStorageLocationUse: {
    yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUse",
    type: "SystemEnumeration",
    typeSE: "BinaryDataStorageLocationUse",
    xmlParents: propertiesParents,
    order: 30,
  },
  binaryDataStorageLocationUseField: {
    yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
    xml: "BinaryDataStorageLocationUseField",
    type: "string",
    xmlParents: propertiesParents,
    order: 31,
  },
  objectBelonging: {
    yaml: "ПринадлежностьОбъекта",
    xml: "ObjectBelonging",
    type: "SystemEnumeration",
    typeSE: "ObjectBelonging",
    defaultValueYAML: "Native",
    toYAML: false,
    fromYAML: false,
    xmlParents: propertiesParents,
  },
  extendedConfigurationObject: {
    xml: "ExtendedConfigurationObject",
    type: "string",
    xmlParents: propertiesParents,
    runtimeOnly: true,
  },
} as const satisfies Record<string, PropertyRule>
