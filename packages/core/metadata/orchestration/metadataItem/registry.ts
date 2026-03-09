import {
  AutoCommandBar,
  AutoCommandBarEnterprise,
  AutoCommandBarReference,
  AutoCommandBarYAML,
} from "~/metadata/forms/elements/autoCommandBar/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
  ViewStatusAdditionReference,
  ViewStatusAdditionYAML,
} from "~/metadata/forms/elements/viewStatusAddition/types"
// import { Configuration, ConfigurationYAML } from "../../appliedObjects/configuration"
import {
  MetadataAttribute,
  MetadataAttributeReference,
  MetadataAttributeYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import {
  MetadataTabularSection,
  MetadataTabularSectionReference,
  MetadataTabularSectionYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionReference,
  StandardAttributeDescriptionYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { FormCommand, FormCommandYAML, FormCommandYAML } from "~/metadata/forms/commonObjects/formCommand/types"
import { MetadataCatalog, MetadataCatalogReference, MetadataCatalogYAML } from "../../appliedObjects/metadataCatalog"
import {
  MetadataCommand,
  MetadataCommandReference,
  MetadataCommandYAML,
} from "../../appliedObjects/metadataCommand/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  ClientApplicationFormReference,
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
  FormAttributeColumnReference,
  FormAttributeColumnYAML,
  FormAttributeReference,
  FormAttributeYAML,
} from "../../forms/commonObjects/formAttribute/types"
import {
  Button,
  ButtonEnterprise,
  ButtonPartialYAML,
  ButtonReference,
  ButtonTypedYAML,
} from "../../forms/elements/button/types"
import {
  ButtonGroup,
  ButtonGroupEnterprise,
  ButtonGroupPartialYAML,
  ButtonGroupReference,
  ButtonGroupTypedYAML,
} from "../../forms/elements/buttonGroup/types"
import {
  CalendarField,
  CalendarFieldEnterprise,
  CalendarFieldPartialYAML,
  CalendarFieldReference,
} from "../../forms/elements/calendarField/types"
import {
  ChartField,
  ChartFieldEnterprise,
  ChartFieldPartialYAML,
  ChartFieldReference,
} from "../../forms/elements/chartField/types"
import {
  CheckBoxField,
  CheckBoxFieldEnterprise,
  CheckBoxFieldPartialYAML,
  CheckBoxFieldReference,
  CheckBoxFieldTypedYAML,
} from "../../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupEnterprise,
  ColumnGroupPartialYAML,
  ColumnGroupReference,
  ColumnGroupTypedYAML,
} from "../../forms/elements/columnGroup/types"
import {
  CommandBar,
  CommandBarEnterprise,
  CommandBarPartialYAML,
  CommandBarReference,
} from "../../forms/elements/commandBar/types"
import {
  ContextMenu,
  ContextMenuEnterprise,
  ContextMenuReference,
  ContextMenuYAML,
} from "../../forms/elements/contextMenu/types"
import {
  DendrogramField,
  DendrogramFieldEnterprise,
  DendrogramFieldPartialYAML,
  DendrogramFieldReference,
} from "../../forms/elements/dendrogramField/types"
import {
  ExtendedTooltip,
  ExtendedTooltipEnterprise,
  ExtendedTooltipReference,
  ExtendedTooltipYAML,
} from "../../forms/elements/extendedTooltip/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldEnterprise,
  FormattedDocumentFieldPartialYAML,
  FormattedDocumentFieldReference,
} from "../../forms/elements/formattedDocumentField/types"
import {
  GanttChartField,
  GanttChartFieldEnterprise,
  GanttChartFieldPartialYAML,
  GanttChartFieldReference,
} from "../../forms/elements/ganttChartField/types"
import {
  GeographicalSchemaField,
  GeographicalSchemaFieldEnterprise,
  GeographicalSchemaFieldPartialYAML,
  GeographicalSchemaFieldReference,
} from "../../forms/elements/geographicalSchemaField/types"
import {
  GraphicalSchemaField,
  GraphicalSchemaFieldEnterprise,
  GraphicalSchemaFieldPartialYAML,
  GraphicalSchemaFieldReference,
} from "../../forms/elements/graphicalSchemaField/types"
import {
  HTMLDocumentField,
  HTMLDocumentFieldEnterprise,
  HTMLDocumentFieldPartialYAML,
  HTMLDocumentFieldReference,
} from "../../forms/elements/htmlDocumentField/types"
import {
  InputField,
  InputFieldEnterprise,
  InputFieldPartialYAML,
  InputFieldReference,
  InputFieldTypedYAML,
} from "../../forms/elements/inputField/types"
import {
  LabelDecoration,
  LabelDecorationEnterprise,
  LabelDecorationPartialYAML,
  LabelDecorationReference,
} from "../../forms/elements/labelDecoration/types"
import {
  LabelField,
  LabelFieldEnterprise,
  LabelFieldPartialYAML,
  LabelFieldReference,
  LabelFieldTypedYAML,
} from "../../forms/elements/labelField/types"
import { Page, PageEnterprise, PagePartialYAML, PageReference } from "../../forms/elements/page/types"
import { Pages, PagesEnterprise, PagesPartialYAML, PagesReference } from "../../forms/elements/pages/types"
import {
  PDFDocumentField,
  PDFDocumentFieldEnterprise,
  PDFDocumentFieldPartialYAML,
  PDFDocumentFieldReference,
} from "../../forms/elements/pdfDocumentField/types"
import {
  PeriodField,
  PeriodFieldEnterprise,
  PeriodFieldPartialYAML,
  PeriodFieldReference,
} from "../../forms/elements/periodField/types"
import {
  PictureDecoration,
  PictureDecorationEnterprise,
  PictureDecorationPartialYAML,
  PictureDecorationReference,
} from "../../forms/elements/pictureDecoration/types"
import {
  PictureField,
  PictureFieldEnterprise,
  PictureFieldPartialYAML,
  PictureFieldReference,
  PictureFieldTypedYAML,
} from "../../forms/elements/pictureField/types"
import {
  PlannerField,
  PlannerFieldEnterprise,
  PlannerFieldPartialYAML,
  PlannerFieldReference,
} from "../../forms/elements/plannerField/types"
import {
  Popup,
  PopupEnterprise,
  PopupPartialYAML,
  PopupReference,
  PopupTypedYAML,
} from "../../forms/elements/popup/types"
import {
  ProgressBarField,
  ProgressBarFieldEnterprise,
  ProgressBarFieldPartialYAML,
  ProgressBarFieldReference,
} from "../../forms/elements/progressBarField/types"
import {
  RadioButtonField,
  RadioButtonFieldEnterprise,
  RadioButtonFieldPartialYAML,
  RadioButtonFieldReference,
} from "../../forms/elements/radioButtonField/types"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
  SearchControlAdditionReference,
  SearchControlAdditionYAML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
  SingleSearchControlAdditionReference,
  SingleSearchControlAdditionYAML,
} from "../../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionReference,
  SearchStringAdditionYAML,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
  SingleSearchStringAdditionReference,
  SingleSearchStringAdditionYAML,
} from "../../forms/elements/searchStringAddition/types"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldEnterprise,
  SpreadSheetDocumentFieldPartialYAML,
  SpreadSheetDocumentFieldReference,
} from "../../forms/elements/spreadSheetDocumentField/types"
import { Table, TableEnterprise, TablePartialYAML, TableReference } from "../../forms/elements/table/types"
import {
  TextDocumentField,
  TextDocumentFieldEnterprise,
  TextDocumentFieldPartialYAML,
  TextDocumentFieldReference,
} from "../../forms/elements/textDocumentField/types"
import {
  TrackBarField,
  TrackBarFieldEnterprise,
  TrackBarFieldPartialYAML,
  TrackBarFieldReference,
} from "../../forms/elements/trackBarField/types"
import {
  UsualGroup,
  UsualGroupEnterprise,
  UsualGroupPartialYAML,
  UsualGroupReference,
} from "../../forms/elements/usualGroup/types"
import { TypedFormElementType } from "../formElement/types"

