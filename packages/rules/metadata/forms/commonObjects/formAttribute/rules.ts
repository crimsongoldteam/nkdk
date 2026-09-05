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
import { createNamedFormItemOutputPreparation, defineMetadataRules, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { defineMetadataItemCollectionRule } from "../../../ruleRuntime/metadataCollection/ruleFactory"
import { restoreKnownDuplicateErpAdditionalColumns } from "../../knownAnomalies"
import { formAttributeValueTypeDefault } from "./valueListSettings"

const formAttributeTitleRule = i8nTextRule({
  yaml: "Заголовок",
  skipEmptyToXML: true,
  defaultValue: ({
    context,
    name,
    operation,
  }: {
    context: {
      languages: { readonly default: string }
    }
    name?: string
    operation: string
  }) => {
    if (operation === "importFromXML") {
      return {
        items: { [context.languages.default]: "" },
      }
    }
    if (name === undefined) throw new Error("name is required for title default value")
    return {
      items: { [context.languages.default]: splitPascalCase(name) },
    }
  },
  excludeIfEqualNameYAML: true,
})

const formAttributeViewRule = userVisibleRule({
  yaml: "Просмотр",
  metadataTarget: { kind: "object", roots: ["Role"] },
})

const formAttributeEditRule = userVisibleRule({
  yaml: "Редактирование",
  metadataTarget: { kind: "object", roots: ["Role"] },
})

const formAttributeFillCheckRule = systemEnumerationRule({
  yaml: "ПроверкаЗаполнения",
  typeSE: "FillChecking",
  implicitValueYAML: "DontCheck",
})

export const FormAttributeRules = {
  itemType: "FormAttribute",
  xmlOrder: [
    "title",
    "type",
    "view",
    "edit",
    "mainAttribute",
    "storedData",
    "fillCheck",
    "fieldsList",
    "save",
    "functionalOptions",
    "columns",
    "additionalColumns",
    "valueType",
    "dynamicList",
    "chart",
    "ganttChart",
    "flowchartContext",
    "spreadsheetDocument",
    "planner",
    "name",
    "id",
  ],
  properties: {
    id: stringRule({
      xml: "_id",
      xmlOnly: true,
    }),
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    valueType: typeDescriptionRule({
      yaml: "ТипЗначения",
      xml: "Settings",
      addTypeDescriptionAttributeToXML: true,
      defaultValueXMLEmpty: { type: [] },
      defaultValue: formAttributeValueTypeDefault,
      preserveEmptyXML: true,
    }),
    title: formAttributeTitleRule,
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      defaultValueXMLRaw: {},
    }),
    mainAttribute: booleanRule({
      yaml: "ОсновнойРеквизит",
      xml: "MainAttribute",
      implicitValueYAML: false,
    }),
    storedData: booleanRule({
      yaml: "СохраняемыеДанные",
      xml: "SavedData",
      implicitValueYAML: false,
    }),
    view: formAttributeViewRule,
    edit: formAttributeEditRule,
    fillCheck: formAttributeFillCheckRule,
    columns: formAttributeColumnsRule({
      yaml: "Колонки",
      xml: "Column",
      xmlParents: ["Columns"],
      fromYAML: false,
      defaultValue: [],
    }),
    additionalColumns: formAttributeAdditionalColumnsRule({
      yaml: "ДополнительныеКолонки",
      xml: "AdditionalColumns",
      xmlParents: ["Columns"],
      fromYAML: false,
    }),
    functionalOptions: functionalOptionsPropertyRule({
      yaml: "ФункциональныеОпции",
      metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
    }),
    fieldsList: fieldsListRule({
      yaml: "ИспользоватьВсегда",
      xml: "UseAlways",
    }),
    save: fieldsListRule({
      yaml: "Сохранение",
    }),
    dynamicList: dynamicListRule({
      xml: "Settings",
      yaml: "ДинамическийСписок",
    }),
    chart: chartRule({
      xml: "Settings",
      yaml: "Диаграмма",
    }),
    ganttChart: ganttChartRule({
      xml: "Settings",
      yaml: "ДиаграммаГанта",
    }),
    flowchartContext: flowchartContextRule({
      xml: "Settings",
      yaml: "ГрафическаяСхема",
    }),
    spreadsheetDocument: spreadsheetDocumentRule({
      xml: "Settings",
      yaml: "ТабличныйДокумент",
    }),
    planner: plannerRule({
      xml: "Settings",
      yaml: "Планировщик",
    }),
  },
} as const satisfies MetadataItemRule

