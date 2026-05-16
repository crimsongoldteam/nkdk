// import { ToEnterpriseType } from "~/metadata/metadataFactory/types"
import { CollectableElement, ToEnterprise, ToTypedYAML, ToYAML } from "~/metadata/orchestration"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonTypedYAML, CommandBarButton, CommandBarButtonTypedYAML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupTypedYAML } from "../../elements/buttonGroup/types"
import { CalendarField } from "../../elements/calendarField/types"
import { ChartField } from "../../elements/chartField/types"
import { CheckBoxField, TableCheckBoxField, TableCheckBoxFieldTypedYAML } from "../../elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupTypedYAML } from "../../elements/columnGroup/types"
import { CommandBar } from "../../elements/commandBar/types"
import { ContextMenu } from "../../elements/contextMenu/types"
import { DendrogramField } from "../../elements/dendrogramField/types"
import { ExtendedTooltip } from "../../elements/extendedTooltip/types"
import { FormattedDocumentField } from "../../elements/formattedDocumentField/types"
import { GanttChartField } from "../../elements/ganttChartField/types"
import { GeographicalSchemaField } from "../../elements/geographicalSchemaField/types"
import { GraphicalSchemaField } from "../../elements/graphicalSchemaField/types"
import { HTMLDocumentField } from "../../elements/htmlDocumentField/types"
import { InputField, TableInputField, TableInputFieldTypedYAML } from "../../elements/inputField/types"
import { LabelDecoration } from "../../elements/labelDecoration/types"
import { LabelField, TableLabelField, TableLabelFieldTypedYAML } from "../../elements/labelField/types"
import { Page } from "../../elements/page/types"
import { Pages } from "../../elements/pages/types"
import { PDFDocumentField } from "../../elements/pdfDocumentField/types"
import { PeriodField } from "../../elements/periodField/types"
import { PictureDecoration } from "../../elements/pictureDecoration/types"
import { PictureField, TablePictureField, TablePictureFieldTypedYAML } from "../../elements/pictureField/types"
import { PlannerField } from "../../elements/plannerField/types"
import { Popup, PopupTypedYAML } from "../../elements/popup/types"
import { ProgressBarField } from "../../elements/progressBarField/types"
import { RadioButtonField } from "../../elements/radioButtonField/types"
import { SearchControlAddition } from "../../elements/searchControlAddition/types"
import { SearchStringAddition } from "../../elements/searchStringAddition/types"
import { SpreadSheetDocumentField } from "../../elements/spreadSheetDocumentField/types"
import { Table } from "../../elements/table/types"
import { TextDocumentField } from "../../elements/textDocumentField/types"
import { TrackBarField } from "../../elements/trackBarField/types"
import { UsualGroup } from "../../elements/usualGroup/types"
import { SingleViewStatusAddition, ViewStatusAddition } from "../../elements/viewStatusAddition/types"

// #region GroupChildItem

export type GroupChildItem =
  | Button
  | CalendarField
  | ChartField
  | CheckBoxField
  | CommandBar
  | DendrogramField
  | FormattedDocumentField
  | GanttChartField
  | GeographicalSchemaField
  | GraphicalSchemaField
  | HTMLDocumentField
  | InputField
  | LabelDecoration
  | LabelField
  | Pages
  | PDFDocumentField
  | PeriodField
  | PictureDecoration
  | PictureField
  | PlannerField
  | ProgressBarField
  | RadioButtonField
  | SpreadSheetDocumentField
  | Table
  | TextDocumentField
  | TrackBarField
  | UsualGroup

export type GroupChildItems = GroupChildItem[]

export type GroupChildItemsPartialYAML = Record<string, ToYAML<GroupChildItem["itemType"]>>

export type GroupChildItemsEnterprise = ToEnterprise<GroupChildItem["itemType"]>[]

// #endregion

// #region CommandBarChildItem

export type CommandBarChildItem =
  | Button
  | CommandBarButton
  | ButtonGroup
  | Popup
  | SearchStringAddition
  | SearchControlAddition
  | ViewStatusAddition
export type CommandBarChildItems = ReadonlyArray<CommandBarChildItem>

