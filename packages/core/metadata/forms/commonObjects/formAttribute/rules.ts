import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/metadataFactory/properties/types"
import { FormAttribute, FormAttributeColumn } from "./types"

export const FormAttributeRules: MetadataItemRule<FormAttribute> = {
  properties: {
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      skipEmptyToXML: true,
      defaultValue: (context: ConfigurationContext) => {
        return {
          items: { [context.defaultLanguage]: "" },
        }
      },
      excludeIfEqualNameYAML: true,
    },
    valueType: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
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
      yaml: "ТипЗначения",
      type: "FormAttributeSettings",
    },
    columns: {
      yaml: "Колонки",
      type: "FormAttributeColumns",
      defaultValue: [],
    },
    additionalColumns: {
      yaml: "ДополнительныеКолонки",
      type: "FormAttributeAdditionalColumns",
      xml: "Columns",
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
      excludeIfEqualNameYAML: true,
      defaultValue: (context: ConfigurationContext) => {
        return {
          items: { [context.defaultLanguage]: "" },
        }
      },
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