export const FormAttributeColumnRules = {
  itemType: "FormAttributeColumn",
  xmlOrder: [
    "title",
    "type",
    "view",
    "edit",
    "fillCheck",
    "functionalOptions",
    "name",
    "id",
  ],
  properties: {
    id: stringRule({
      xml: "_id",
      xmlOnly: true,
    }),
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: formAttributeTitleRule,
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "Type",
      defaultValueXMLRaw: {},
    }),
    view: formAttributeViewRule,
    edit: formAttributeEditRule,
    fillCheck: formAttributeFillCheckRule,
    functionalOptions: functionalOptionsPropertyRule({
      yaml: "ФункциональныеОпции",
      metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
    }),
  },
} as const satisfies MetadataItemRule

export const FormAttributeAdditionalColumnRules = {
  itemType: "FormAttributeAdditionalColumn",
  properties: {
    table: stringRule({ xml: "_table", required: true }),
    columns: formAttributeColumnsRule({ yaml: "Колонки", yamlInline: true, xml: "Column" }),
  },
} as const satisfies MetadataItemRule

const formAttributes = defineMetadataItemCollectionRule({
  propertyType: "FormAttributes",
  itemRule: FormAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  configurationIndexUidSegment: "Атрибут",
  requiredIdentity: "xmlId",
})

export const metadataRuleLayer000 = defineMetadataRules({
  ...formAttributes,
  propertyTypes: {
    ...formAttributes.propertyTypes,
    FormAttributes: {
      ...formAttributes.propertyTypes.FormAttributes,
      prepareXMLItemOutput: createNamedFormItemOutputPreparation("attributes"),
    },
  },
  dependentItems: {
    ...formAttributes.dependentItems,
    FormAttribute: { imported: {
      propertyKeys: ["valueType"],
      dependencies: { item: ["Тип"], root: [] },
      shouldRemove: ({ item }) => item.Тип !== "СписокЗначений",
    } },
  },
})

const attributeColumns = defineMetadataItemCollectionRule({
  propertyType: "FormAttributeColumns",
  itemRule: FormAttributeColumnRules,
  xmlElement: "Column",
  keyField: "name",
  configurationIndexUidSegment: "Колонка",
  requiredIdentity: "xmlId",
})

export const metadataRuleLayer001 = defineMetadataRules({
  ...attributeColumns,
  propertyTypes: {
    ...attributeColumns.propertyTypes,
    FormAttributeColumns: {
      ...attributeColumns.propertyTypes.FormAttributeColumns,
      prepareXMLItemOutput: createNamedFormItemOutputPreparation("attributes"),
    },
  },
})

const additionalColumns = defineMetadataItemCollectionRule({
  propertyType: "FormAttributeAdditionalColumns",
  itemRule: FormAttributeAdditionalColumnRules,
  xmlElement: "AdditionalColumns",
  keyField: "table",
  configurationIndexUidSegment: "ДополнительныеКолонки",
})

export const metadataRuleLayer002 = defineMetadataRules({
  ...additionalColumns,
  propertyTypes: {
    ...additionalColumns.propertyTypes,
    FormAttributeAdditionalColumns: {
      ...additionalColumns.propertyTypes.FormAttributeAdditionalColumns,
      prepareXMLItemOutput: ({ context, name }) => ({
        attributes: (own) => own,
        routeProperty: ({ propertyKey, path, value }) => {
          if (propertyKey !== "columns") return { path, value }
          const columns = Array.isArray(value) ? value : value === undefined ? [] : [value]
          const firstColumn = columns[0]
          if (firstColumn === null || typeof firstColumn !== "object" || Array.isArray(firstColumn)) return { path, value }
          const column = firstColumn as Record<string, unknown>
          const restored = restoreKnownDuplicateErpAdditionalColumns({
            currentXMLPath: context.exportToXML.context?.currentXMLPath,
            table: name ?? "",
            columnName: typeof column._name === "string" ? column._name : undefined,
            columnsCount: columns.length,
            column,
          })
          return { path, value: restored ?? value }
        },
      }),
    },
  },
})
