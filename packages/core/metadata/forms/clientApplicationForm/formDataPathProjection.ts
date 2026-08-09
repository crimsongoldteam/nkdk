import { collectFormTabularElementsFromYAML } from "../../orchestration/formElement/formTableDataPaths"

export const clientApplicationFormDataPathProjection = {
  attributeItemType: "FormAttribute",
  columnItemType: "FormAttributeColumn",
  tabularElementItemTypes: ["Table"],
  attributesYaml: "Реквизиты",
  columnsYaml: "Колонки",
  typeYaml: "Тип",
  dynamicListYaml: "ДинамическийСписок",
  additionalColumnsYaml: "ДополнительныеКолонки",
  typePropertyKey: "type",
  dynamicListPropertyKey: "dynamicList",
  additionalColumnsPropertyKey: "additionalColumns",
  tableDataPathPropertyKey: "dataPath",
  collectTabularElementsFromYAML: collectFormTabularElementsFromYAML,
  dataPathDialect: {
    serviceRoot: { internal: "Items", yaml: "Элементы" },
    currentRow: { internal: "CurrentData", yaml: "ТекущиеДанные" },
  },
} as const
