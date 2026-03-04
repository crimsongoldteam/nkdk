import { Configuration, ConfigurationYAML } from "../../appliedObjects/configuration"
import { MetadataCatalog, MetadataCatalogYAML } from "../../appliedObjects/metadataCatalog"
import { ClientApplicationForm, ClientApplicationFormYAML } from "../../forms/clientApplicationForm/types"
import {
  CommandInterface,
  CommandInterfaceItem,
  CommandInterfaceItemYAML,
  CommandInterfaceYAML,
} from "../../forms/commonObjects/commandInterface/types"
import {
  FormAttribute,
  FormAttributeColumn,
  FormAttributeColumnYAML,
  FormAttributeYAML,
} from "../../forms/commonObjects/formAttribute/types"
import { Button, ButtonPartialYAML } from "../../forms/elements/button/types"
import { ButtonGroup, ButtonGroupPartialYAML } from "../../forms/elements/buttonGroup/types"
import { CalendarField, CalendarFieldPartialYAML } from "../../forms/elements/calendarField/types"
import { ChartField, ChartFieldPartialYAML } from "../../forms/elements/chartField/types"
import { CheckBoxField, CheckBoxFieldPartialYAML } from "../../forms/elements/checkBoxField/types"
import { ColumnGroup, ColumnGroupPartialYAML } from "../../forms/elements/columnGroup/types"
import { CommandBar, CommandBarPartialYAML } from "../../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuYAML } from "../../forms/elements/contextMenu/types"
import { DendrogramField, DendrogramFieldPartialYAML } from "../../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldPartialYAML,
} from "../../forms/elements/formattedDocumentField/types"
import { GanttChartField, GanttChartFieldPartialYAML } from "../../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldPartialYAML,
} from "../../forms/elements/geographicalSchemaField/types"
import { GraphicalSchemaField, GraphicalSchemaFieldPartialYAML } from "../../forms/elements/graphicalSchemaField/types"
import { HTMLDocumentField, HTMLDocumentFieldPartialYAML } from "../../forms/elements/htmlDocumentField/types"
import { InputField, InputFieldPartialYAML } from "../../forms/elements/inputField/types"
import { LabelDecoration, LabelDecorationPartialYAML } from "../../forms/elements/labelDecoration/types"
import { LabelField, LabelFieldPartialYAML } from "../../forms/elements/labelField/types"
import { Page, PagePartialYAML } from "../../forms/elements/page/types"
import { Pages, PagesPartialYAML } from "../../forms/elements/pages/types"
import { PdfDocumentField, PdfDocumentFieldPartialYAML } from "../../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldPartialYAML } from "../../forms/elements/periodField/types"
import { PictureDecoration, PictureDecorationPartialYAML } from "../../forms/elements/pictureDecoration/types"
import { PictureField, PictureFieldPartialYAML } from "../../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldPartialYAML } from "../../forms/elements/plannerField/types"
import { Popup, PopupPartialYAML } from "../../forms/elements/popup/types"
import { ProgressBarField, ProgressBarFieldPartialYAML } from "../../forms/elements/progressBarField/types"
import { RadioButtonField, RadioButtonFieldPartialYAML } from "../../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionYAML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionYAML,
} from "../../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionYAML,
  SingleSearchStringAddition,
  SingleSearchStringAdditionYAML,
} from "../../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldPartialYAML,
} from "../../forms/elements/spreadSheetDocumentField/types"
import { Table, TablePartialYAML } from "../../forms/elements/table/types"
import { TextDocumentField, TextDocumentFieldPartialYAML } from "../../forms/elements/textDocumentField/types"
import { TrackBarField, TrackBarFieldPartialYAML } from "../../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupPartialYAML } from "../../forms/elements/usualGroup/types"

