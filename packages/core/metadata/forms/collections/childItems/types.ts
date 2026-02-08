import { ToPartialEnterpriseType, ToPreviewType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button } from "../../elements/button/types"
import { ButtonGroup } from "../../elements/buttonGroup/types"
import { CalendarField } from "../../elements/calendarField/types"
import { ChartField } from "../../elements/chartField/types"
import { CheckBoxField, CheckBoxFieldTypedEnterprise } from "../../elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupTypedEnterprise } from "../../elements/columnGroup/types"
import { CommandBar } from "../../elements/commandBar/types"
import { ContextMenu } from "../../elements/contextMenu/types"
import { DendrogramField } from "../../elements/dendrogramField/types"
import { FormattedDocumentField } from "../../elements/formattedDocumentField/types"
import { GanttChartField } from "../../elements/ganttChartField/types"
import { GeographicalSchemaField } from "../../elements/geographicalSchemaField/types"
import { GraphicalSchemaField } from "../../elements/graphicalSchemaField/types"
import { HTMLDocumentField } from "../../elements/htmlDocumentField/types"
import { InputField, InputFieldTypedEnterprise } from "../../elements/inputField/types"
import { LabelDecoration } from "../../elements/labelDecoration/types"
import { LabelField, LabelFieldTypedEnterprise } from "../../elements/labelField/types"
import { Page } from "../../elements/page/types"
import { Pages } from "../../elements/pages/types"
import { PdfDocumentField } from "../../elements/pdfDocumentField/types"
import { PeriodField } from "../../elements/periodField/types"
import { PictureDecoration } from "../../elements/pictureDecoration/types"
import { PictureField } from "../../elements/pictureField/types"
import { PlannerField } from "../../elements/plannerField/types"
import { Popup } from "../../elements/popup/types"
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

export type AllChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<AllChildItem>>

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

export type GroupChilItemPartialEnterprise = Record<string, ToPartialEnterpriseType<GroupChildItem>>

export type GroupChildItemsPreview = ToPreviewType<GroupChildItem>[]

// #endregion

// #region CommandBarChildItem

export type CommandBarChildItem = Button | ButtonGroup | Popup | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<CommandBarChildItem>>

// export type CommandBarChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<CommandBarChildItem>>

// #endregion

// #region CommandBarGroupChildItem

export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemsPartialEnterprise = Record<
  string,
  ToPartialEnterpriseType<CommandBarGroupChildItem>
>

export type CommandBarGroupChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<CommandBarGroupChildItem>>

// #endregion

// #region PagesChildItem

export type PagesChildItem = Page
export type PagesChildItems = PagesChildItem[]

export type PagesChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<PagesChildItem>>
// export type PagesChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<PagesChildItem>>

// #endregion

// #region TableChildItem

export interface ChildItemsStructureResult {
  childItems: GroupChildItems
  autoCommandBar?: AutoCommandBar
}
export type TableChildItem = CheckBoxField | ColumnGroup | InputField | LabelField | PictureField

export type TableChildItems = TableChildItem[]

export type TableChildItemTypedEnterprise =
  | CheckBoxFieldTypedEnterprise
  | ColumnGroupTypedEnterprise
  | InputFieldTypedEnterprise
  | LabelFieldTypedEnterprise

export type TableChildItemsTypedEnterprise = Record<string, TableChildItemTypedEnterprise>

export type TableChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<TableChildItem>>

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

// #endregion

// #region SingleElement

export type SingleElement = AutoCommandBar | ContextMenu | ViewStatusAddition

//
