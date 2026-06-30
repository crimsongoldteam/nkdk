import { definePropertyRule as defineWidePropertyRule, type ExactRuleParams as WideExactRuleParams } from "~/metadata/commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "~/metadata/orchestration/property/types"

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