type MetadataItemTypeRegistry = {
  //#region Elements
  Button: {
    metadata: Button
    yaml: ButtonPartialYAML
  }
  ButtonGroup: {
    metadata: ButtonGroup
    yaml: ButtonGroupPartialYAML
  }
  CalendarField: {
    metadata: CalendarField
    yaml: CalendarFieldPartialYAML
  }
  ChartField: {
    metadata: ChartField
    yaml: ChartFieldPartialYAML
  }
  CheckBoxField: {
    metadata: CheckBoxField
    yaml: CheckBoxFieldPartialYAML
  }
  ColumnGroup: {
    metadata: ColumnGroup
    yaml: ColumnGroupPartialYAML
  }
  CommandBar: {
    metadata: CommandBar
    yaml: CommandBarPartialYAML
  }
  DendrogramField: {
    metadata: DendrogramField
    yaml: DendrogramFieldPartialYAML
  }
  FormattedDocumentField: {
    metadata: FormattedDocumentField
    yaml: FormattedDocumentFieldPartialYAML
  }
  GanttChartField: {
    metadata: GanttChartField
    yaml: GanttChartFieldPartialYAML
  }
  GeographicalSchemaField: {
    metadata: GeographicalSchemaField
    yaml: GeographicalSchemaFieldPartialYAML
  }
  GraphicalSchemaField: {
    metadata: GraphicalSchemaField
    yaml: GraphicalSchemaFieldPartialYAML
  }
  HTMLDocumentField: {
    metadata: HTMLDocumentField
    yaml: HTMLDocumentFieldPartialYAML
  }
  InputField: {
    metadata: InputField
    yaml: InputFieldPartialYAML
  }
  LabelDecoration: {
    metadata: LabelDecoration
    yaml: LabelDecorationPartialYAML
  }
  LabelField: {
    metadata: LabelField
    yaml: LabelFieldPartialYAML
  }
  Page: {
    metadata: Page
    yaml: PagePartialYAML
  }
  Pages: {
    metadata: Pages
    yaml: PagesPartialYAML
  }
  PdfDocumentField: {
    metadata: PdfDocumentField
    yaml: PdfDocumentFieldPartialYAML
  }
  PeriodField: {
    metadata: PeriodField
    yaml: PeriodFieldPartialYAML
  }
  PictureDecoration: {
    metadata: PictureDecoration
    yaml: PictureDecorationPartialYAML
  }
  PictureField: {
    metadata: PictureField
    yaml: PictureFieldPartialYAML
  }
  PlannerField: {
    metadata: PlannerField
    yaml: PlannerFieldPartialYAML
  }
  Popup: {
    metadata: Popup
    yaml: PopupPartialYAML
  }
  ProgressBarField: {
    metadata: ProgressBarField
    yaml: ProgressBarFieldPartialYAML
  }
  RadioButtonField: {
    metadata: RadioButtonField
    yaml: RadioButtonFieldPartialYAML
  }
  SpreadSheetDocumentField: {
    metadata: SpreadSheetDocumentField
    yaml: SpreadSheetDocumentFieldPartialYAML
  }
  Table: {
    metadata: Table
    yaml: TablePartialYAML
  }
  TextDocumentField: {
    metadata: TextDocumentField
    yaml: TextDocumentFieldPartialYAML
  }
  TrackBarField: {
    metadata: TrackBarField
    yaml: TrackBarFieldPartialYAML
  }
  UsualGroup: {
    metadata: UsualGroup
    yaml: UsualGroupPartialYAML
  }
  SearchControlAddition: {
    metadata: SearchControlAddition
    yaml: SearchControlAdditionYAML
  }
  //#endregion

  //#region Single elements
  ContextMenu: {
    metadata: ContextMenu
    yaml: ContextMenuYAML
  }
  ExtendedTooltip: {
    metadata: ExtendedTooltip
    yaml: ExtendedTooltipYAML
  }
  SingleSearchControlAddition: {
    metadata: SingleSearchControlAddition
    yaml: SingleSearchControlAdditionYAML
  }
  SingleSearchStringAddition: {
    metadata: SingleSearchStringAddition
    yaml: SingleSearchStringAdditionYAML
  }
  SearchStringAddition: {
    metadata: SearchStringAddition
    yaml: SearchStringAdditionYAML
  }
  //#endregion

  //#region Form objects
  ClientApplicationForm: {
    metadata: ClientApplicationForm
    yaml: ClientApplicationFormYAML
  }
  FormAttribute: {
    metadata: FormAttribute
    yaml: FormAttributeYAML
  }
  FormAttributeColumn: {
    metadata: FormAttributeColumn
    yaml: FormAttributeColumnYAML
  }
  //#endregion

  //#region Common objects

  CommandInterface: {
    metadata: CommandInterface
    yaml: CommandInterfaceYAML
  }
  CommandInterfaceItem: {
    metadata: CommandInterfaceItem
    yaml: CommandInterfaceItemYAML
  }

  //#endregion

  //#region Applied objects
  Configuration: {
    metadata: Configuration
    yaml: ConfigurationYAML
  }

  MetadataCatalog: {
    metadata: MetadataCatalog
    yaml: MetadataCatalogYAML
  }

  //#endregion
}

export type MetadataItemType = keyof MetadataItemTypeRegistry

export type ToYAML<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["yaml"]

export type ToMetadataItem<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["metadata"] // #endregion
