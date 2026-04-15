import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const FormAttributeRules = {
  itemType: "FormAttribute",
  properties: {
    id: {
      xml: "_id",
      type: "string",
      forReferenceOnly: true,
    },
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    valueType: {
      yaml: "ТипЗначения",
      type: "TypeDescription",
      xml: "Settings",
      order: 0,
      addTypeDescriptionAttributeToXML: true,
    },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      skipEmptyToXML: true,
      defaultValue: ({ context, name, operation }) => {
        if (operation === "importFromXML") {
          return {
            items: { [context.defaultLanguage]: "" },
          }
        }
        if (name === undefined) throw new Error("name is required for title default value")
        return {
          items: { [context.defaultLanguage]: splitPascalCase(name) },
        }
      },

      excludeIfEqualNameYAML: true,
    },
    type: {
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
      defaultValueYAML: "DontCheck",
    },
    columns: {
      yaml: "Колонки",
      type: "FormAttributeColumns",
      fromYAML: false,
      defaultValue: [],
      required: true,
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
    dynamicList: {
      type: "DynamicList",
      xml: "Settings",
      yaml: "ДинамическийСписок",
    },
  },
} as const satisfies MetadataItemRule

export const FormAttributeColumnRules = {
  itemType: "FormAttributeColumn",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      excludeIfEqualNameYAML: true,
      order: 2,
      // defaultValue: (context: ConfigurationContext) => {
      //   return {
      //     items: { [context.defaultLanguage]: "" },
      //   }
      // },
    },
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      order: 3,
    },
    view: {
      yaml: "РазрешитьПросмотр",
      yamlDeny: "ЗапретитьПросмотр",
      type: "UserVisible",
      order: 4,
    },
    edit: {
      yaml: "РазрешитьРедактирование",
      yamlDeny: "ЗапретитьРедактирование",
      type: "UserVisible",
      order: 0,
    },
    fillCheck: {
      yaml: "ПроверкаЗаполнения",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      order: 1,
      defaultValueYAML: "DontCheck",
    },
    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
      order: 5,
    },
  },
} as const satisfies MetadataItemRule
