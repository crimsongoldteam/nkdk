import { describe, expect, it } from "vitest"
import type { DataPathAllowedKind, DataPathPropertyRule } from "@nkdk/runtime/rule-kit"
import { ButtonRules, CommandBarButtonRules } from "./button/rules"
import { CalendarFieldRules } from "./calendarField/rules"
import { ChartFieldRules } from "./chartField/rules"
import { CheckBoxFieldRules, TableCheckBoxFieldRules } from "./checkBoxField/rules"
import { DendrogramFieldRules } from "./dendrogramField/rules"
import { FormattedDocumentFieldRules } from "./formattedDocumentField/rules"
import { GanttChartFieldRules } from "./ganttChartField/rules"
import { GeographicalSchemaFieldRules } from "./geographicalSchemaField/rules"
import { GraphicalSchemaFieldRules } from "./graphicalSchemaField/rules"
import { HTMLDocumentFieldRules } from "./htmlDocumentField/rules"
import { InputFieldRules, TableInputFieldRules } from "./inputField/rules"
import { LabelFieldRules, TableLabelFieldRules } from "./labelField/rules"
import { PDFDocumentFieldRules } from "./pdfDocumentField/rules"
import { PeriodFieldRules } from "./periodField/rules"
import { PictureFieldRules, TablePictureFieldRules } from "./pictureField/rules"
import { PlannerFieldRules } from "./plannerField/rules"
import { ProgressBarFieldRules } from "./progressBarField/rules"
import { RadioButtonFieldRules } from "./radioButtonField/rules"
import { SpreadSheetDocumentFieldRules } from "./spreadSheetDocumentField/rules"
import { TableRules } from "./table/rules"
import { TextDocumentFieldRules } from "./textDocumentField/rules"
import { TrackBarFieldRules } from "./trackBarField/rules"

const inputKinds = matrixKinds(`
  string decimal boolean dateTime UUID Null <any> Picture Color Font ValueStorage TypeDescription
  ValueTable ValueListType StandardPeriod StandardBeginningDate DocumentRef.* CatalogRef.* EnumRef.* TaskRef.*
  BusinessProcessRef.* ExchangePlanRef.* ChartOfAccountsRef.* ChartOfCharacteristicTypesRef.*
  ChartOfCalculationTypesRef.* AccumulationRegisterRef.* AccountingRegisterRef.* InformationRegisterRef.*
  BusinessProcessRoutePointRef.* Characteristic.* DefinedType.* DocumentRef CatalogRef EnumRef TaskRef
  BusinessProcessRef ExchangePlanRef ChartOfAccountsRef ChartOfCharacteristicTypesRef ChartOfCalculationTypesRef
  BusinessProcessRoutePointRef AnyIBRef CatalogTabularSection.* <standard-enum> DataCompositionComparisonType
  ComparisonType DataCompositionGroupType DataCompositionSortDirection DataCompositionPeriodAdditionType
  Field Filter HorizontalAlign VerticalAlign
`)

const labelKinds = matrixKinds(`
  string decimal boolean dateTime UUID Null <any> Picture FormattedString ValueStorage TypeDescription
  ValueTable ValueTree ValueListType StandardPeriod DocumentRef.* CatalogRef.* EnumRef.* TaskRef.*
  BusinessProcessRef.* ExchangePlanRef.* ChartOfAccountsRef.* ChartOfCharacteristicTypesRef.*
  ChartOfCalculationTypesRef.* AccumulationRegisterRef.* AccountingRegisterRef.* InformationRegisterRef.*
  CalculationRegisterRef.* Characteristic.* DefinedType.* DocumentRef CatalogRef EnumRef TaskRef BusinessProcessRef
  ExchangePlanRef ChartOfAccountsRef ChartOfCharacteristicTypesRef ChartOfCalculationTypesRef
  BusinessProcessRoutePointRef AnyIBRef <standard-enum> DataCompositionSortDirection
`)

