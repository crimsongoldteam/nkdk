import { AutoCommandBar, AutoCommandBarEnterprise } from "../forms/elements/autoCommandBar/types"
import { Button, ButtonPartialEnterprise } from "../forms/elements/button/types"
import { ButtonGroup, ButtonGroupPartialEnterprise } from "../forms/elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialEnterprise } from "../forms/elements/calendarField/types"
import { ChartField, ChartFieldPartialEnterprise } from "../forms/elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialEnterprise } from "../forms/elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPartialEnterprise } from "../forms/elements/columnGroup/types"
import { CommandBar, CommandBarPartialEnterprise } from "../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuEnterprise } from "../forms/elements/contextMenu/types"
import { DendrogramField, DendrogramFieldPartialEnterprise } from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipEnterprise } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialEnterprise,
} from "../forms/elements/formattedDocumentField/types"
import { GanttChartField, GanttChartFieldPartialEnterprise } from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialEnterprise,
} from "../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldPartialEnterprise,
} from "../forms/elements/graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldPartialEnterprise } from "../forms/elements/htmlDocumentField/types"
import { InputField, InputFieldPartialEnterprise, InputFieldPreview } from "../forms/elements/inputField/types"
import { LabelDecoration, LabelDecorationPartialEnterprise } from "../forms/elements/labelDecoration/types"
import { LabelField, LabelFieldPartialEnterprise, LabelFieldPreview } from "../forms/elements/labelField/types"
import { Page, PagePartialEnterprise } from "../forms/elements/page/types"
import { Pages, PagesPartialEnterprise } from "../forms/elements/pages/types"
import { PdfDocumentField, PdfDocumentFieldPartialEnterprise } from "../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialEnterprise } from "../forms/elements/periodField/types"
import { PictureDecoration, PictureDecorationPartialEnterprise } from "../forms/elements/pictureDecoration/types"
import { PictureField, PictureFieldPartialEnterprise } from "../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldPartialEnterprise } from "../forms/elements/plannerField/types"
import { Popup, PopupPartialEnterprise } from "../forms/elements/popup/types"
import { ProgressBarField, ProgressBarFieldPartialEnterprise } from "../forms/elements/progressBarField/types"
import { RadioButtonField, RadioButtonFieldPartialEnterprise } from "../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
} from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
} from "../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialEnterprise,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialEnterprise } from "../forms/elements/table/types"
import { TextDocumentField, TextDocumentFieldPartialEnterprise } from "../forms/elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialEnterprise } from "../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialEnterprise, UsualGroupPreview } from "../forms/elements/usualGroup/types"

/**
 * Маппинг типов элементов формы к их правилам.
 * Каждый кортеж содержит: [ТипЭлемента, { Правила }]
 */
type ElementRulesMap =
  | [Button, { PartialEnterprise: ButtonPartialEnterprise }]
  | [ButtonGroup, { PartialEnterprise: ButtonGroupPartialEnterprise }]
  | [CalendarField, { PartialEnterprise: CalendarFieldPartialEnterprise }]
  | [ChartField, { PartialEnterprise: ChartFieldPartialEnterprise }]
  | [CheckBoxField, { PartialEnterprise: CheckBoxFieldPartialEnterprise }]
  | [ColumnGroup, { PartialEnterprise: ColumnGroupPartialEnterprise }]
  | [CommandBar, { PartialEnterprise: CommandBarPartialEnterprise }]
  | [DendrogramField, { PartialEnterprise: DendrogramFieldPartialEnterprise }]
  | [FormattedDocumentField, { PartialEnterprise: FormattedDocumentFieldPartialEnterprise }]
  | [GanttChartField, { PartialEnterprise: GanttChartFieldPartialEnterprise }]
  | [GeographicalSchemaField, { PartialEnterprise: GeographicalSchemaFieldPartialEnterprise }]
  | [GraphicalSchemaField, { PartialEnterprise: GraphicalSchemaFieldPartialEnterprise }]
  | [HTMLDocumentField, { PartialEnterprise: HTMLDocumentFieldPartialEnterprise }]
  | [InputField, { Preview: InputFieldPreview; PartialEnterprise: InputFieldPartialEnterprise }]
  | [LabelDecoration, { PartialEnterprise: LabelDecorationPartialEnterprise }]
  | [LabelField, { Preview: LabelFieldPreview; PartialEnterprise: LabelFieldPartialEnterprise }]
  | [Page, { PartialEnterprise: PagePartialEnterprise }]
  | [Pages, { PartialEnterprise: PagesPartialEnterprise }]
  | [PdfDocumentField, { PartialEnterprise: PdfDocumentFieldPartialEnterprise }]
  | [PeriodField, { PartialEnterprise: PeriodFieldPartialEnterprise }]
  | [PictureDecoration, { PartialEnterprise: PictureDecorationPartialEnterprise }]
  | [PictureField, { PartialEnterprise: PictureFieldPartialEnterprise }]
  | [PlannerField, { PartialEnterprise: PlannerFieldPartialEnterprise }]
  | [Popup, { PartialEnterprise: PopupPartialEnterprise }]
  | [ProgressBarField, { PartialEnterprise: ProgressBarFieldPartialEnterprise }]
  | [RadioButtonField, { PartialEnterprise: RadioButtonFieldPartialEnterprise }]
  | [SpreadSheetDocumentField, { PartialEnterprise: SpreadSheetDocumentFieldPartialEnterprise }]
  | [Table, { PartialEnterprise: TablePartialEnterprise }]
  | [SearchControlAddition, { PartialEnterprise: SearchControlAdditionEnterprise }]
  | [SingleSearchControlAddition, { PartialEnterprise: SingleSearchControlAdditionEnterprise }]
  | [SingleSearchStringAddition, { PartialEnterprise: SingleSearchStringAdditionEnterprise }]
  | [SearchStringAddition, { PartialEnterprise: SearchStringAdditionEnterprise }]
  | [TextDocumentField, { PartialEnterprise: TextDocumentFieldPartialEnterprise }]
  | [TrackBarField, { PartialEnterprise: TrackBarFieldPartialEnterprise }]
  | [UsualGroup, { PartialEnterprise: UsualGroupPartialEnterprise; Preview: UsualGroupPreview }]
  | [ContextMenu, { PartialEnterprise: ContextMenuEnterprise }]
  | [AutoCommandBar, { PartialEnterprise: AutoCommandBarEnterprise }]
  | [ExtendedTooltip, { PartialEnterprise: ExtendedTooltipEnterprise }]

/**
 * Извлекает правила для заданного типа элемента.
 * Использует распределительный условный тип для поиска в ElementRulesMap.
 */
type ExtractRule<T, M> = M extends [T, infer R] ? R : never

export type TypeRules<T> = ExtractRule<T, ElementRulesMap>
