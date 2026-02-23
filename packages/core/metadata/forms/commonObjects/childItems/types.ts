import { ToTypedYAML, ToYAML } from "~/metadata/metadataFactory/rules"
// import { ToEnterpriseType } from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button, ButtonTypedYAML } from "../../elements/button/types"
import { ButtonGroup, ButtonGroupTypedYAML } from "../../elements/buttonGroup/types"
import { CalendarField } from "../../elements/calendarField/types"
import { ChartField } from "../../elements/chartField/types"
import { CheckBoxField, CheckBoxFieldTypedYAML } from "../../elements/checkBoxField/types"
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
import { InputField, InputFieldTypedYAML } from "../../elements/inputField/types"
import { LabelDecoration } from "../../elements/labelDecoration/types"
import { LabelField, LabelFieldTypedYAML } from "../../elements/labelField/types"
import { Page } from "../../elements/page/types"
import { Pages } from "../../elements/pages/types"
import { PdfDocumentField } from "../../elements/pdfDocumentField/types"
import { PeriodField } from "../../elements/periodField/types"
import { PictureDecoration } from "../../elements/pictureDecoration/types"
import { PictureField, PictureFieldTypedYAML } from "../../elements/pictureField/types"
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
import { ViewStatusAddition } from "../../elements/viewStatusAddition/types"

// #region ChildItem

type ChildItem =
  | Button
  | ButtonGroup
  | CalendarField
  | ChartField
  | CheckBoxField
  | ColumnGroup
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
  | Page
  | Pages
  | PdfDocumentField
  | PeriodField
  | PictureDecoration
  | PictureField
  | PlannerField
  | Popup
  | ProgressBarField
  | RadioButtonField
  | SpreadSheetDocumentField
  | Table
  | TextDocumentField
  | TrackBarField
  | UsualGroup
  | SearchStringAddition
  | SearchControlAddition

export type AllChildItems = ChildItem[]

export type AllChildItem = ChildItem

export type AllChildItemsPartialYAML = Record<string, ToYAML<AllChildItem>>

// #endregion

// #region ClientApplicationFormChildItem

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
  | PdfDocumentField
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

export type GroupChilItemPartialYAML = Record<string, ToYAML<GroupChildItem>>

// export type GroupChildItemsEnterprise = ToEnterpriseType<GroupChildItem>[]

// #endregion

// #region CommandBarChildItem

export type CommandBarChildItem = Button | ButtonGroup | Popup | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemsPartialYAML = Record<string, ToYAML<CommandBarChildItem>>

export type CommandBarChildItemsTypedYAML = Record<string, ToTypedYAML<Button | ButtonGroup | Popup>>

// #endregion

// #region CommandBarGroupChildItem

export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemsPartialYAML = Record<string, ToYAML<CommandBarGroupChildItem>>

export type CommandBarGroupChildItemsTypedYAML = Record<string, ToTypedYAML<CommandBarGroupChildItem>>

// #endregion

// #region PagesChildItem

export type PagesChildItem = Page
export type PagesChildItems = PagesChildItem[]

export type PagesChildItemsPartialYAML = Record<string, ToYAML<PagesChildItem>>
// export type PagesChildItemsTypedYAML = Record<string, ToTypedYAMLType<PagesChildItem>>

// #endregion

// #region TableChildItem

export interface ChildItemsStructureResult {
  childItems: GroupChildItems
  autoCommandBar?: AutoCommandBar
}
export type TableChildItem = CheckBoxField | ColumnGroup | InputField | LabelField | PictureField

export type TableChildItems = TableChildItem[]

export type TableChildItemTypedYAML =
  | CheckBoxFieldTypedYAML
  | ColumnGroupTypedYAML
  | InputFieldTypedYAML
  | LabelFieldTypedYAML

export type TableChildItemsTypedYAML = Record<string, TableChildItemTypedYAML>

export type TableChildItemsPartialYAML = Record<string, ToYAML<TableChildItem>>

// #endregion

// #region TypedElement

export type TypedElement =
  | Button
  | ButtonGroup
  | Popup
  | CheckBoxField
  | ColumnGroup
  | InputField
  | LabelField
  | PictureField

export type TypedElementPartialYAML =
  | ButtonTypedYAML
  | ButtonGroupTypedYAML
  | PopupTypedYAML
  | CheckBoxFieldTypedYAML
  | ColumnGroupTypedYAML
  | InputFieldTypedYAML
  | LabelFieldTypedYAML
  | PictureFieldTypedYAML
// #endregion

// #region SingleElement

export type SingleElement = AutoCommandBar | ContextMenu | ViewStatusAddition | ExtendedTooltip

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
  | PdfDocumentField
  | PeriodField
  | PlannerField
  | ProgressBarField
  | RadioButtonField
  | SpreadSheetDocumentField
  | TextDocumentField
  | TrackBarField

export type OtherElementElementType = OtherElement extends { itemType: infer ItemType } ? ItemType : never

// #endregion
