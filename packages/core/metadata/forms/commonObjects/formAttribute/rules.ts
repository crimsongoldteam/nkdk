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
      order: 99,
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
      defaultValueXMLRaw: {},
      order: 2,
    },

    mainAttribute: {
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      type: "boolean",
      order: 5,
    },
    storedData: {
      yaml: "СохраняемыеДанные",
      xml: "SavedData",
      type: "boolean",
      order: 6,
    },
    view: {
      yaml: "Просмотр",
      type: "UserVisible",
      order: 3,
    },
    edit: {
      yaml: "Редактирование",
      type: "UserVisible",
      order: 4,
    },
    fillCheck: {
      yaml: "ПроверкаЗаполнения",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      defaultValueYAML: "DontCheck",
      order: 7,
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
      order: 10,
    },
    fieldsList: {
      yaml: "ИспользоватьВсегда",
      type: "FieldsList",
      xml: "UseAlways",
      order: 8,
    },
    save: {
      yaml: "Сохранение",
      type: "FieldsList",
      order: 9,
    },
    dynamicList: {
      type: "DynamicList",
      xml: "Settings",
      yaml: "ДинамическийСписок",
      order: 99,
    },
    chart: {
      type: "Chart",
      xml: "Settings",
      yaml: "Диаграмма",
      fromXML: false,
      toXML: false,
      order: 99,
    },
    ganttChart: {
      type: "GanttChart",
      xml: "Settings",
      yaml: "ДиаграммаГанта",
      fromXML: false,
      toXML: false,
      order: 99,
    },
    flowchartContext: {
      type: "FlowchartContext",
      xml: "Settings",
      yaml: "ГрафическаяСхема",
      fromXML: false,
      toXML: false,
      order: 99,
    },
    spreadsheetDocument: {
      type: "SpreadsheetDocument",
      xml: "Settings",
      yaml: "ТабличныйДокумент",
      fromXML: false,
      toXML: false,
      order: 99,
    },
    planner: {
      type: "Planner",
      xml: "Settings",
      yaml: "Планировщик",
      fromXML: false,
      toXML: false,
      order: 99,
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
      yaml: "Просмотр",
      type: "UserVisible",
      order: 4,
    },
    edit: {
      yaml: "Редактирование",
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
