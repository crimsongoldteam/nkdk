import { Configuration, ConfigurationYAML } from "../../appliedObjects/configuration"
import { MetadataCatalog, MetadataCatalogYAML } from "../../appliedObjects/metadataCatalog"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormYAML,
} from "../../forms/clientApplicationForm/types"
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
import { Button, ButtonEnterprise, ButtonPartialYAML, ButtonTypedYAML } from "../../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPartialYAML,
  ButtonGroupTypedYAML,
} from "../../forms/elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldEnterprise,
  CalendarFieldPartialYAML,
} from "../../forms/elements/calendarField/types"
import { ChartField, ChartFieldEnterprise, ChartFieldPartialYAML } from "../../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldEnterprise,
  CheckBoxFieldPartialYAML,
  CheckBoxFieldTypedYAML,
} from "../../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupEnterprise,
  ColumnGroupPartialYAML,
  ColumnGroupTypedYAML,
} from "../../forms/elements/columnGroup/types"
import { CommandBar, CommandBarEnterprise, CommandBarPartialYAML } from "../../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuYAML } from "../../forms/elements/contextMenu/types"
import {
  DendrogramField,
  DendrogramFieldEnterprise,
  DendrogramFieldPartialYAML,
} from "../../forms/elements/dendrogramField/types"
import { ExtendedTooltip, ExtendedTooltipYAML } from "../../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldPartialYAML,
} from "../../forms/elements/formattedDocumentField/types"
import {
  GanttChartField,
  GanttChartFieldEnterprise,
  GanttChartFieldPartialYAML,
} from "../../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialYAML,
} from "../../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldPartialYAML,
} from "../../forms/elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldEnterprise,
  HTMLDocumentFieldPartialYAML,
} from "../../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldEnterprise,
  InputFieldPartialYAML,
  InputFieldTypedYAML,
} from "../../forms/elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationEnterprise,
  LabelDecorationPartialYAML,
} from "../../forms/elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldEnterprise,
  LabelFieldPartialYAML,
  LabelFieldTypedYAML,
} from "../../forms/elements/labelField/types"
import { Page, PageEnterprise, PagePartialYAML } from "../../forms/elements/page/types"
import { Pages, PagesEnterprise, PagesPartialYAML } from "../../forms/elements/pages/types"
import {
  PdfDocumentField,
  PdfDocumentFieldEnterprise,
  PdfDocumentFieldPartialYAML,
} from "../../forms/elements/pdfDocumentField/types"
import { PeriodField, PeriodFieldEnterprise, PeriodFieldPartialYAML } from "../../forms/elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationEnterprise,
  PictureDecorationPartialYAML,
} from "../../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldEnterprise,
  PictureFieldPartialYAML,
  PictureFieldTypedYAML,
} from "../../forms/elements/pictureField/types"
import { PlannerField, PlannerFieldEnterprise, PlannerFieldPartialYAML } from "../../forms/elements/plannerField/types"
import { Popup, PopupEnterprise, PopupPartialYAML, PopupTypedYAML } from "../../forms/elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldEnterprise,
  ProgressBarFieldPartialYAML,
} from "../../forms/elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldEnterprise,
  RadioButtonFieldPartialYAML,
} from "../../forms/elements/radioButtonField/types"
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
  SpreadSheetDocumentFieldEnterprise,
  SpreadSheetDocumentFieldPartialYAML,
} from "../../forms/elements/spreadSheetDocumentField/types"
import { Table, TableEnterprise, TablePartialYAML } from "../../forms/elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldEnterprise,
  TextDocumentFieldPartialYAML,
} from "../../forms/elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldEnterprise,
  TrackBarFieldPartialYAML,
} from "../../forms/elements/trackBarField/types"
import { UsualGroup, UsualGroupEnterprise, UsualGroupPartialYAML } from "../../forms/elements/usualGroup/types"
import { TypedFormElementType } from "../formElement/types"

