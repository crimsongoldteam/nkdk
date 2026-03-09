import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const FormAttributeRules = {
  itemType: "FormAttribute",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
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
    valueType: {
      yaml: "ТипЗначения",
      type: "TypeDescription",
      xml: "Settings",
      addTypeDescriptionAttributeToXML: true,
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
} as const satisfies MetadataItemRule
