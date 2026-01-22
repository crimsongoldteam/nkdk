import {
  FormElementType,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
  ToXMLType,
} from "~/metadata/metadataFactory/types"
import { AutoCommandBar } from "../../elements/autoCommandBar/types"
import { Button } from "../../elements/button/types"
import { ButtonGroup } from "../../elements/buttonGroup/types"
import { CalendarField } from "../../elements/calendarField/types"
import { ChartField } from "../../elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
  CheckBoxFieldXML,
} from "../../elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
  ColumnGroupXML,
} from "../../elements/columnGroup/types"
import { CommandBar } from "../../elements/commandBar/types"
import { DendrogramField } from "../../elements/dendrogramField/types"
import { FormattedDocumentField } from "../../elements/formattedDocumentField/types"
import { GanttChartField } from "../../elements/ganttChartField/types"
import { GeographicalSchemaField } from "../../elements/geographicalSchemaField/types"
import { GraphicalSchemaField } from "../../elements/graphicalSchemaField/types"
import { HTMLDocumentField } from "../../elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
  InputFieldXML,
} from "../../elements/inputField/types"
import { LabelDecoration } from "../../elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
  LabelFieldXML,
} from "../../elements/labelField/types"
import { Page } from "../../elements/page/types"
import { Pages } from "../../elements/pages/types"
import { PdfDocumentField } from "../../elements/pdfDocumentField/types"
import { PeriodField } from "../../elements/periodField/types"
import { PictureDecoration } from "../../elements/pictureDecoration/types"
import { PictureField, PictureFieldXML } from "../../elements/pictureField/types"
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

export type AllChildItemXML = Record<AllChildItem["elementType"], ToXMLType<AllChildItem>>

export type AllChildItemsXML = AllChildItemXML | AllChildItemXML[]
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

export type GroupChildItemXML = Record<GroupChildItem["elementType"], ToXMLType<GroupChildItem>>
export type GroupChildItemsXML = GroupChildItemXML | GroupChildItemXML[]

export type GroupChilItemPartialEnterprise = Record<string, ToPartialEnterpriseType<GroupChildItem>>

// #endregion

// #region CommandBarChildItem

export type CommandBarChildItem = Button | ButtonGroup | Popup | SearchStringAddition | SearchControlAddition
export type CommandBarChildItems = CommandBarChildItem[]

export type CommandBarChildItemXML = Record<CommandBarChildItem["elementType"], ToXMLType<CommandBarChildItem>>
export type CommandBarChildItemsXML = CommandBarChildItemXML | CommandBarChildItemXML[]

export type CommandBarChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<CommandBarChildItem>>

export type CommandBarChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<CommandBarChildItem>>

// #endregion

// #region CommandBarGroupChildItem

export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

export type CommandBarGroupChildItemXML = Record<
  CommandBarGroupChildItem["elementType"],
  ToXMLType<CommandBarGroupChildItem>
>
export type CommandBarGroupChildItemsXML = CommandBarGroupChildItemXML | CommandBarGroupChildItemXML[]

export type CommandBarGroupChildItemsPartialEnterprise = Record<
  string,
  ToPartialEnterpriseType<CommandBarGroupChildItem>
>

export type CommandBarGroupChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<CommandBarGroupChildItem>>

// #endregion

// #region PagesChildItem

export type PagesChildItem = Page
export type PagesChildItems = PagesChildItem[]

export type PagesChildItemXML = Record<PagesChildItem["elementType"], ToXMLType<PagesChildItem>>
export type PagesChildItemsXML = PagesChildItemXML | PagesChildItemXML[]

export type PagesChildItemsPartialEnterprise = Record<string, ToPartialEnterpriseType<PagesChildItem>>
export type PagesChildItemsTypedEnterprise = Record<string, ToTypedEnterpriseType<PagesChildItem>>

// #endregion