const tableKinds = [
  "DynamicList", "ValueTable", "ValueTree", "ValueListType", "GanttChart",
  "DocumentTabularSection.*", "CatalogTabularSection.*", "DataProcessorTabularSection.*",
  "ReportTabularSection.*", "ExchangePlanTabularSection.*", "BusinessProcessTabularSection.*",
  "TaskTabularSection.*", "ChartOfAccountsTabularSection.*",
  "ChartOfCharacteristicTypesTabularSection.*", "ChartOfCalculationTypesTabularSection.*",
  "ChartOfAccountsExtDimensionTypes.*", "InformationRegisterRecordSet.*",
  "AccumulationRegisterRecordSet.*", "AccountingRegisterRecordSet.*",
  "CalculationRegisterRecordSet.*",
] as const satisfies readonly DataPathAllowedKind[]

describe("form element DataPath policies", () => {
  it.each([
    [InputFieldRules, inputKinds],
    [TableInputFieldRules, inputKinds],
    [LabelFieldRules, labelKinds],
    [TableLabelFieldRules, labelKinds],
  ] as const)("declares the composite-enabled matrix for $itemType", (rule, expected) => {
    expect(dataPath(rule)).toMatchObject({ allowedKinds: expected, allowComposite: true })
  })

  it.each([CheckBoxFieldRules, TableCheckBoxFieldRules] as const)(
    "declares strict checkbox types for $itemType",
    (rule) => expect(dataPath(rule)).toMatchObject({ allowedKinds: ["boolean", "decimal"], allowComposite: false })
  )

  it.each([PictureFieldRules, TablePictureFieldRules] as const)(
    "declares strict picture types for $itemType",
    (rule) =>
      expect(dataPath(rule)).toMatchObject({
        allowedKinds: ["Picture", "string", "decimal", "boolean", "EnumRef.*", "ValueStorage"],
        allowComposite: false,
      })
  )

  it("declares strict radio and table matrices", () => {
    expect(dataPath(RadioButtonFieldRules)).toMatchObject({
      allowedKinds: [
        "string", "decimal", "CatalogRef.*", "DefinedType.*", "EnumRef.*",
        "FormattedString", "ChartOfAccountsRef.*", "ChartOfCharacteristicTypesRef.*", "<standard-enum>",
      ],
      allowComposite: false,
    })
    expect(dataPath(TableRules)).toMatchObject({ allowedKinds: tableKinds, allowComposite: false })
  })

  it.each([
    [SpreadSheetDocumentFieldRules, ["SpreadsheetDocument", "ValueTable"]],
    [HTMLDocumentFieldRules, ["string"]],
    [TextDocumentFieldRules, ["string", "TextDocument"]],
    [ProgressBarFieldRules, ["decimal"]],
    [TrackBarFieldRules, ["decimal"]],
    [FormattedDocumentFieldRules, ["FormattedDocument"]],
    [ChartFieldRules, ["Chart"]],
    [CalendarFieldRules, ["dateTime"]],
    [GraphicalSchemaFieldRules, ["FlowchartContextType"]],
    [PDFDocumentFieldRules, ["PDFDocument"]],
    [GanttChartFieldRules, ["GanttChart"]],
    [PlannerFieldRules, ["Planner"]],
    [GeographicalSchemaFieldRules, ["GeographicalSchema"]],
  ] as const)("declares the specialized matrix for $itemType", (rule, expected) => {
    expect(dataPath(rule)).toMatchObject({ allowedKinds: expected, allowComposite: false })
  })

  it("leaves explicitly excluded paths without a compatibility policy", () => {
    expect(dataPath(ButtonRules).allowedKinds).toBeUndefined()
    expect(dataPath(CommandBarButtonRules).allowedKinds).toBeUndefined()
    expect((TableRules.properties.rowPictureDataPath as DataPathPropertyRule).allowedKinds).toBeUndefined()
    expect(dataPath(DendrogramFieldRules).allowedKinds).toBeUndefined()
    expect(dataPath(PeriodFieldRules).allowedKinds).toBeUndefined()
  })
})

function dataPath(rule: { properties: Record<string, unknown> }): DataPathPropertyRule {
  return rule.properties.dataPath as DataPathPropertyRule
}

function matrixKinds(value: string): DataPathAllowedKind[] {
  return value.trim().split(/\s+/) as DataPathAllowedKind[]
}
