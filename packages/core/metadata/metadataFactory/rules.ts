import { Button, ButtonPartialEnterprise, ButtonTypedEnterprise, ButtonXML } from "../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupPartialEnterprise,
  ButtonGroupTypedEnterprise,
  ButtonGroupXML,
} from "../forms/elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldPartialEnterprise,
  CalendarFieldTypedEnterprise,
  CalendarFieldXML,
} from "../forms/elements/calendarField/types"
import {
  ChartField,
  ChartFieldPartialEnterprise,
  ChartFieldTypedEnterprise,
  ChartFieldXML,
} from "../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
  CheckBoxFieldXML,
} from "../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupPartialEnterprise,
  ColumnGroupTypedEnterprise,
  ColumnGroupXML,
} from "../forms/elements/columnGroup/types"
import {
  CommandBar,
  CommandBarPartialEnterprise,
  CommandBarTypedEnterprise,
  CommandBarXML,
} from "../forms/elements/commandBar/types"
import {
  DendrogramField,
  DendrogramFieldPartialEnterprise,
  DendrogramFieldTypedEnterprise,
  DendrogramFieldXML,
} from "../forms/elements/dendrogramField/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
  FormattedDocumentFieldTypedEnterprise,
  FormattedDocumentFieldXML,
} from "../forms/elements/formattedDocumentField/types"
import {
  GanttChartField,
  GanttChartFieldPartialEnterprise,
  GanttChartFieldTypedEnterprise,
  GanttChartFieldXML,
} from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
  GeographicalSchemaFieldTypedEnterprise,
  GeographicalSchemaFieldXML,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
  GraphicalSchemaFieldTypedEnterprise,
  GraphicalSchemaFieldXML,
} from "../forms/elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldPartialEnterprise,
  HTMLDocumentFieldTypedEnterprise,
  HTMLDocumentFieldXML,
} from "../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldPartialEnterprise,
  InputFieldTypedEnterprise,
  InputFieldXML,
} from "../forms/elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
  LabelDecorationXML,
} from "../forms/elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldPartialEnterprise,
  LabelFieldTypedEnterprise,
  LabelFieldXML,
} from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise, PageTypedEnterprise, PageXML } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise, PagesXML } from "../forms/elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldPartialEnterprise,
  PdfDocumentFieldTypedEnterprise,
  PdfDocumentFieldXML,
} from "../forms/elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
  PeriodFieldXML,
} from "../forms/elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
  PictureDecorationXML,
} from "../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
  PictureFieldXML,
} from "../forms/elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldPartialEnterprise,
  PlannerFieldTypedEnterprise,
  PlannerFieldXML,
} from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise, PopupTypedEnterprise, PopupXML } from "../forms/elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldPartialEnterprise,
  ProgressBarFieldTypedEnterprise,
  ProgressBarFieldXML,
} from "../forms/elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
  RadioButtonFieldXML,
} from "../forms/elements/radioButtonField/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
  SpreadSheetDocumentFieldTypedEnterprise,
  SpreadSheetDocumentFieldXML,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise, TableXML } from "../forms/elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldPartialEnterprise,
  TextDocumentFieldTypedEnterprise,
  TextDocumentFieldXML,
} from "../forms/elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldPartialEnterprise,
  TrackBarFieldTypedEnterprise,
  TrackBarFieldXML,
} from "../forms/elements/trackBarField/types"
export type TypeRules =
  | {
      XML: ButtonXML
      Element: Button
      PartialEnterprise: ButtonPartialEnterprise
      TypedEnterprise: ButtonTypedEnterprise
      name: "Button"
      EnterpriseName: "Кнопка"
    }
  | {
      XML: ButtonGroupXML
      Element: ButtonGroup
      PartialEnterprise: ButtonGroupPartialEnterprise
      TypedEnterprise: ButtonGroupTypedEnterprise
      name: "ButtonGroup"
      EnterpriseName: "ГруппаКнопок"
    }
  | {
      XML: CalendarFieldXML
      Element: CalendarField
      PartialEnterprise: CalendarFieldPartialEnterprise
      TypedEnterprise: CalendarFieldTypedEnterprise
      name: "CalendarField"
      EnterpriseName: "ПолеКалендаря"
    }
  | {
      XML: ChartFieldXML
      Element: ChartField
      PartialEnterprise: ChartFieldPartialEnterprise
      TypedEnterprise: ChartFieldTypedEnterprise
      name: "ChartField"
      EnterpriseName: "ПолеДиаграммы"
    }
  | {
      XML: CheckBoxFieldXML
      Element: CheckBoxField
      PartialEnterprise: CheckBoxFieldPartialEnterprise
      TypedEnterprise: CheckBoxFieldTypedEnterprise
      name: "CheckBoxField"
      EnterpriseName: "ПолеФлажок"
    }
  | {
      XML: ColumnGroupXML
      Element: ColumnGroup
      PartialEnterprise: ColumnGroupPartialEnterprise
      TypedEnterprise: ColumnGroupTypedEnterprise
      name: "ColumnGroup"
      EnterpriseName: "ГруппаКолонок"
    }
  | {
      XML: CommandBarXML
      Element: CommandBar
      PartialEnterprise: CommandBarPartialEnterprise
      TypedEnterprise: CommandBarTypedEnterprise
      name: "CommandBar"
      EnterpriseName: "КоманднаяПанель"
    }
  | {
      XML: DendrogramFieldXML
      Element: DendrogramField
      PartialEnterprise: DendrogramFieldPartialEnterprise
      TypedEnterprise: DendrogramFieldTypedEnterprise
      name: "DendrogramField"
      EnterpriseName: "ПолеДендрограммы"
    }
  //   | {
  //       XML: FormDecorationXML
  //       Element: FormDecoration
  //       PartialEnterprise: FormDecorationPartialEnterprise
  //       TypedEnterprise: FormDecorationTypedEnterprise
  //       name: "FormDecoration"
  //       EnterpriseName: "ДекорацияФормы"
  //     }
  | {
      XML: FormattedDocumentFieldXML
      Element: FormattedDocumentField
      PartialEnterprise: FormattedDocumentFieldPartialEnterprise
      TypedEnterprise: FormattedDocumentFieldTypedEnterprise
      name: "FormattedDocumentField"
      EnterpriseName: "ПолеФорматированногоДокумента"
    }
  | {
      XML: GanttChartFieldXML
      Element: GanttChartField
      PartialEnterprise: GanttChartFieldPartialEnterprise
      TypedEnterprise: GanttChartFieldTypedEnterprise
      name: "GanttChartField"
      EnterpriseName: "ПолеДиаграммыГанта"
    }
  | {
      XML: GeographicalSchemaFieldXML
      Element: GeographicalSchemaField
      PartialEnterprise: GeographicalSchemaFieldPartialEnterprise
      TypedEnterprise: GeographicalSchemaFieldTypedEnterprise
      name: "GeographicalSchemaField"
      EnterpriseName: "ПолеГеографическойСхемы"
    }
  | {
      XML: GraphicalSchemaFieldXML
      Element: GraphicalSchemaField
      PartialEnterprise: GraphicalSchemaFieldPartialEnterprise
      TypedEnterprise: GraphicalSchemaFieldTypedEnterprise
      name: "GraphicalSchemaField"
      EnterpriseName: "ПолеГрафическойСхемы"
    }
  | {
      XML: HTMLDocumentFieldXML
      Element: HTMLDocumentField
      PartialEnterprise: HTMLDocumentFieldPartialEnterprise
      TypedEnterprise: HTMLDocumentFieldTypedEnterprise
      name: "HTMLDocumentField"
      EnterpriseName: "ПолеHTMLДокумента"
    }
  | {
      XML: InputFieldXML
      Element: InputField
      PartialEnterprise: InputFieldPartialEnterprise
      TypedEnterprise: InputFieldTypedEnterprise
      name: "InputField"
      EnterpriseName: "ПолеВвода"
    }
  | {
      XML: LabelDecorationXML
      Element: LabelDecoration
      PartialEnterprise: LabelDecorationPartialEnterprise
      TypedEnterprise: LabelDecorationTypedEnterprise
      name: "LabelDecoration"
      EnterpriseName: "Надпись"
    }
  | {
      XML: LabelFieldXML
      Element: LabelField
      PartialEnterprise: LabelFieldPartialEnterprise
      TypedEnterprise: LabelFieldTypedEnterprise
      name: "LabelField"
      EnterpriseName: "ПолеНадписи"
    }
  | {
      XML: PageXML
      Element: Page
      PartialEnterprise: PagePartialEnterprise
      TypedEnterprise: PageTypedEnterprise
      name: "Page"
      EnterpriseName: "Страница"
    }
  | {
      XML: PagesXML
      Element: Pages
      PartialEnterprise: PagesPartialEnterprise
      TypedEnterprise: PagesTypedEnterprise
      name: "Pages"
      EnterpriseName: "Страницы"
    }
  | {
      XML: PdfDocumentFieldXML
      Element: PdfDocumentField
      PartialEnterprise: PdfDocumentFieldPartialEnterprise
      TypedEnterprise: PdfDocumentFieldTypedEnterprise
      name: "PdfDocumentField"
      EnterpriseName: "ПолеPDFДокумента"
    }
  | {
      XML: PeriodFieldXML
      Element: PeriodField
      PartialEnterprise: PeriodFieldPartialEnterprise
      TypedEnterprise: PeriodFieldTypedEnterprise
      name: "PeriodField"
      EnterpriseName: "ПолеПериода"
    }
  | {
      XML: PictureDecorationXML
      Element: PictureDecoration
      PartialEnterprise: PictureDecorationPartialEnterprise
      TypedEnterprise: PictureDecorationTypedEnterprise
      name: "PictureDecoration"
      EnterpriseName: "Рисунок"
    }
  | {
      XML: PictureFieldXML
      Element: PictureField
      PartialEnterprise: PictureFieldPartialEnterprise
      TypedEnterprise: PictureFieldTypedEnterprise
      name: "PictureField"
      EnterpriseName: "ПолеРисунка"
    }
  | {
      XML: PlannerFieldXML
      Element: PlannerField
      PartialEnterprise: PlannerFieldPartialEnterprise
      TypedEnterprise: PlannerFieldTypedEnterprise
      name: "PlannerField"
      EnterpriseName: "ПолеПланировщика"
    }
  | {
      XML: PopupXML
      Element: Popup
      PartialEnterprise: PopupPartialEnterprise
      TypedEnterprise: PopupTypedEnterprise
      name: "Popup"
      EnterpriseName: "Подменю"
    }
  | {
      XML: ProgressBarFieldXML
      Element: ProgressBarField
      PartialEnterprise: ProgressBarFieldPartialEnterprise
      TypedEnterprise: ProgressBarFieldTypedEnterprise
      name: "ProgressBarField"
      EnterpriseName: "ПолеИндикатора"
    }
  | {
      XML: RadioButtonFieldXML
      Element: RadioButtonField
      PartialEnterprise: RadioButtonFieldPartialEnterprise
      TypedEnterprise: RadioButtonFieldTypedEnterprise
      name: "RadioButtonField"
      EnterpriseName: "ПолеПереключателя"
    }
  | {
      XML: SpreadSheetDocumentFieldXML
      Element: SpreadSheetDocumentField
      PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise
      TypedEnterprise: SpreadSheetDocumentFieldTypedEnterprise
      name: "SpreadSheetDocumentField"
      EnterpriseName: "ПолеТабличногоДокумента"
    }
  | {
      XML: TableXML
      Element: Table
      PartialEnterprise: TablePartialEnterprise
      TypedEnterprise: TablePartialEnterprise
      name: "Table"
      EnterpriseName: "ТаблицаФормы"
    }
  | {
      XML: TextDocumentFieldXML
      Element: TextDocumentField
      PartialEnterprise: TextDocumentFieldPartialEnterprise
      TypedEnterprise: TextDocumentFieldTypedEnterprise
      name: "TextDocumentField"
      EnterpriseName: "ПолеТекстовогоДокумента"
    }
  | {
      XML: TrackBarFieldXML
      Element: TrackBarField
      PartialEnterprise: TrackBarFieldPartialEnterprise
      TypedEnterprise: TrackBarFieldTypedEnterprise
      name: "TrackBarField"
      EnterpriseName: "ПолеПолосыПрокрутки"
    }
