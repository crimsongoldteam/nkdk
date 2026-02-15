import { MetadataItemRule, PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { ElementRule } from "../../metadataFactory/elementRulesFactory"
import { FormAttribute, FormAttributeColumn } from "./types"
export type { ElementRule, PropertyRule }

export const FormAttributeRules: MetadataItemRule<FormAttribute> = {
  properties: {
    title: {
      yaml: "Заголовок",
      type: "I8nText",
    },
    valueType: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
    },
    mainAttribute: {
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      type: "boolean",
    },
    storedData: {
      yaml: "СохраняемыеДанные",
      xml: "SavedData",
      type: "boolean",
    },
    view: {
      yaml: "РазрешитьПросмотр",
      yamlDeny: "ЗапретитьПросмотр",
      type: "UserVisible",
    },
    edit: {
      yaml: "РазрешитьРедактирование",
      yamlDeny: "ЗапретитьРедактирование",
      type: "UserVisible",
    },
    fillCheck: {
      yaml: "ПроверкаЗаполнения",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
    },
    settings: {
      yaml: "Настройки",
      type: "TypeDescription",
    },
    columns: {
      yaml: "Колонки",
      type: "FormAttributeColumns",
      defaultValue: [],
    },
    additionalColumns: {
      yaml: "ДополнительныеКолонки",
      type: "FormAttributeAdditionalColumns",
      defaultValue: [],
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
    fieldsList: {
      yaml: "ИспользоватьВсегда",
      type: "FieldsList",
      xml: "UseAlways",
    },
    save: {
      yaml: "Сохранение",
      type: "FieldsList",
    },
  },
}

// registerElementRule("FormAttribute", FormAttributeRules)

export const FormAttributeColumnRules: MetadataItemRule<FormAttributeColumn> = {
  properties: {
    title: {
      yaml: "Заголовок",
      type: "I8nText",
    },
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
    },
    view: {
      yaml: "РазрешитьПросмотр",
      yamlDeny: "ЗапретитьПросмотр",
      type: "UserVisible",
    },
    edit: {
      yaml: "РазрешитьРедактирование",
      yamlDeny: "ЗапретитьРедактирование",
      type: "UserVisible",
    },
    fillCheck: {
      yaml: "ПроверкаЗаполнения",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
  },
} as const