// export type ChildItemXML =
//   | ButtonXML
//   | ButtonGroupXML
//   | CalendarFieldXML
//   | ChartFieldXML
//   | CheckBoxFieldXML
//   | ColumnGroupXML
//   | CommandBarXML
//   | DendrogramFieldXML
//   | FormattedDocumentFieldXML
//   | GanttChartFieldXML
//   | GeographicalSchemaFieldXML
//   | GraphicalSchemaFieldXML
//   | HTMLDocumentFieldXML
//   | InputFieldXML
//   | LabelDecorationXML
//   | LabelFieldXML
//   | PageXML
//   | PagesXML
//   | PdfDocumentFieldXML
//   | PeriodFieldXML
//   | PictureDecorationXML
//   | PictureFieldXML
//   | PlannerFieldXML
//   | PopupXML
//   | ProgressBarFieldXML
//   | RadioButtonFieldXML
//   | SpreadSheetDocumentFieldXML
//   | TableXML
//   | TextDocumentFieldXML
//   | TrackBarFieldXML
//   | UsualGroupXML

// export type ChildItemRecordXML = Record<FormElementType, ChildItemXML>

// export type ChildItemsXML = ChildItemRecordXML | ChildItemRecordXML[]

// export type ChildItemPartialEnterprise =
//   | ButtonGroupPartialEnterprise
//   | ButtonPartialEnterprise
//   | CalendarFieldPartialEnterprise
//   | ChartFieldPartialEnterprise
//   | CheckBoxFieldPartialEnterprise
//   | ColumnGroupPartialEnterprise
//   | CommandBarPartialEnterprise
//   | DendrogramFieldPartialEnterprise
//   | FormattedDocumentFieldPartialEnterprise
//   | GanttChartFieldPartialEnterprise
//   | GeographicalSchemaFieldPartialEnterprise
//   | GraphicalSchemaFieldPartialEnterprise
//   | HTMLDocumentFieldPartialEnterprise
//   | InputFieldPartialEnterprise
//   | LabelDecorationPartialEnterprise
//   | LabelFieldPartialEnterprise
//   | PagePartialEnterprise
//   | PagesPartialEnterprise
//   | PdfDocumentFieldPartialEnterprise
//   | PeriodFieldPartialEnterprise
//   | PictureDecorationPartialEnterprise
//   | PictureFieldPartialEnterprise
//   | PlannerFieldPartialEnterprise
//   | PopupPartialEnterprise
//   | ProgressBarFieldPartialEnterprise
//   | RadioButtonFieldPartialEnterprise
//   | SpreadSheetDocumentFieldPartialEnterprise
//   | TablePartialEnterprise
//   | UsualGroupPartialEnterprise
//   | LabelDecorationPartialEnterprise
//   | PeriodFieldPartialEnterprise
//   | PictureFieldPartialEnterprise
//   | PlannerFieldPartialEnterprise
//   | ProgressBarFieldPartialEnterprise
//   | RadioButtonFieldPartialEnterprise
//   | SpreadSheetDocumentFieldPartialEnterprise
//   | TextDocumentFieldPartialEnterprise
//   | TrackBarFieldPartialEnterprise

// export type ChildItemsPartialEnterprise = Record<string, ChildItemPartialEnterprise>

export interface ChildItemsStructureResult {
  childItems: GroupChildItem[]
  autoCommandBar?: AutoCommandBar
}
export type TableChildItem = CheckBoxField | ColumnGroup | InputField | LabelField | PictureField

export type TableChildItems = TableChildItem[]

export type TableChildItemXML = CheckBoxFieldXML | ColumnGroupXML | InputFieldXML | LabelFieldXML | PictureFieldXML

export type TableChildItemRecordXML = Record<FormElementType, TableChildItemXML>
export type TableChildItemsXML = TableChildItemRecordXML | TableChildItemRecordXML[]

export type TableChildItemPartialEnterprise =
  | CheckBoxFieldPartialEnterprise
  | ColumnGroupPartialEnterprise
  | InputFieldPartialEnterprise
  | LabelFieldPartialEnterprise

export type TableChildItemTypedEnterprise =
  | CheckBoxFieldTypedEnterprise
  | ColumnGroupTypedEnterprise
  | InputFieldTypedEnterprise
  | LabelFieldTypedEnterprise

export type TableChildItemsPartialEnterprise = Record<string, TableChildItemPartialEnterprise>
export type TableChildItemsTypedEnterprise = Record<string, TableChildItemTypedEnterprise>

