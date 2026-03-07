import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataAttributeRules = {
  itemType: "MetadataAttribute",
  properties: {
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      excludeIfEqualNameYAML: true,
      defaultValue: ({ context }) => ({
        items: { [context.defaultLanguage]: "" },
      }),
    },
    name: {
      xml: "Name",
      type: "string",
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
    },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AttributeUse",
    },
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
    },
    format: {
      yaml: "Формат",
      xml: "Format",
      type: "I8nText",
    },
    editFormat: {
      yaml: "ФорматРедактирования",
      xml: "EditFormat",
      type: "I8nText",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
    },
    minValue: {
      yaml: "МинимальноеЗначение",
      xml: "MinValue",
      type: "number",
    },
    maxValue: {
      yaml: "МаксимальноеЗначение",
      xml: "MaxValue",
      type: "number",
    },
    mask: {
      yaml: "Маска",
      xml: "Mask",
      type: "string",
    },
    multiLine: {
      yaml: "МногострочныйРежим",
      xml: "MultiLine",
      type: "boolean",
    },
    extendedEdit: {
      yaml: "РасширенноеРедактирование",
      xml: "ExtendedEdit",
      type: "boolean",
    },
    passwordMode: {
      yaml: "РежимПароля",
      xml: "PasswordMode",
      type: "boolean",
    },
    markNegatives: {
      yaml: "ВыделятьОтрицательные",
      xml: "MarkNegatives",
      type: "boolean",
    },
    fillValue: {
      yaml: "ЗначениеЗаполнения",
      xml: "FillValue",
      type: "MetadataValue",
    },
    fillFromFillingValue: {
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "FillFromFillingValue",
      type: "boolean",
    },
    indexing: {
      yaml: "Индексирование",
      xml: "Indexing",
      type: "SystemEnumeration",
      typeSE: "Indexing",
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
    },
    choiceForm: {
      yaml: "ФормаВыбора",
      xml: "ChoiceForm",
      type: "string",
    },
    choiceFoldersAndItems: {
      yaml: "ВыборГруппИЭлементов",
      xml: "ChoiceFoldersAndItems",
      type: "SystemEnumeration",
      typeSE: "FoldersAndItemsUse",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      xml: "ChoiceHistoryOnInput",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      xml: "QuickChoice",
      type: "SystemEnumeration",
      typeSE: "UseQuickChoice",
    },
    createOnInput: {
      yaml: "СозданиеПриВводе",
      xml: "CreateOnInput",
      type: "SystemEnumeration",
      typeSE: "CreateOnInput",
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      xml: "ChoiceParameters",
      type: "ChoiceParameters",
    },
    choiceParameterLinks: {
      yaml: "СвязиПараметровВыбора",
      xml: "ChoiceParameterLinks",
      type: "ChoiceParameterLinks",
    },
    linkByType: {
      yaml: "СвязьПоТипу",
      xml: "LinkByType",
      type: "TypeLink",
    },
    binaryDataStorageLocationUse: {
      yaml: "ИспользованиеХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUse",
      type: "SystemEnumeration",
      typeSE: "BinaryDataStorageLocationUse",
    },
    binaryDataStorageLocationUseField: {
      yaml: "ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      xml: "BinaryDataStorageLocationUseField",
      type: "boolean",
    },
  },
} as const satisfies MetadataItemRule
