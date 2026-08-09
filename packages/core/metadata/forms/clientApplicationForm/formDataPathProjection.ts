import { collectFormTableDataPathsFromYAML } from "../../orchestration/formElement/formTableDataPaths"

export const clientApplicationFormDataPathProjection = {
  attributeItemType: "FormAttribute",
  columnItemType: "FormAttributeColumn",
  tableItemType: "Table",
  attributesYaml: "Реквизиты",
  columnsYaml: "Колонки",
  typeYaml: "Тип",
  dynamicListYaml: "ДинамическийСписок",
  additionalColumnsYaml: "ДополнительныеКолонки",
  typePropertyKey: "type",
  dynamicListPropertyKey: "dynamicList",
  additionalColumnsPropertyKey: "additionalColumns",
  tableDataPathPropertyKey: "dataPath",
  collectTableDataPathsFromYAML: collectFormTableDataPathsFromYAML,
} as const
