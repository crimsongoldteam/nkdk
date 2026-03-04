import { FormButtonType, FormDecorationType, FormFieldType, FormGroupType } from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { BaseElement } from "../../forms/elements/baseElement/types"
import { MetadataItemRule } from "../../metadataFactory"
import { ToNKDKResult } from "../../metadataFactory/elements/toNKDKGenerator/types"
import { EventXML } from "../event"
import { MetadataItemType } from "../metadataItem/registry"
import { ExportToEnterpriseFunction } from "../property/fn"

export type FormElementType = Extract<
  MetadataItemType,
  | "Button"
  | "ButtonGroup"
  | "CalendarField"
  | "ChartField"
  | "CheckBoxField"
  | "ColumnGroup"
  | "CommandBar"
  | "DendrogramField"
  | "FormattedDocumentField"
  | "GanttChartField"
  | "GeographicalSchemaField"
  | "GraphicalSchemaField"
  | "HTMLDocumentField"
  | "InputField"
  | "LabelDecoration"
  | "LabelField"
  | "Page"
  | "Pages"
  | "PdfDocumentField"
  | "PeriodField"
  | "PictureDecoration"
  | "PictureField"
  | "PlannerField"
  | "Popup"
  | "ProgressBarField"
  | "RadioButtonField"
  | "SpreadSheetDocumentField"
  | "Table"
  | "TextDocumentField"
  | "TrackBarField"
  | "UsualGroup"
  | "SearchControlAddition"
  | "SearchStringAddition"
>

// #region rules

export interface RegisterAsTypeRule<T extends BaseElement> {
  toXML: (context: ConfigurationContext, element: T | undefined) => { id: string; name: string }
}

export interface ElementRule extends Omit<MetadataItemRule, "itemType"> {
  itemType: FormElementType
  enterpriseField: "FormField" | "FormDecoration" | "FormTable" | "FormGroup" | "FormButton"
  enterpriseFieldType:
    | `FormFieldType.${FormFieldType}`
    | `FormButtonType.${FormButtonType}`
    | `FormGroupType.${FormGroupType}`
    | `FormDecorationType.${FormDecorationType}`
    | "None"
  alwaysExportToXML?: true
}

// #endregion

// #region xml

export interface ElementXML {
  _name: string
  _id: string
  [key: string]: any
}

export interface EventedXML extends ElementXML {
  Events: EventXML[] | EventXML
}

// #endregion

// #region factory

export type ExportToStructureFn = <From extends BaseElement>(context: ConfigurationContext, data: From) => ToNKDKResult

export type ExportToStructureContentFn = <From extends BaseElement>(
  context: ConfigurationContext,
  data: From
) => ToNKDKResult

export type ImportFromNKDKFn = <To extends BaseElement>(params: { context: ConfigurationContext; source: any }) => To

type fnPairs =
  | ["ExportToStructure", ExportToStructureFn]
  | ["ExportToStructureContent", ExportToStructureContentFn]
  | ["ExportToEnterprise", ExportToEnterpriseFunction]
  | ["ImportFromNKDK", ImportFromNKDKFn]

export type ItemOperationType = fnPairs extends infer T ? (T extends [infer Op, any] ? Op : never) : never

export type OperationFunction<Type extends ItemOperationType> = Extract<fnPairs, [Type, any]>[1]

// #endregion
