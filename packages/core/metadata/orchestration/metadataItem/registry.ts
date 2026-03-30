import {
  AppearanceFields,
  AppearanceFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/appearanceFields/types"
import {
  AvailableFields,
  AvailableFieldsYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/availableFields/types"
import {
  ConditionalAppearanceItem,
  ConditionalAppearanceItemYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/types"
import {
  CalculatedField,
  CalculatedFieldYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedField/types"
import {
  CalculatedFieldOrderExpressionItem,
  CalculatedFieldOrderExpressionItemYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/types"
import type {
  CalculatedFieldUseRestriction,
  CalculatedFieldUseRestrictionYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/calculatedFieldUseRestriction/types"
import { Filter, FilterYAML } from "~/metadata/commonObjects/dataCompositionSystem/filter/types"
import {
  FilterItemComparison,
  FilterItemComparisonYAML,
  FilterItemGroup,
  FilterItemGroupYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/filterItem/types"
import {
  GroupItemAuto,
  GroupItemAutoYAML,
  GroupItemField,
  GroupItemFieldYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/groupItem/types"
import {
  StructureItemGroup,
  StructureItemGroupYAML,
} from "~/metadata/commonObjects/dataCompositionSystem/structureItemGroup/types"
import { MetadataAttribute, MetadataAttributeYAML } from "~/metadata/commonObjects/metadataAttribute/types"
import {
  MetadataTabularSection,
  MetadataTabularSectionYAML,
} from "~/metadata/commonObjects/metadataTabularSection/types"
import {
  AutoCommandBar,
  AutoCommandBarEnterprise,
  AutoCommandBarYAML,
} from "~/metadata/forms/elements/autoCommandBar/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
  ViewStatusAdditionYAML,
} from "~/metadata/forms/elements/viewStatusAddition/types"
// import { Configuration, ConfigurationYAML } from "../../appliedObjects/configuration"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"
import { DynamicList, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"
import { FormCommand, FormCommandYAML } from "~/metadata/forms/commonObjects/formCommand/types"
import { MetadataCatalog, MetadataCatalogYAML } from "../../appliedObjects/metadataCatalog"
import { MetadataCommand, MetadataCommandYAML } from "../../appliedObjects/metadataCommand/types"
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
  TableCheckBoxField,
  TableCheckBoxFieldEnterprise,
  TableCheckBoxFieldPartialYAML,
  TableCheckBoxFieldTypedYAML,
} from "../../forms/elements/checkBoxField/types"
import {
  ColumnGroup,
  ColumnGroupEnterprise,
  ColumnGroupPartialYAML,
  ColumnGroupTypedYAML,
} from "../../forms/elements/columnGroup/types"
import { CommandBar, CommandBarEnterprise, CommandBarPartialYAML } from "../../forms/elements/commandBar/types"
import { ContextMenu, ContextMenuEnterprise, ContextMenuYAML } from "../../forms/elements/contextMenu/types"
import {
  DendrogramField,
  DendrogramFieldEnterprise,
  DendrogramFieldPartialYAML,
} from "../../forms/elements/dendrogramField/types"
import {
  ExtendedTooltip,
  ExtendedTooltipEnterprise,
  ExtendedTooltipYAML,
} from "../../forms/elements/extendedTooltip/types"
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
  TableInputField,
  TableInputFieldEnterprise,
  TableInputFieldPartialYAML,
  TableInputFieldTypedYAML,
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
  TableLabelField,
  TableLabelFieldEnterprise,
  TableLabelFieldPartialYAML,
  TableLabelFieldTypedYAML,
} from "../../forms/elements/labelField/types"
import { Page, PageEnterprise, PagePartialYAML } from "../../forms/elements/page/types"
import { Pages, PagesEnterprise, PagesPartialYAML } from "../../forms/elements/pages/types"
import {
  PDFDocumentField,
  PDFDocumentFieldEnterprise,
  PDFDocumentFieldPartialYAML,
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
  TablePictureField,
  TablePictureFieldEnterprise,
  TablePictureFieldPartialYAML,
  TablePictureFieldTypedYAML,
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
  SearchControlAdditionEnterprise,
  SearchControlAdditionYAML,
  SingleSearchControlAddition,
  SingleSearchControlAdditionEnterprise,
  SingleSearchControlAdditionYAML,
} from "../../forms/elements/searchControlAddition/types"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
  SearchStringAdditionYAML,
  SingleSearchStringAddition,
  SingleSearchStringAdditionEnterprise,
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
    enterprise: CheckBoxFieldEnterprise
  }
  TableCheckBoxField: {
    metadata: TableCheckBoxField
    yaml: TableCheckBoxFieldPartialYAML
    yamlTyped: TableCheckBoxFieldTypedYAML
    enterprise: TableCheckBoxFieldEnterprise
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
    enterprise: InputFieldEnterprise
  }
  TableInputField: {
    metadata: TableInputField
    yaml: TableInputFieldPartialYAML
    yamlTyped: TableInputFieldTypedYAML
    enterprise: TableInputFieldEnterprise
  }
  LabelDecoration: {
    metadata: LabelDecoration
    yaml: LabelDecorationPartialYAML
    enterprise: LabelDecorationEnterprise
  }
  LabelField: {
    metadata: LabelField
    yaml: LabelFieldPartialYAML
    enterprise: LabelFieldEnterprise
  }
  TableLabelField: {
    metadata: TableLabelField
    yaml: TableLabelFieldPartialYAML
    yamlTyped: TableLabelFieldTypedYAML
    enterprise: TableLabelFieldEnterprise
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
  PDFDocumentField: {
    metadata: PDFDocumentField
    yaml: PDFDocumentFieldPartialYAML
    enterprise: PDFDocumentFieldEnterprise
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
    enterprise: PictureFieldEnterprise
  }
  TablePictureField: {
    metadata: TablePictureField
    yaml: TablePictureFieldPartialYAML
    yamlTyped: TablePictureFieldTypedYAML
    enterprise: TablePictureFieldEnterprise
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
    enterprise: SearchControlAdditionEnterprise
  }

  SearchStringAddition: {
    metadata: SearchStringAddition
    yaml: SearchStringAdditionYAML
    enterprise: SearchStringAdditionEnterprise
  }

  //#endregion

  //#region Single elements
  ContextMenu: {
    metadata: ContextMenu
    yaml: ContextMenuYAML
    enterprise: ContextMenuEnterprise
  }
  ExtendedTooltip: {
    metadata: ExtendedTooltip
    yaml: ExtendedTooltipYAML
    enterprise: ExtendedTooltipEnterprise
  }
  SingleSearchControlAddition: {
    metadata: SingleSearchControlAddition
    yaml: SingleSearchControlAdditionYAML
    enterprise: SingleSearchControlAdditionEnterprise
  }

  SingleSearchStringAddition: {
    metadata: SingleSearchStringAddition
    yaml: SingleSearchStringAdditionYAML
    enterprise: SingleSearchStringAdditionEnterprise
  }

  ViewStatusAddition: {
    metadata: ViewStatusAddition
    yaml: ViewStatusAdditionYAML
    enterprise: ViewStatusAdditionEnterprise
  }
  AutoCommandBar: {
    metadata: AutoCommandBar
    yaml: AutoCommandBarYAML
    enterprise: AutoCommandBarEnterprise
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
  }

  FormAttributeColumn: {
    metadata: FormAttributeColumn
    yaml: FormAttributeColumnYAML
  }
  FormCommand: {
    metadata: FormCommand
    yaml: FormCommandYAML
  }
  DynamicList: {
    metadata: DynamicList
    yaml: DynamicListYAML
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
    yaml: MetadataAttributeYAML
  }

  MetadataTabularSection: {
    metadata: MetadataTabularSection
    yaml: MetadataTabularSectionYAML
  }

  StandardAttributeDescription: {
    metadata: StandardAttributeDescription
    yaml: StandardAttributeDescriptionYAML
  }

  AppearanceFields: {
    metadata: AppearanceFields
    yaml: AppearanceFieldsYAML
  }
  CalculatedField: {
    metadata: CalculatedField
    yaml: CalculatedFieldYAML
  }
  CalculatedFieldUseRestriction: {
    metadata: CalculatedFieldUseRestriction
    yaml: CalculatedFieldUseRestrictionYAML
  }
  CalculatedFieldOrderExpression: {
    metadata: CalculatedFieldOrderExpressionItem
    yaml: CalculatedFieldOrderExpressionItemYAML
  }
  ConditionalAppearanceItem: {
    metadata: ConditionalAppearanceItem
    yaml: ConditionalAppearanceItemYAML
  }
  Filter: {
    metadata: Filter
    yaml: FilterYAML
  }
  AvailableFields: {
    metadata: AvailableFields
    yaml: AvailableFieldsYAML
  }
  FilterItemComparison: {
    metadata: FilterItemComparison
    yaml: FilterItemComparisonYAML
  }
  FilterItemGroup: {
    metadata: FilterItemGroup
    yaml: FilterItemGroupYAML
  }
  GroupItemField: {
    metadata: GroupItemField
    yaml: GroupItemFieldYAML
  }
  GroupItemAuto: {
    metadata: GroupItemAuto
    yaml: GroupItemAutoYAML
  }
  StructureItemGroup: {
    metadata: StructureItemGroup
    yaml: StructureItemGroupYAML
  }

  //#endregion

  //#region Applied objects
  // Configuration: {
  //   metadata: Configuration
  //   yaml: ConfigurationYAML
  // }

  MetadataCatalog: {
    metadata: MetadataCatalog
    yaml: MetadataCatalogYAML
  }

  MetadataCommand: {
    metadata: MetadataCommand
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

// export type ToReference<T extends MetadataItemType> = MetadataItemTypeRegistry[T]["reference"]
