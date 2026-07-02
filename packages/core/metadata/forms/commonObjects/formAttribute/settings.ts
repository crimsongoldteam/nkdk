import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import "~/metadata/forms/commonObjects/flowchartContext/types"
import "~/metadata/forms/commonObjects/ganttChart/types"
import "~/metadata/forms/commonObjects/planner/types"
import type { FormAttribute, FormAttributeXML } from "./types"

const chartSettingsRule = {
  type: "Chart",
  xml: "Settings",
  yaml: "Диаграмма",
} as const satisfies PropertyRule

const ganttChartSettingsRule = {
  type: "GanttChart",
  xml: "Settings",
  yaml: "ДиаграммаГанта",
} as const satisfies PropertyRule

const flowchartContextSettingsRule = {
  type: "FlowchartContext",
  xml: "Settings",
  yaml: "ГрафическаяСхема",
} as const satisfies PropertyRule

const spreadsheetDocumentSettingsRule = {
  type: "SpreadsheetDocument",
  xml: "Settings",
  yaml: "ТабличныйДокумент",
} as const satisfies PropertyRule

const plannerSettingsRule = {
  type: "Planner",
  xml: "Settings",
  yaml: "Планировщик",
} as const satisfies PropertyRule

type TypedFormAttributeSettings = Pick<
  FormAttribute,
  "chart" | "ganttChart" | "flowchartContext" | "spreadsheetDocument" | "planner"
>

const getXsiType = (settings: FormAttributeXML["Settings"] | undefined): string | undefined => {
  if (settings === undefined || settings === null || typeof settings !== "object" || Array.isArray(settings)) {
    return undefined
  }

  const xsiType = settings["_xsi:type"]
  return typeof xsiType === "string" ? xsiType : undefined
}

export const importTypedFormAttributeSettingsFromXML = (
  context: ConfigurationContextFromXML,
  settings: FormAttributeXML["Settings"] | undefined
): TypedFormAttributeSettings => {
  const xsiType = getXsiType(settings)

  if (xsiType === "d4p1:Chart" || xsiType?.endsWith(":Chart")) {
    const chart = importPropertyFromXML({
      context,
      rule: chartSettingsRule,
      value: settings,
      name: "chart",
    }) as FormAttribute["chart"] | undefined

    return chart === undefined ? {} : { chart }
  }

  if (xsiType === "d4p1:GanttChart" || xsiType?.endsWith(":GanttChart")) {
    const ganttChart = importPropertyFromXML({
      context,
      rule: ganttChartSettingsRule,
      value: settings,
      name: "ganttChart",
    }) as FormAttribute["ganttChart"] | undefined

    return ganttChart === undefined ? {} : { ganttChart }
  }

  if (xsiType === "d4p1:FlowchartContextType" || xsiType?.endsWith(":FlowchartContextType")) {
    const flowchartContext = importPropertyFromXML({
      context,
      rule: flowchartContextSettingsRule,
      value: settings,
      name: "flowchartContext",
    }) as FormAttribute["flowchartContext"] | undefined

    return flowchartContext === undefined ? {} : { flowchartContext }
  }

  if (xsiType === "mxl:SpreadsheetDocument" || xsiType?.endsWith(":SpreadsheetDocument")) {
    const spreadsheetDocument = importPropertyFromXML({
      context,
      rule: spreadsheetDocumentSettingsRule,
      value: settings,
      name: "spreadsheetDocument",
    }) as FormAttribute["spreadsheetDocument"] | undefined

    return spreadsheetDocument === undefined ? {} : { spreadsheetDocument }
  }

  if (xsiType === "pl:Planner" || xsiType?.endsWith(":Planner")) {
    const planner = importPropertyFromXML({
      context,
      rule: plannerSettingsRule,
      value: settings,
      name: "planner",
    }) as FormAttribute["planner"] | undefined

    return planner === undefined ? {} : { planner }
  }

  return {}
}

export const exportTypedFormAttributeSettingsToXML = (
  context: ConfigurationContextWithExportToXML,
  data: TypedFormAttributeSettings,
  referenceData?: TypedFormAttributeSettings
): FormAttributeXML["Settings"] | undefined => {
  const chart = exportPropertyToXML({
    context,
    rule: chartSettingsRule,
    value: data.chart,
    referenceMetadata: referenceData?.chart,
  }) as FormAttributeXML["Settings"] | undefined

  if (chart !== undefined) return chart

  const ganttChart = exportPropertyToXML({
    context,
    rule: ganttChartSettingsRule,
    value: data.ganttChart,
    referenceMetadata: referenceData?.ganttChart,
  }) as FormAttributeXML["Settings"] | undefined

  if (ganttChart !== undefined) return ganttChart

  const flowchartContext = exportPropertyToXML({
    context,
    rule: flowchartContextSettingsRule,
    value: data.flowchartContext,
    referenceMetadata: referenceData?.flowchartContext,
  }) as FormAttributeXML["Settings"] | undefined

  if (flowchartContext !== undefined) return flowchartContext

  const spreadsheetDocument = exportPropertyToXML({
    context,
    rule: spreadsheetDocumentSettingsRule,
    value: data.spreadsheetDocument,
    referenceMetadata: referenceData?.spreadsheetDocument,
  }) as FormAttributeXML["Settings"] | undefined

  if (spreadsheetDocument !== undefined) return spreadsheetDocument

  const planner = exportPropertyToXML({
    context,
    rule: plannerSettingsRule,
    value: data.planner,
    referenceMetadata: referenceData?.planner,
  }) as FormAttributeXML["Settings"] | undefined

  if (planner !== undefined) return planner
}