export type MetadataItemTypeRegistry = {
  //#region Elements
  Button: {
    metadata: Button
    yaml: ButtonPartialYAML
    yamlTyped: ButtonTypedYAML
    enterprise: ButtonEnterprise
  }
  ButtonGroup: {
    metadata: ButtonGroup
    yaml: ButtonGroupPartialYAML
    yamlTyped: ButtonGroupTypedYAML
    enterprise: ButtonGroupEnterprise
  }
  CalendarField: {
    metadata: CalendarField
    yaml: CalendarFieldPartialYAML
    enterprise: CalendarFieldEnterprise
  }
  ChartField: {
    metadata: ChartField
    yaml: ChartFieldPartialYAML
    enterprise: ChartFieldEnterprise
  }
  CheckBoxField: {
    metadata: CheckBoxField
    yaml: CheckBoxFieldPartialYAML
    yamlTyped: CheckBoxFieldTypedYAML
    enterprise: CheckBoxFieldEnterprise
  }
  ColumnGroup: {
    metadata: ColumnGroup
    yaml: ColumnGroupPartialYAML
    yamlTyped: ColumnGroupTypedYAML
    enterprise: ColumnGroupEnterprise
  }
  CommandBar: {
    metadata: CommandBar
    yaml: CommandBarPartialYAML
    enterprise: CommandBarEnterprise
  }
  DendrogramField: {
    metadata: DendrogramField
    yaml: DendrogramFieldPartialYAML
    enterprise: DendrogramFieldEnterprise
  }
  FormattedDocumentField: {
    metadata: FormattedDocumentField
    yaml: FormattedDocumentFieldPartialYAML
    enterprise: FormattedDocumentFieldEnterprise
  }
  GanttChartField: {
    metadata: GanttChartField
    yaml: GanttChartFieldPartialYAML
    enterprise: GanttChartFieldEnterprise
  }
  GeographicalSchemaField: {
    metadata: GeographicalSchemaField
    yaml: GeographicalSchemaFieldPartialYAML
    enterprise: GeographicalSchemaFieldEnterprise
  }
  GraphicalSchemaField: {
    metadata: GraphicalSchemaField
    yaml: GraphicalSchemaFieldPartialYAML
    enterprise: GraphicalSchemaFieldEnterprise
  }
  HTMLDocumentField: {
    metadata: HTMLDocumentField
    yaml: HTMLDocumentFieldPartialYAML
    enterprise: HTMLDocumentFieldEnterprise
  }
  InputField: {
    metadata: InputField
    yaml: InputFieldPartialYAML
    yamlTyped: InputFieldTypedYAML
    enterprise: InputFieldEnterprise
  }
  LabelDecoration: {
    metadata: LabelDecoration
    yaml: LabelDecorationPartialYAML
    enterprise: LabelDecorationEnterprise
  }
  LabelField: {
    metadata: LabelField
    yaml: LabelFieldPartialYAML
    yamlTyped: LabelFieldTypedYAML
    enterprise: LabelFieldEnterprise
  }
  Page: {
    metadata: Page
    yaml: PagePartialYAML
    enterprise: PageEnterprise
  }
  Pages: {
    metadata: Pages
    yaml: PagesPartialYAML
    enterprise: PagesEnterprise
  }
  PdfDocumentField: {
    metadata: PdfDocumentField
    yaml: PdfDocumentFieldPartialYAML
    enterprise: PdfDocumentFieldEnterprise
  }
  PeriodField: {
    metadata: PeriodField
    yaml: PeriodFieldPartialYAML
    enterprise: PeriodFieldEnterprise
  }
  PictureDecoration: {
    metadata: PictureDecoration
    yaml: PictureDecorationPartialYAML
    enterprise: PictureDecorationEnterprise
  }
  PictureField: {
    metadata: PictureField
    yaml: PictureFieldPartialYAML
    yamlTyped: PictureFieldTypedYAML
    enterprise: PictureFieldEnterprise
  }
  PlannerField: {
    metadata: PlannerField
    yaml: PlannerFieldPartialYAML
    enterprise: PlannerFieldEnterprise
  }
  Popup: {
    metadata: Popup
    yaml: PopupPartialYAML
    yamlTyped: PopupTypedYAML
    enterprise: PopupEnterprise
  }
  ProgressBarField: {
    metadata: ProgressBarField
    yaml: ProgressBarFieldPartialYAML
    enterprise: ProgressBarFieldEnterprise
  }
  RadioButtonField: {
    metadata: RadioButtonField
    yaml: RadioButtonFieldPartialYAML
    enterprise: RadioButtonFieldEnterprise
  }
  SpreadSheetDocumentField: {
    metadata: SpreadSheetDocumentField
    yaml: SpreadSheetDocumentFieldPartialYAML
    enterprise: SpreadSheetDocumentFieldEnterprise
  }
  Table: {
    metadata: Table
    yaml: TablePartialYAML
    enterprise: TableEnterprise
  }
  TextDocumentField: {
    metadata: TextDocumentField
    yaml: TextDocumentFieldPartialYAML
    enterprise: TextDocumentFieldEnterprise
  }
  TrackBarField: {
    metadata: TrackBarField
    yaml: TrackBarFieldPartialYAML
    enterprise: TrackBarFieldEnterprise
  }
  UsualGroup: {
    metadata: UsualGroup
    yaml: UsualGroupPartialYAML
    enterprise: UsualGroupEnterprise
  }
  SearchControlAddition: {
    metadata: SearchControlAddition
    yaml: SearchControlAdditionYAML
    enterprise: Record<string, unknown>
  }
  //#endregion

  //#region Single elements
  ContextMenu: {
    metadata: ContextMenu
    yaml: ContextMenuYAML
    enterprise: Record<string, unknown>
  }
  ExtendedTooltip: {
    metadata: ExtendedTooltip
    yaml: ExtendedTooltipYAML
    enterprise: Record<string, unknown>
  }
  SingleSearchControlAddition: {
    metadata: SingleSearchControlAddition
    yaml: SingleSearchControlAdditionYAML
    enterprise: Record<string, unknown>
  }
  SingleSearchStringAddition: {
    metadata: SingleSearchStringAddition
    yaml: SingleSearchStringAdditionYAML
    enterprise: Record<string, unknown>
  }
  SearchStringAddition: {
    metadata: SearchStringAddition
    yaml: SearchStringAdditionYAML
    enterprise: Record<string, unknown>
  }
  //#endregion

  //#region Form objects
  ClientApplicationForm: {
    metadata: ClientApplicationForm
    yaml: ClientApplicationFormYAML
    enterprise: ClientApplicationFormEnterprise
  }
  FormAttribute: {
    metadata: FormAttribute
    yaml: FormAttributeYAML
    enterprise: Record<string, unknown>
  }
  FormAttributeColumn: {
    metadata: FormAttributeColumn
    yaml: FormAttributeColumnYAML
    enterprise: Record<string, unknown>
  }
  //#endregion

  //#region Common objects

  CommandInterface: {
    metadata: CommandInterface
    yaml: CommandInterfaceYAML
    enterprise: Record<string, unknown>
  }
  CommandInterfaceItem: {
    metadata: CommandInterfaceItem
    yaml: CommandInterfaceItemYAML
    enterprise: Record<string, unknown>
  }

  //#endregion

  //#region Applied objects
  Configuration: {
    metadata: Configuration
    yaml: ConfigurationYAML
    enterprise: Record<string, unknown>
  }

  MetadataCatalog: {
    metadata: MetadataCatalog
    yaml: MetadataCatalogYAML
    enterprise: Record<string, unknown>
  }

  //#endregion
}

export type MetadataItemType = keyof MetadataItemTypeRegistry

export type MetadataItemTypeToYAML<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["yaml"]
export type MetadataItemTypeToMdItem<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["metadata"]
export type MetadataItemTypeToEnterprise<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["enterprise"]

export type MetadataItemTypeToTypedYAML<T extends TypedFormElementType> = MetadataItemTypeRegistry[T]["yamlTyped"]