// export type ChildItemTypedEnterprise = (
//   | ButtonGroupTypedEnterprise
//   | ButtonTypedEnterprise
//   | CalendarFieldTypedEnterprise
//   | ChartFieldTypedEnterprise
//   | CheckBoxFieldTypedEnterprise
//   | ColumnGroupTypedEnterprise
//   | CommandBarTypedEnterprise
//   | DendrogramFieldTypedEnterprise
//   | FormattedDocumentFieldTypedEnterprise
//   | GanttChartFieldTypedEnterprise
//   | GeographicalSchemaFieldTypedEnterprise
//   | GraphicalSchemaFieldTypedEnterprise
//   | HTMLDocumentFieldTypedEnterprise
//   | InputFieldTypedEnterprise
//   | LabelDecorationTypedEnterprise
//   | LabelFieldTypedEnterprise
//   | PageTypedEnterprise
//   | PagesTypedEnterprise
//   | PdfDocumentFieldTypedEnterprise
//   | PeriodFieldTypedEnterprise
//   | PictureDecorationTypedEnterprise
//   | PictureFieldTypedEnterprise
//   | PlannerFieldTypedEnterprise
//   | PopupTypedEnterprise
//   | ProgressBarFieldTypedEnterprise
//   | RadioButtonFieldTypedEnterprise
//   | SpreadSheetDocumentFieldTypedEnterprise
//   | UsualGroupTypedEnterprise
//   | LabelDecorationTypedEnterprise
//   | PeriodFieldTypedEnterprise
//   | PictureFieldTypedEnterprise
//   | PlannerFieldTypedEnterprise
//   | ProgressBarFieldTypedEnterprise
//   | RadioButtonFieldTypedEnterprise
//   | SpreadSheetDocumentFieldTypedEnterprise
//   | TextDocumentFieldTypedEnterprise
//   | TrackBarFieldTypedEnterprise
// ) & { Тип: FormFieldTypeEnterprise }

// export type ChildItemsTypedEnterprise = Record<string, ChildItemTypedEnterprise>
// export type CommandBarGroupChildItem = Button | ButtonGroup | Popup
// export type CommandBarGroupChildItems = CommandBarGroupChildItem[]

// export type CommandBarGroupChildItemXML = ButtonXML | ButtonGroupXML | PopupXML
// export type CommandBarGroupChildItemRecordXML = Record<"Button" | "ButtonGroup" | "Popup", CommandBarGroupChildItemXML>
// export type CommandBarGroupChildItemsXML = CommandBarGroupChildItemRecordXML | CommandBarGroupChildItemsXML[]

// export type CommandBarGroupChildItemTypedEnterprise =
//   | ButtonTypedEnterprise
//   | ButtonGroupTypedEnterprise
//   | PopupTypedEnterprise
// export type CommandBarGroupChildItemsTypedEnterprise = Record<string, CommandBarGroupChildItemTypedEnterprise>

// export type CommandBarChildItem = CommandBarGroupChildItem | SearchStringAddition | SearchControlAddition
// export type CommandBarChildItems = CommandBarChildItem[]

// export type CommandBarChildItemXML = CommandBarGroupChildItemXML | SearchStringAdditionXML | SearchControlAdditionXML
// export type CommandBarChildItemRecordXML = Record<
//   "Button" | "ButtonGroup" | "Popup" | "SearchStringAddition" | "SearchControlAddition", CommandBarChildItemXML
// >
// export type CommandBarChildItemsXML = CommandBarChildItemRecordXML | CommandBarChildItemRecordXML[]

// export type CommandBarChildItemTypedEnterprise = ButtonTypedEnterprise |
//   ButtonGroupTypedEnterprise |
//   PopupTypedEnterprise

// export type CommandBarChildItemsTypedEnterprise = Record<string, CommandBarChildItemTypedEnterprise>

// export type CommandBarChildItemPartialEnterprise = ButtonPartialEnterprise |
//   ButtonGroupPartialEnterprise |
//   PopupPartialEnterprise |
//   SearchControlAdditionEnterprise |
//   SearchStringAdditionEnterprise

// export type CommandBarChildItemsPartialEnterprise = Record<string, CommandBarChildItemPartialEnterprise>