export type CommandBarChildItemsPartialYAML = Record<string, ToYAML<CommandBarChildItem["itemType"]>>

export type CommandBarChildItemsTypedYAML = Record<
  string,
  ToTypedYAML<Button["itemType"] | CommandBarButton["itemType"] | ButtonGroup["itemType"] | Popup["itemType"]>
>

export type CommandBarChildItemsEnterprise = ToEnterprise<CommandBarChildItem["itemType"]>[]

// #endregion

// #region CommandBarGroupChildItem

export type CommandBarGroupChildItem = Button | CommandBarButton | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemsPartialYAML = Record<string, ToYAML<CommandBarGroupChildItem["itemType"]>>

export type CommandBarGroupChildItemsTypedYAML = Record<string, ToTypedYAML<CommandBarGroupChildItem["itemType"]>>

// #endregion

// #region PagesChildItem

export type PagesChildItem = Page
export type PagesChildItems = PagesChildItem[]

export type PagesChildItemsPartialYAML = Record<string, ToYAML<PagesChildItem["itemType"]>>

export type PagesChildItemsEnterprise = ToEnterprise<PagesChildItem["itemType"]>[]
// #endregion

// #region TableChildItem

export interface ChildItemsStructureResult {
  childItems: GroupChildItems
  autoCommandBar?: AutoCommandBar
}
export type TableChildItem = TableCheckBoxField | ColumnGroup | TableInputField | TableLabelField | TablePictureField

export type TableChildItems = TableChildItem[]

export type TableChildItemsEnterprise = ToEnterprise<TableChildItem["itemType"]>[]

export type TableChildItemTypedYAML =
  | TableCheckBoxFieldTypedYAML
  | ColumnGroupTypedYAML
  | TableInputFieldTypedYAML
  | TableLabelFieldTypedYAML
  | TablePictureFieldTypedYAML

export type TableChildItemsTypedYAML = Record<string, TableChildItemTypedYAML>

export type TableChildItemsPartialYAML = Record<string, ToYAML<TableChildItem["itemType"]>>

// #endregion

// #region FormChildItem

export type ChildItem = GroupChildItem | CommandBarChildItem | TableChildItem | PagesChildItem

export type FormChildItem = GroupChildItem

export type FormChildItemsPartialYAML =
  | GroupChildItemsPartialYAML
  | CommandBarChildItemsPartialYAML
  | TableChildItemsPartialYAML
  | PagesChildItemsPartialYAML

// #endregion

// #region TypedElement

export type TypedElement =
  | Button
  | CommandBarButton
  | ButtonGroup
  | Popup
  | TableCheckBoxField
  | ColumnGroup
  | TableInputField
  | TableLabelField
  | TablePictureField

export type TypedElementPartialYAML =
  | ButtonTypedYAML
  | CommandBarButtonTypedYAML
  | ButtonGroupTypedYAML
  | PopupTypedYAML
  | TableCheckBoxFieldTypedYAML
  | ColumnGroupTypedYAML
  | TableInputFieldTypedYAML
  | TableLabelFieldTypedYAML
  | TablePictureFieldTypedYAML
// #endregion

// #region SingleElement

export type SingleElement = AutoCommandBar | ContextMenu | SingleViewStatusAddition | ExtendedTooltip

export type FormElementsYAML = Record<string, ToYAML<CollectableElement["itemType"]>>

// #endregion

// #region OtherElement

export type OtherElement =
  | CalendarField
  | ChartField
  | DendrogramField
  | FormattedDocumentField
  | GanttChartField
  | GeographicalSchemaField
  | GraphicalSchemaField
  | HTMLDocumentField
  | PDFDocumentField
  | PeriodField
  | PlannerField
  | ProgressBarField
  | RadioButtonField
  | SpreadSheetDocumentField
  | TextDocumentField
  | TrackBarField
  | PictureField

export type OtherElementElementType = OtherElement extends { itemType: infer ItemType } ? ItemType : never

export type GenerateChildItem =
  | Button
  | CheckBoxField
  | CommandBar
  | InputField
  | LabelDecoration
  | LabelField
  | Page
  | Pages
  | PictureDecoration
  | Table
  | UsualGroup
  | OtherElement

// #endregion
