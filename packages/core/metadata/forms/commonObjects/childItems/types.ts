// import { ToEnterpriseType } from "~/metadata/metadataFactory/types"
import { MetadataItemTypeToEnterprise, MetadataItemTypeToYAML } from "~/metadata/orchestration"
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
import { PDFDocumentField } from "../../elements/pdfDocumentField/types"
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

// export type AllChildItems = ChildItem[]

// export type AllChildItem = ChildItem

// export type AllChildItemsPartialYAML = Record<string, ToYAML<AllChildItem>>

// export type AllChildItemsEnterprise = ToEnterprise<AllChildItem>[]
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

export type GroupChildItemsPartialYAML = Record<string, MetadataItemTypeToYAML<GroupChildItem["itemType"]>>

export type GroupChildItemsEnterprise = MetadataItemTypeToEnterprise<GroupChildItem["itemType"]>[]

// #endregion

// #region CommandBarChildItem

export type CommandBarChildItem = Button | ButtonGroup | Popup | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemsPartialYAML = Record<string, MetadataItemTypeToYAML<CommandBarChildItem["itemType"]>>

export type CommandBarChildItemsTypedYAML = Record<
  string,
  MetadataItemTypeToYAML<Button["itemType"] | ButtonGroup["itemType"] | Popup["itemType"]>
>

export type CommandBarChildItemsEnterprise = MetadataItemTypeToEnterprise<CommandBarChildItem["itemType"]>[]

// #endregion

// #region CommandBarGroupChildItem

export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemsPartialYAML = Record<
  string,
  MetadataItemTypeToYAML<CommandBarGroupChildItem["itemType"]>
>

export type CommandBarGroupChildItemsTypedYAML = Record<
  string,
  MetadataItemTypeToYAML<CommandBarGroupChildItem["itemType"]>
>

// #endregion

// #region PagesChildItem

export type PagesChildItem = Page
export type PagesChildItems = PagesChildItem[]

export type PagesChildItemsPartialYAML = Record<string, MetadataItemTypeToYAML<PagesChildItem["itemType"]>>

export type PagesChildItemsEnterprise = MetadataItemTypeToEnterprise<PagesChildItem["itemType"]>[]
// #endregion

// #region TableChildItem

export interface ChildItemsStructureResult {
  childItems: GroupChildItems
  autoCommandBar?: AutoCommandBar
}
export type TableChildItem = CheckBoxField | ColumnGroup | InputField | LabelField | PictureField

export type TableChildItems = TableChildItem[]

export type TableChildItemsEnterprise = MetadataItemTypeToEnterprise<TableChildItem["itemType"]>[]

export type TableChildItemTypedYAML =
  | CheckBoxFieldTypedYAML
  | ColumnGroupTypedYAML
  | InputFieldTypedYAML
  | LabelFieldTypedYAML

export type TableChildItemsTypedYAML = Record<string, TableChildItemTypedYAML>

export type TableChildItemsPartialYAML = Record<string, MetadataItemTypeToYAML<TableChildItem["itemType"]>>

// #endregion

export type ChildItem = GroupChildItem | CommandBarChildItem | TableChildItem | PagesChildItem

export type AllChildItemsPartialYAML =
  | GroupChildItemsPartialYAML
  | CommandBarChildItemsPartialYAML
  | TableChildItemsPartialYAML
  | PagesChildItemsPartialYAML

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

export type FormElementsYAML = Record<
  string,
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
  | PDFDocumentField
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
>

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
