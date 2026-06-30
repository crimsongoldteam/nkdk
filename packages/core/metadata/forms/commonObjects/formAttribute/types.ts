import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"
import { StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { FieldsListYAML } from "~/metadata/commonObjects/fieldsList/types"
import { FunctionalOptionsYAML } from "~/metadata/commonObjects/functionalOptionsProperty/types"
import { I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import { TypeDescriptionXML, TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { UserEditKeysYAML, UserVisibleYAML, UserViewKeysYAML } from "~/metadata/commonObjects/userVisible/types"
import { ChartXML, ChartYAML } from "~/metadata/forms/commonObjects/chart/types"
import { DynamicListXML, DynamicListYAML } from "~/metadata/forms/commonObjects/dynamicList/types"
import { FlowchartContextXML, FlowchartContextYAML } from "~/metadata/forms/commonObjects/flowchartContext/types"
import { GanttChartXML, GanttChartYAML } from "~/metadata/forms/commonObjects/ganttChart/types"
import { PlannerXML, PlannerYAML } from "~/metadata/forms/commonObjects/planner/types"
import {
  SpreadsheetDocumentXML,
  SpreadsheetDocumentYAML,
} from "~/metadata/forms/commonObjects/spreadsheetDocument/types"
import { ElementXML } from "~/metadata/orchestration"
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { FillCheckingYAML } from "~/metadata/systemEnumerations/types"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export type FormAttribute = FormTypeByRule<typeof FormAttributeRules>

export type FormAttributeColumn = FormTypeByRule<typeof FormAttributeColumnRules>

export interface FormAttributeAdditionalColumns {
  table: string
  columns: FormAttributeColumn[]
}

export type FormAttributeColumns = FormAttributeColumn[]

export type FormAttributeAdditionalColumnsCollection = FormAttributeAdditionalColumns[]

export type FormAttributeAdditionalColumn = FormAttributeAdditionalColumns

export type FormAttributeWithAdditionalColumns = FormAttribute & {
  additionalColumns?: FormAttributeAdditionalColumns[]
}

interface SettingsTypeDescriptionXML extends TypeDescriptionXML {
  "_xsi:type": "v8:TypeDescription"
}

export interface FormAttributeColumnXML extends ElementXML {}

export interface FormAttributeAdditionalColumnXML {
  _table: string
  Column?: FormAttributeColumnXML[]
}

export interface FormAttributeColumnsXML {
  Column?: FormAttributeColumnXML | FormAttributeColumnXML[]
  AdditionalColumns?: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[]
}

export interface FormAttributeXML extends ElementXML {
  Columns?: FormAttributeColumnsXML
  Settings?:
    | SettingsTypeDescriptionXML
    | DynamicListXML
    | ChartXML
    | GanttChartXML
    | FlowchartContextXML
    | SpreadsheetDocumentXML
    | PlannerXML
}

export interface ConditionalAppearanceXML {
  ConditionalAppearance: Record<string, unknown>
}

export interface FormAttributeColumnYAML {
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  [UserViewKeysYAML.Value]?: UserVisibleYAML
  [UserEditKeysYAML.Value]?: UserVisibleYAML
  Колонки?: Record<string, FormAttributeColumnYAML>
  ФункциональныеОпции?: FunctionalOptionsYAML
}

export interface FormAttributeAdditionalColumnYAML {
  [tableName: string]: Record<string, FormAttributeColumnYAML>
}

export type FormAttributeColumnsYAML = Record<string, FormAttributeColumnYAML>

export interface FormAttributeYAML {
  Заголовок?: I8nTextYAML
  Тип?: TypeDescriptionYAML
  ТипЗначения?: TypeDescriptionYAML
  ОсновнойРеквизит?: StringboolYAML
  СохраняемыеДанные?: StringboolYAML
  ДинамическийСписок?: DynamicListYAML
  Диаграмма?: ChartYAML
  ДиаграммаГанта?: GanttChartYAML
  ГрафическаяСхема?: FlowchartContextYAML
  ТабличныйДокумент?: SpreadsheetDocumentYAML
  Планировщик?: PlannerYAML
  [UserViewKeysYAML.Value]?: UserVisibleYAML
  [UserEditKeysYAML.Value]?: UserVisibleYAML
  Колонки?: FormAttributeColumnsYAML
  ДополнительныеКолонки?: FormAttributeAdditionalColumnYAML
  ФункциональныеОпции?: FunctionalOptionsYAML
  ИспользоватьВсегда?: FieldsListYAML
  ПроверкаЗаполнения?: FillCheckingYAML
  Сохранение?: FieldsListYAML
}

export type FormAttributes = FormAttribute[]

export type FormAttributesXML = (FormAttributeXML | ConditionalAppearanceXML)[]

export type FormAttributesYAML = Record<string, FormAttributeYAML>

export interface ChartWidePropertyRule extends WidePropertyRuleBase {
  type: "Chart"
}

export type ChartRuleParams = Omit<ChartWidePropertyRule, "type">

export function chartRule<const Params extends ChartRuleParams>(
  params: WideExactRuleParams<ChartRuleParams, Params>
): Readonly<{ type: "Chart" } & Params> {
  return defineWidePropertyRule("Chart", params)
}
export interface DynamicListWidePropertyRule extends WidePropertyRuleBase {
  type: "DynamicList"
}

export type DynamicListRuleParams = Omit<DynamicListWidePropertyRule, "type">

export function dynamicListRule<const Params extends DynamicListRuleParams>(
  params: WideExactRuleParams<DynamicListRuleParams, Params>
): Readonly<{ type: "DynamicList" } & Params> {
  return defineWidePropertyRule("DynamicList", params)
}
export interface FlowchartContextWidePropertyRule extends WidePropertyRuleBase {
  type: "FlowchartContext"
}

export type FlowchartContextRuleParams = Omit<FlowchartContextWidePropertyRule, "type">

export function flowchartContextRule<const Params extends FlowchartContextRuleParams>(
  params: WideExactRuleParams<FlowchartContextRuleParams, Params>
): Readonly<{ type: "FlowchartContext" } & Params> {
  return defineWidePropertyRule("FlowchartContext", params)
}
export interface FormAttributeAdditionalColumnsWidePropertyRule extends WidePropertyRuleBase {
  type: "FormAttributeAdditionalColumns"
}

export type FormAttributeAdditionalColumnsRuleParams = Omit<FormAttributeAdditionalColumnsWidePropertyRule, "type">

export function formAttributeAdditionalColumnsRule<const Params extends FormAttributeAdditionalColumnsRuleParams>(
  params: WideExactRuleParams<FormAttributeAdditionalColumnsRuleParams, Params>
): Readonly<{ type: "FormAttributeAdditionalColumns" } & Params> {
  return defineWidePropertyRule("FormAttributeAdditionalColumns", params)
}
export interface FormAttributeColumnsWidePropertyRule extends WidePropertyRuleBase {
  type: "FormAttributeColumns"
}

export type FormAttributeColumnsRuleParams = Omit<FormAttributeColumnsWidePropertyRule, "type">

export function formAttributeColumnsRule<const Params extends FormAttributeColumnsRuleParams>(
  params: WideExactRuleParams<FormAttributeColumnsRuleParams, Params>
): Readonly<{ type: "FormAttributeColumns" } & Params> {
  return defineWidePropertyRule("FormAttributeColumns", params)
}
export interface FormAttributesWidePropertyRule extends WidePropertyRuleBase {
  type: "FormAttributes"
}

export type FormAttributesRuleParams = Omit<FormAttributesWidePropertyRule, "type">

export function formAttributesRule<const Params extends FormAttributesRuleParams>(
  params: WideExactRuleParams<FormAttributesRuleParams, Params>
): Readonly<{ type: "FormAttributes" } & Params> {
  return defineWidePropertyRule("FormAttributes", params)
}
export interface GanttChartWidePropertyRule extends WidePropertyRuleBase {
  type: "GanttChart"
}

export type GanttChartRuleParams = Omit<GanttChartWidePropertyRule, "type">

export function ganttChartRule<const Params extends GanttChartRuleParams>(
  params: WideExactRuleParams<GanttChartRuleParams, Params>
): Readonly<{ type: "GanttChart" } & Params> {
  return defineWidePropertyRule("GanttChart", params)
}
export interface PlannerWidePropertyRule extends WidePropertyRuleBase {
  type: "Planner"
}

export type PlannerRuleParams = Omit<PlannerWidePropertyRule, "type">

export function plannerRule<const Params extends PlannerRuleParams>(
  params: WideExactRuleParams<PlannerRuleParams, Params>
): Readonly<{ type: "Planner" } & Params> {
  return defineWidePropertyRule("Planner", params)
}
export interface SpreadsheetDocumentWidePropertyRule extends WidePropertyRuleBase {
  type: "SpreadsheetDocument"
}

export type SpreadsheetDocumentRuleParams = Omit<SpreadsheetDocumentWidePropertyRule, "type">

export function spreadsheetDocumentRule<const Params extends SpreadsheetDocumentRuleParams>(
  params: WideExactRuleParams<SpreadsheetDocumentRuleParams, Params>
): Readonly<{ type: "SpreadsheetDocument" } & Params> {
  return defineWidePropertyRule("SpreadsheetDocument", params)
}
