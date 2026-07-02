import { fieldsListRule } from "~/metadata/commonObjects/fieldsList/types"
import { functionalOptionsPropertyRule } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { userVisibleRule } from "~/metadata/commonObjects/userVisible/types"
import {
  chartRule,
  dynamicListRule,
  flowchartContextRule,
  formAttributeAdditionalColumnsRule,
  formAttributeColumnsRule,
  ganttChartRule,
  plannerRule,
  spreadsheetDocumentRule,
} from "~/metadata/forms/commonObjects/formAttribute/builders"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const FormAttributeRules = {
  itemType: "FormAttribute",
  properties: {
    id: stringRule({
      xml: "_id",
      forReferenceOnly: true,
    }),
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    valueType: typeDescriptionRule({
      yaml: "ТипЗначения",
      xml: "Settings",
      order: 99,
      addTypeDescriptionAttributeToXML: true,
    }),
    title: i8nTextRule({
      yaml: "Заголовок",
      skipEmptyToXML: true,
      defaultValue: ({
        context,
        name,
        operation,
      }: {
        context: {
          defaultLanguage: string
        }
        name?: string
        operation: string
      }) => {
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
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      defaultValueXMLRaw: {},
      order: 2,
    }),
    mainAttribute: booleanRule({
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      implicitValueYAML: false,
      order: 5,
    }),
    storedData: booleanRule({
      yaml: "СохраняемыеДанные",
      xml: "SavedData",
      implicitValueYAML: false,
      order: 6,
    }),
    view: userVisibleRule({
      yaml: "Просмотр",
      order: 3,
    }),
    edit: userVisibleRule({
      yaml: "Редактирование",
      order: 4,
    }),
    fillCheck: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      typeSE: "FillChecking",
      implicitValueYAML: "DontCheck",
      order: 7,
    }),
    columns: formAttributeColumnsRule({
      yaml: "Колонки",
      fromXML: false,
      toXML: false,
      fromYAML: false,
      defaultValue: [],
    }),
    additionalColumns: formAttributeAdditionalColumnsRule({
      yaml: "ДополнительныеКолонки",
      fromXML: false,
      toXML: false,
      fromYAML: false,
    }),
    functionalOptions: functionalOptionsPropertyRule({
      yaml: "ФункциональныеОпции",
      order: 10,
    }),
    fieldsList: fieldsListRule({
      yaml: "ИспользоватьВсегда",
      xml: "UseAlways",
      order: 8,
    }),
    save: fieldsListRule({
      yaml: "Сохранение",
      order: 9,
    }),
    dynamicList: dynamicListRule({
      xml: "Settings",
      yaml: "ДинамическийСписок",
      order: 99,
    }),
    chart: chartRule({
      xml: "Settings",
      yaml: "Диаграмма",
      fromXML: false,
      toXML: false,
      order: 99,
    }),
    ganttChart: ganttChartRule({
      xml: "Settings",
      yaml: "ДиаграммаГанта",
      fromXML: false,
      toXML: false,
      order: 99,
    }),
    flowchartContext: flowchartContextRule({
      xml: "Settings",
      yaml: "ГрафическаяСхема",
      fromXML: false,
      toXML: false,
      order: 99,
    }),
    spreadsheetDocument: spreadsheetDocumentRule({
      xml: "Settings",
      yaml: "ТабличныйДокумент",
      fromXML: false,
      toXML: false,
      order: 99,
    }),
    planner: plannerRule({
      xml: "Settings",
      yaml: "Планировщик",
      fromXML: false,
      toXML: false,
      order: 99,
    }),
  },
} as const satisfies MetadataItemRule
export const FormAttributeColumnRules = {
  itemType: "FormAttributeColumn",
  properties: {
    id: stringRule({
      xml: "_id",
      forReferenceOnly: true,
    }),
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: i8nTextRule({
      yaml: "Заголовок",
      excludeIfEqualNameYAML: true,
      order: 2,
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      order: 3,
      defaultValueXMLRaw: {},
    }),
    view: userVisibleRule({
      yaml: "Просмотр",
      order: 4,
    }),
    edit: userVisibleRule({
      yaml: "Редактирование",
      order: 0,
    }),
    fillCheck: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      typeSE: "FillChecking",
      order: 1,
      implicitValueYAML: "DontCheck",
    }),
    functionalOptions: functionalOptionsPropertyRule({
      yaml: "ФункциональныеОпции",
      order: 5,
    }),
  },
} as const satisfies MetadataItemRule
