import { CollectableElementType } from "../../../orchestration"

export const childItemsTreePropertyTypes = [
  "GroupChildItems",
  "CommandBarChildItems",
  "TableChildItems",
  "PagesChildItems",
] as const

export type ChildItemsTreePropertyType = (typeof childItemsTreePropertyTypes)[number]

const childItemTypesByPropertyType = {
  GroupChildItems: [
    "Button",
    "CalendarField",
    "ChartField",
    "CheckBoxField",
    "CommandBar",
    "DendrogramField",
    "FormattedDocumentField",
    "GanttChartField",
    "GeographicalSchemaField",
    "GraphicalSchemaField",
    "HTMLDocumentField",
    "InputField",
    "LabelDecoration",
    "LabelField",
    "Pages",
    "PDFDocumentField",
    "PeriodField",
    "PictureDecoration",
    "PictureField",
    "PlannerField",
    "ProgressBarField",
    "RadioButtonField",
    "SearchControlAddition",
    "SearchStringAddition",
    "SpreadSheetDocumentField",
    "Table",
    "TextDocumentField",
    "TrackBarField",
    "UsualGroup",
    "ViewStatusAddition",
  ],
  CommandBarChildItems: [
    "Button",
    "CommandBarButton",
    "ButtonGroup",
    "Popup",
    "SearchStringAddition",
    "SearchControlAddition",
    "ViewStatusAddition",
  ],
  TableChildItems: ["TableCheckBoxField", "ColumnGroup", "TableInputField", "TableLabelField", "TablePictureField"],
  PagesChildItems: ["Page"],
} as const satisfies Record<ChildItemsTreePropertyType, readonly CollectableElementType[]>

export const getChildItemTypesByPropertyType = (
  propertyType: ChildItemsTreePropertyType
): readonly CollectableElementType[] => {
  return childItemTypesByPropertyType[propertyType]
}

export const getTreeNodeJSONSchemaPropertyAliases = (itemType: CollectableElementType): Record<string, string> => {
  return isButtonElementType(itemType) ? { Вид: "ТипКнопки" } : {}
}

export const moveButtonTypeToTreeYAML = (params: {
  itemType: CollectableElementType
  yaml: Record<string, unknown> | undefined
}): Record<string, unknown> => {
  const result = { ...(params.yaml ?? {}) }
  if (isButtonElementType(params.itemType) && result.Вид !== undefined) {
    result.ТипКнопки = result.Вид
    delete result.Вид
  }
  return result
}

const isButtonElementType = (itemType: CollectableElementType): itemType is "Button" | "CommandBarButton" => {
  return itemType === "Button" || itemType === "CommandBarButton"
}