export type MetadataItemTypeRegistry = {
  //#region Elements

  Button: {
    metadata: Button
    reference: ButtonReference
    yaml: ButtonPartialYAML
    yamlTyped: ButtonTypedYAML
    enterprise: ButtonEnterprise
  }
  ButtonGroup: {
    metadata: ButtonGroup
    reference: ButtonGroupReference
    yaml: ButtonGroupPartialYAML
    yamlTyped: ButtonGroupTypedYAML
    enterprise: ButtonGroupEnterprise
  }
  CalendarField: {
    metadata: CalendarField
    reference: CalendarFieldReference
    yaml: CalendarFieldPartialYAML
    enterprise: CalendarFieldEnterprise
  }
  ChartField: {
    metadata: ChartField
    reference: ChartFieldReference
    yaml: ChartFieldPartialYAML
    enterprise: ChartFieldEnterprise
  }
  CheckBoxField: {
    metadata: CheckBoxField
    reference: CheckBoxFieldReference
    yaml: CheckBoxFieldPartialYAML
    yamlTyped: CheckBoxFieldTypedYAML
    enterprise: CheckBoxFieldEnterprise
  }
  ColumnGroup: {
    metadata: ColumnGroup
    reference: ColumnGroupReference
    yaml: ColumnGroupPartialYAML
    yamlTyped: ColumnGroupTypedYAML
    enterprise: ColumnGroupEnterprise
  }
  CommandBar: {
    metadata: CommandBar
    reference: CommandBarReference
    yaml: CommandBarPartialYAML
    enterprise: CommandBarEnterprise
  }
  DendrogramField: {
    metadata: DendrogramField
    reference: DendrogramFieldReference
    yaml: DendrogramFieldPartialYAML
    enterprise: DendrogramFieldEnterprise
  }
  FormattedDocumentField: {
    metadata: FormattedDocumentField
    reference: FormattedDocumentFieldReference
    yaml: FormattedDocumentFieldPartialYAML
    enterprise: FormattedDocumentFieldEnterprise
  }
  GanttChartField: {
    metadata: GanttChartField
    reference: GanttChartFieldReference
    yaml: GanttChartFieldPartialYAML
    enterprise: GanttChartFieldEnterprise
  }
  GeographicalSchemaField: {
    metadata: GeographicalSchemaField
    reference: GeographicalSchemaFieldReference
    yaml: GeographicalSchemaFieldPartialYAML
    enterprise: GeographicalSchemaFieldEnterprise
  }
  GraphicalSchemaField: {
    metadata: GraphicalSchemaField
    reference: GraphicalSchemaFieldReference
    yaml: GraphicalSchemaFieldPartialYAML
    enterprise: GraphicalSchemaFieldEnterprise
  }
  HTMLDocumentField: {
    metadata: HTMLDocumentField
    reference: HTMLDocumentFieldReference
    yaml: HTMLDocumentFieldPartialYAML
    enterprise: HTMLDocumentFieldEnterprise
  }
  InputField: {
    metadata: InputField
    reference: InputFieldReference
    yaml: InputFieldPartialYAML
    yamlTyped: InputFieldTypedYAML
    enterprise: InputFieldEnterprise
  }
  LabelDecoration: {
    metadata: LabelDecoration
    reference: LabelDecorationReference
    yaml: LabelDecorationPartialYAML
    enterprise: LabelDecorationEnterprise
  }
  LabelField: {
    metadata: LabelField
    reference: LabelFieldReference
    yaml: LabelFieldPartialYAML
    yamlTyped: LabelFieldTypedYAML
    enterprise: LabelFieldEnterprise
  }
  Page: {
    metadata: Page
    reference: PageReference
    yaml: PagePartialYAML
    enterprise: PageEnterprise
  }
  Pages: {
    metadata: Pages
    reference: PagesReference
    yaml: PagesPartialYAML
    enterprise: PagesEnterprise
  }
  PDFDocumentField: {
    metadata: PDFDocumentField
    reference: PDFDocumentFieldReference
    yaml: PDFDocumentFieldPartialYAML
    enterprise: PDFDocumentFieldEnterprise
  }
  PeriodField: {
    metadata: PeriodField
    reference: PeriodFieldReference
    yaml: PeriodFieldPartialYAML
    enterprise: PeriodFieldEnterprise
  }
  PictureDecoration: {
    metadata: PictureDecoration
    reference: PictureDecorationReference
    yaml: PictureDecorationPartialYAML
    enterprise: PictureDecorationEnterprise
  }
  PictureField: {
    metadata: PictureField
    reference: PictureFieldReference
    yaml: PictureFieldPartialYAML
    yamlTyped: PictureFieldTypedYAML
    enterprise: PictureFieldEnterprise
  }
  PlannerField: {
    metadata: PlannerField
    reference: PlannerFieldReference
    yaml: PlannerFieldPartialYAML
    enterprise: PlannerFieldEnterprise
  }
  Popup: {
    metadata: Popup
    reference: PopupReference
    yaml: PopupPartialYAML
    yamlTyped: PopupTypedYAML
    enterprise: PopupEnterprise
  }
  ProgressBarField: {
    metadata: ProgressBarField
    reference: ProgressBarFieldReference
    yaml: ProgressBarFieldPartialYAML
    enterprise: ProgressBarFieldEnterprise
  }
  RadioButtonField: {
    metadata: RadioButtonField
    reference: RadioButtonFieldReference
    yaml: RadioButtonFieldPartialYAML
    enterprise: RadioButtonFieldEnterprise
  }
  SpreadSheetDocumentField: {
    metadata: SpreadSheetDocumentField
    reference: SpreadSheetDocumentFieldReference
    yaml: SpreadSheetDocumentFieldPartialYAML
    enterprise: SpreadSheetDocumentFieldEnterprise
  }
  Table: {
    metadata: Table
    reference: TableReference
    yaml: TablePartialYAML
    enterprise: TableEnterprise
  }
  TextDocumentField: {
    metadata: TextDocumentField
    reference: TextDocumentFieldReference
    yaml: TextDocumentFieldPartialYAML
    enterprise: TextDocumentFieldEnterprise
  }
  TrackBarField: {
    metadata: TrackBarField
    reference: TrackBarFieldReference
    yaml: TrackBarFieldPartialYAML
    enterprise: TrackBarFieldEnterprise
  }
  UsualGroup: {
    metadata: UsualGroup
    reference: UsualGroupReference
    yaml: UsualGroupPartialYAML
    enterprise: UsualGroupEnterprise
  }
  SearchControlAddition: {
    metadata: SearchControlAddition
    reference: SearchControlAdditionReference
    yaml: SearchControlAdditionYAML
    enterprise: SearchControlAdditionEnterprise
  }

  SearchStringAddition: {
    metadata: SearchStringAddition
    reference: SearchStringAdditionReference
    yaml: SearchStringAdditionYAML
    enterprise: SearchStringAdditionEnterprise
  }

  //#endregion

  //#region Single elements
  ContextMenu: {
    metadata: ContextMenu
    reference: ContextMenuReference
    yaml: ContextMenuYAML
    enterprise: ContextMenuEnterprise
  }
  ExtendedTooltip: {
    metadata: ExtendedTooltip
    reference: ExtendedTooltipReference
    yaml: ExtendedTooltipYAML
    enterprise: ExtendedTooltipEnterprise
  }
  SingleSearchControlAddition: {
    metadata: SingleSearchControlAddition
    reference: SingleSearchControlAdditionReference
    yaml: SingleSearchControlAdditionYAML
    enterprise: SingleSearchControlAdditionEnterprise
  }

  SingleSearchStringAddition: {
    metadata: SingleSearchStringAddition
    reference: SingleSearchStringAdditionReference
    yaml: SingleSearchStringAdditionYAML
    enterprise: SingleSearchStringAdditionEnterprise
  }

  ViewStatusAddition: {
    metadata: ViewStatusAddition
    reference: ViewStatusAdditionReference
    yaml: ViewStatusAdditionYAML
    enterprise: ViewStatusAdditionEnterprise
  }
  AutoCommandBar: {
    metadata: AutoCommandBar
    reference: AutoCommandBarReference
    yaml: AutoCommandBarYAML
    enterprise: AutoCommandBarEnterprise
  }

  //#endregion

  //#region Form objects
  ClientApplicationForm: {
    metadata: ClientApplicationForm
    reference: ClientApplicationFormReference
    yaml: ClientApplicationFormYAML
    enterprise: ClientApplicationFormEnterprise
  }
  FormAttribute: {
    metadata: FormAttribute
    reference: FormAttributeReference
    yaml: FormAttributeYAML
  }

  FormAttributeColumn: {
    metadata: FormAttributeColumn
    reference: FormAttributeColumnReference
    yaml: FormAttributeColumnYAML
  }
  FormCommand: {
    metadata: FormCommand
    reference: FormCommandReference
    yaml: FormCommandYAML
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

  MetadataAttribute: {
    metadata: MetadataAttribute
    reference: MetadataAttributeReference
    yaml: MetadataAttributeYAML
  }

  MetadataTabularSection: {
    metadata: MetadataTabularSection
    reference: MetadataTabularSectionReference
    yaml: MetadataTabularSectionYAML
  }

  StandardAttributeDescription: {
    metadata: StandardAttributeDescription
    reference: StandardAttributeDescriptionReference
    yaml: StandardAttributeDescriptionYAML
  }

  //#endregion

  //#region Applied objects
  // Configuration: {
  //   metadata: Configuration
  //   yaml: ConfigurationYAML
  // }

  MetadataCatalog: {
    metadata: MetadataCatalog
    reference: MetadataCatalogReference
    yaml: MetadataCatalogYAML
  }

  MetadataCommand: {
    metadata: MetadataCommand
    reference: MetadataCommandReference
    yaml: MetadataCommandYAML
  }

  //#endregion
}

export type MetadataItemType = keyof MetadataItemTypeRegistry

export type ToYAML<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["yaml"]
export type ToMetadata<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["metadata"]

export type EnterpriseExportableMetadataType = {
  [K in MetadataItemType]: MetadataItemTypeRegistry[K] extends { enterprise: unknown } ? K : never
}[MetadataItemType]

export type ToEnterprise<T extends EnterpriseExportableMetadataType> = MetadataItemTypeRegistry[T]["enterprise"]

export type ToTypedYAML<T extends TypedFormElementType> = MetadataItemTypeRegistry[T]["yamlTyped"]

export type ToReference<T extends MetadataItemType> = MetadataItemTypeRegistry[T] extends { reference: infer R }
  ? R
  : never
