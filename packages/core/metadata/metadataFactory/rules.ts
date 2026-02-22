import { MetadataItem } from "."
import { MetadataCatalog, MetadataCatalogYAML } from "../appliedObjects/metadataCatalog"
import { ClientApplicationForm, ClientApplicationFormYAML } from "../forms/clientApplicationForm/types"
import {
  CommandInterface,
  CommandInterfaceItem,
  CommandInterfaceItemYAML,
  CommandInterfaceYAML,
} from "../forms/commonObjects/commandInterface/types"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeYAML,
} from "../forms/commonObjects/formAttribute/types"
import { Button, ButtonPartialYAML, ButtonTypedYAML } from "../forms/elements/button/types"
import { ButtonGroup, ButtonGroupPartialYAML, ButtonGroupTypedYAML } from "../forms/elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialYAML } from "../forms/elements/calendarField/types"
import { ChartField, ChartFieldPartialYAML } from "../forms/elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialYAML, CheckBoxFieldTypedYAML } from "../forms/elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPartialYAML, ColumnGroupTypedYAML } from "../forms/elements/columnGroup/types"
import { CommandBar, CommandBarPartialYAML } from "../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuYAML } from "../forms/elements/contextMenu/types"
import { DendrogramField, DendrogramFieldPartialYAML } from "../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialYAML,
} from "../forms/elements/formattedDocumentField/types"
import { GanttChartField, GanttChartFieldPartialYAML } from "../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialYAML,
} from "../forms/elements/geographicalSchemaField/types"
import { GraphicalSchemaField, GraphicalSchemaFieldPartialYAML } from "../forms/elements/graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldPartialYAML } from "../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldEnterprise,
  InputFieldPartialYAML,
  InputFieldTypedYAML,
} from "../forms/elements/inputField/types"
import { LabelDecoration, LabelDecorationPartialYAML } from "../forms/elements/labelDecoration/types"
import { LabelField, LabelFieldPartialYAML, LabelFieldTypedYAML } from "../forms/elements/labelField/types"
import { Page, PagePartialYAML } from "../forms/elements/page/types"
import { Pages, PagesPartialYAML } from "../forms/elements/pages/types"
import { PdfDocumentField, PdfDocumentFieldPartialYAML } from "../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialYAML } from "../forms/elements/periodField/types"
import { PictureDecoration, PictureDecorationPartialYAML } from "../forms/elements/pictureDecoration/types"
import { PictureField, PictureFieldPartialYAML, PictureFieldTypedYAML } from "../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldPartialYAML } from "../forms/elements/plannerField/types"
import { Popup, PopupPartialYAML, PopupTypedYAML } from "../forms/elements/popup/types"
import { ProgressBarField, ProgressBarFieldPartialYAML } from "../forms/elements/progressBarField/types"
import { RadioButtonField, RadioButtonFieldPartialYAML } from "../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionYAML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionYAML,
} from "../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionYAML,
  SingleSearchStringAddition,
  SingleSearchStringAdditionYAML,
} from "../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialYAML,
} from "../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialYAML } from "../forms/elements/table/types"
import { TextDocumentField, TextDocumentFieldPartialYAML } from "../forms/elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialYAML } from "../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialYAML } from "../forms/elements/usualGroup/types"

export type ToYAML<T extends MetadataItem> = ExtractRule<T, ToYAMLRule>
export type ToEnterprise<T extends MetadataItem> = ExtractRule<T, ToEnterpriseRule>
export type ToTypedYAML<T extends MetadataItem> = ExtractRule<T, ToTypedYAMLRule>

type ToEnterpriseRule =
  // | [Button, ButtonEnterprise]
  // | [ButtonGroup, ButtonGroupEnterprise]
  // | [CalendarField, CalendarFieldEnterprise]
  // | [ChartField, ChartFieldPartialYAML]
  // | [CheckBoxField, CheckBoxFieldEnterprise]
  // | [ColumnGroup, ColumnGroupEnterprise]
  // | [CommandBar, CommandBarEnterprise]
  // | [DendrogramField, DendrogramFieldEnterprise]
  // | [FormattedDocumentField, FormattedDocumentFieldPartialYAML]
  // | [GanttChartField, GanttChartFieldEnterprise]
  // | [GeographicalSchemaField, GeographicalSchemaFieldEnterprise]
  // | [GraphicalSchemaField, GraphicalSchemaFieldEnterprise]
  // | [HTMLDocumentField, HTMLDocumentFieldPartialYAML]
  [InputField, InputFieldEnterprise]
