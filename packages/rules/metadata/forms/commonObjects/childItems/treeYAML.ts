import { CollectableElementType } from "../../../ruleRuntime"

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

export const getTreeNodeJSONSchemaPropertyAliases = (itemType: string): Record<string, string> => {
  return isButtonElementType(itemType) ? { Вид: "ТипКнопки" } : {}
}

const isButtonElementType = (itemType: string): itemType is "Button" | "CommandBarButton" => {
  return itemType === "Button" || itemType === "CommandBarButton"
}
