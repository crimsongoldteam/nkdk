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
      order: 10,
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
      order: 1,
    },
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
      defaultValueXMLRaw: {},
      order: 2,
    },

    mainAttribute: {
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      type: "boolean",
      order: 3,
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
      order: 4,
    },
    edit: {
      yaml: "РазрешитьРедактирование",
      yamlDeny: "ЗапретитьРедактирование",
      type: "UserVisible",
      order: 5,
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
      fromXML: false,
      toXML: false,
      fromYAML: false,
      defaultValue: [],
      required: true,
    },
    additionalColumns: {
      yaml: "ДополнительныеКолонки",
      type: "FormAttributeAdditionalColumns",
      fromXML: false,
      toXML: false,
      fromYAML: false,
    },

    functionalOptions: {
      yaml: "ФункциональныеОпции",
      type: "FunctionalOptionsProperty",
    },
    fieldsList: {
      yaml: "ИспользоватьВсегда",
      type: "FieldsList",
      xml: "UseAlways",
      order: 6,
    },
    save: {
      yaml: "Сохранение",
      type: "FieldsList",
      order: 7,
    },
    dynamicList: {
      type: "DynamicList",
      xml: "Settings",
      yaml: "ДинамическийСписок",
      order: 10,
    },
    chart: {
      type: "Chart",
      xml: "Settings",
      yaml: "Диаграмма",
      fromXML: false,
      toXML: false,
      order: 10,
    },
    ganttChart: {
      type: "GanttChart",
      xml: "Settings",
      yaml: "ДиаграммаГанта",
      fromXML: false,
      toXML: false,
      order: 10,
    },
    flowchartContext: {
      type: "FlowchartContext",
      xml: "Settings",
      yaml: "ГрафическаяСхема",
      fromXML: false,
      toXML: false,
      order: 10,
    },
    spreadsheetDocument: {
      type: "SpreadsheetDocument",
      xml: "Settings",
      yaml: "ТабличныйДокумент",
      fromXML: false,
      toXML: false,
      order: 10,
    },
    planner: {
      type: "Planner",
      xml: "Settings",
      yaml: "Планировщик",
      fromXML: false,
      toXML: false,
      order: 10,
    },
  },
} as const satisfies MetadataItemRule

export const FormAttributeColumnRules = {
  itemType: "FormAttributeColumn",
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
      defaultValueXMLRaw: {},
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