// | [LabelDecoration, LabelDecorationEnterprise]
// | [LabelField, LabelFieldEnterprise]
// | [Page, PageEnterprise]
// | [Pages, PagesEnterprise]
// | [PdfDocumentField, PdfDocumentFieldEnterprise]
// | [PeriodField, PeriodFieldEnterprise]
// | [PictureDecoration, PictureDecorationEnterprise]
// | [PictureField, PictureFieldEnterprise]
// | [PlannerField, PlannerFieldEnterprise]
// | [Popup, PopupEnterprise]
// | [ProgressBarField, ProgressBarFieldEnterprise]
// | [RadioButtonField, RadioButtonFieldEnterprise]
// | [SpreadSheetDocumentField, SpreadSheetDocumentFieldEnterprise]
// | [Table, TableEnterprise]
// | [SearchControlAddition, SearchControlAdditionEnterprise]
// | [SingleSearchControlAddition, SingleSearchControlAdditionEnterprise]
// | [SingleSearchStringAddition, SingleSearchStringAdditionEnterprise]
// | [SearchStringAddition, SearchStringAdditionEnterprise]
// | [TextDocumentField, TextDocumentFieldEnterprise]
// | [TrackBarField, TrackBarFieldEnterprise]
// | [UsualGroup, UsualGroupEnterprise]
// | [ContextMenu, ContextMenuEnterprise]
// | [CommandBar, CommandBarEnterprise]
// | [ExtendedTooltip, ExtendedTooltipEnterprise]

type ToYAMLRule =
  | [Button, ButtonPartialYAML]
  | [ButtonGroup, ButtonGroupPartialYAML]
  | [CalendarField, CalendarFieldPartialYAML]
  | [ChartField, ChartFieldPartialYAML]
  | [CheckBoxField, CheckBoxFieldPartialYAML]
  | [ColumnGroup, ColumnGroupPartialYAML]
  | [CommandBar, CommandBarPartialYAML]
  | [DendrogramField, DendrogramFieldPartialYAML]
  | [FormattedDocumentField, FormattedDocumentFieldPartialYAML]
  | [GanttChartField, GanttChartFieldPartialYAML]
  | [GeographicalSchemaField, GeographicalSchemaFieldPartialYAML]
  | [GraphicalSchemaField, GraphicalSchemaFieldPartialYAML]
  | [HTMLDocumentField, HTMLDocumentFieldPartialYAML]
  | [InputField, InputFieldPartialYAML]
  | [LabelDecoration, LabelDecorationPartialYAML]
  | [LabelField, LabelFieldPartialYAML]
  | [Page, PagePartialYAML]
  | [Pages, PagesPartialYAML]
  | [PdfDocumentField, PdfDocumentFieldPartialYAML]
  | [PeriodField, PeriodFieldPartialYAML]
  | [PictureDecoration, PictureDecorationPartialYAML]
  | [PictureField, PictureFieldPartialYAML]
  | [PlannerField, PlannerFieldPartialYAML]
  | [Popup, PopupPartialYAML]
  | [ProgressBarField, ProgressBarFieldPartialYAML]
  | [RadioButtonField, RadioButtonFieldPartialYAML]
  | [SpreadSheetDocumentField, SpreadSheetDocumentFieldPartialYAML]
  | [Table, TablePartialYAML]
  | [SearchControlAddition, SearchControlAdditionYAML]
  | [SingleSearchControlAddition, SingleSearchControlAdditionYAML]
  | [SingleSearchStringAddition, SingleSearchStringAdditionYAML]
  | [SearchStringAddition, SearchStringAdditionYAML]
  | [TextDocumentField, TextDocumentFieldPartialYAML]
  | [TrackBarField, TrackBarFieldPartialYAML]
  | [UsualGroup, UsualGroupPartialYAML]
  | [ContextMenu, ContextMenuYAML]
  | [CommandBar, CommandBarPartialYAML]
  | [ExtendedTooltip, ExtendedTooltipYAML]
  // etc
  | [ClientApplicationForm, ClientApplicationFormYAML]
  | [FormAttribute, FormAttributeYAML]
  | [FormAttributeColumn, FormAttributeColumnYAML]
  | [CommandInterface, CommandInterfaceYAML]
  | [CommandInterfaceItem, CommandInterfaceItemYAML]
  // metadata
  | [MetadataCatalog, MetadataCatalogYAML]

type ToTypedYAMLRule =
  | [Button, ButtonTypedYAML]
  | [ButtonGroup, ButtonGroupTypedYAML]
  | [Popup, PopupTypedYAML]
  | [CheckBoxField, CheckBoxFieldTypedYAML]
  | [ColumnGroup, ColumnGroupTypedYAML]
  | [InputField, InputFieldTypedYAML]
  | [LabelField, LabelFieldTypedYAML]
  | [PictureField, PictureFieldTypedYAML]

type ExtractRule<T extends MetadataItem | undefined, M> = T extends undefined
  ? undefined
  : M extends [infer F, infer R]
    ? F extends MetadataItem
      ? F["itemType"] extends NonNullable<T>["itemType"]
        ? R
        : never
      : never
    : never
