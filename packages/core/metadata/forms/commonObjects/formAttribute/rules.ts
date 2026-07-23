import { fieldsListRule } from "../../../commonObjects/fieldsList/types"
import { functionalOptionsPropertyRule } from "../../../commonObjects/functionalOptionsProperty/types"
import { typeDescriptionRule } from "../../../commonObjects/typeDescription/types"
import { userVisibleRule } from "../../../commonObjects/userVisible/types"
import {
  chartRule,
  dynamicListRule,
  flowchartContextRule,
  formAttributeAdditionalColumnsRule,
  formAttributeColumnsRule,
  ganttChartRule,
  plannerRule,
  spreadsheetDocumentRule,
} from "./builders"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { i8nTextRule } from "../../../commonObjects/i8nText/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { splitPascalCase } from "../../../helpers/canConvertToPascalCase"
import type { MetadataItemRule } from "../../../orchestration/property/types"
import { registerMetadataItemCollectionRule } from "../../../orchestration/metadataCollection/ruleFactory"
import { restoreKnownDuplicateErpAdditionalColumns } from "../../knownAnomalies"
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
      xml: "Column",
      xmlParents: ["Columns"],
      fromXML: false,
      fromYAML: false,
      defaultValue: [],
    }),
    additionalColumns: formAttributeAdditionalColumnsRule({
      yaml: "ДополнительныеКолонки",
      xml: "AdditionalColumns",
      xmlParents: ["Columns"],
      fromXML: false,
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
      order: 99,
    }),
    ganttChart: ganttChartRule({
      xml: "Settings",
      yaml: "ДиаграммаГанта",
      fromXML: false,
      order: 99,
    }),
    flowchartContext: flowchartContextRule({
      xml: "Settings",
      yaml: "ГрафическаяСхема",
      fromXML: false,
      order: 99,
    }),
    spreadsheetDocument: spreadsheetDocumentRule({
      xml: "Settings",
      yaml: "ТабличныйДокумент",
      fromXML: false,
      order: 99,
    }),
    planner: plannerRule({
      xml: "Settings",
      yaml: "Планировщик",
      fromXML: false,
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

const FormAttributeAdditionalColumnRules = {
  itemType: "FormAttributeAdditionalColumn",
  properties: {
    table: stringRule({ xml: "_table", required: true }),
    columns: formAttributeColumnsRule({ yaml: "Колонки", yamlInline: true, xml: "Column" }),
  },
} as const satisfies MetadataItemRule

registerMetadataItemCollectionRule({
  propertyType: "FormAttributes",
  itemRule: FormAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  mapItemOutput: ({ xml }) => {
    const { _name, _id, ...properties } = xml
    return { _name, _id: typeof _id === "string" ? _id : "", ...properties }
  },
})

registerMetadataItemCollectionRule({
  propertyType: "FormAttributeColumns",
  itemRule: FormAttributeColumnRules,
  xmlElement: "Column",
  keyField: "name",
  mapItemOutput: ({ xml }) => {
    const { _name, _id, ...properties } = xml
    return { _name, _id: typeof _id === "string" ? _id : "", ...properties }
  },
})

registerMetadataItemCollectionRule({
  propertyType: "FormAttributeAdditionalColumns",
  itemRule: FormAttributeAdditionalColumnRules,
  xmlElement: "AdditionalColumns",
  keyField: "table",
  mapItemOutput: ({ xml, context }) => {
    const table = typeof xml._table === "string" ? xml._table : ""
    const columns = Array.isArray(xml.Column) ? xml.Column : xml.Column === undefined ? [] : [xml.Column]
    const firstColumn = columns[0]
    if (firstColumn === null || typeof firstColumn !== "object" || Array.isArray(firstColumn)) return xml
    const name = typeof firstColumn._name === "string" ? firstColumn._name : undefined
    const restored = restoreKnownDuplicateErpAdditionalColumns({
      currentXMLPath: context.exportToXML.context?.currentXMLPath,
      table,
      columnName: name,
      columnsCount: columns.length,
      column: firstColumn,
    })
    return restored === undefined ? xml : { ...xml, Column: restored }
  },
})
