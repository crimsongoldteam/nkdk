import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { exportPropertyToXML } from "~/metadata/orchestration/property/toXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FormAttribute, FormAttributeXML } from "./types"

const chartSettingsRule = {
  type: "Chart",
  xml: "Settings",
  yaml: "Диаграмма",
} as const satisfies PropertyRule

const spreadsheetDocumentSettingsRule = {
  type: "SpreadsheetDocument",
  xml: "Settings",
  yaml: "ТабличныйДокумент",
} as const satisfies PropertyRule

type TypedFormAttributeSettings = Pick<FormAttribute, "chart" | "spreadsheetDocument">

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

  if (xsiType === "mxl:SpreadsheetDocument" || xsiType?.endsWith(":SpreadsheetDocument")) {
    const spreadsheetDocument = importPropertyFromXML({
      context,
      rule: spreadsheetDocumentSettingsRule,
      value: settings,
      name: "spreadsheetDocument",
    }) as FormAttribute["spreadsheetDocument"] | undefined

    return spreadsheetDocument === undefined ? {} : { spreadsheetDocument }
  }

  return {}
}

export const exportTypedFormAttributeSettingsToXML = (
  context: ConfigurationContextWithExportToXML,
  data: TypedFormAttributeSettings
): FormAttributeXML["Settings"] | undefined => {
  const chart = exportPropertyToXML({
    context,
    rule: chartSettingsRule,
    value: data.chart,
  }) as FormAttributeXML["Settings"] | undefined

  if (chart !== undefined) return chart

  return exportPropertyToXML({
    context,
    rule: spreadsheetDocumentSettingsRule,
    value: data.spreadsheetDocument,
  }) as FormAttributeXML["Settings"] | undefined
}
