import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import type { TSchema } from "typebox"
import { getParentFromContext } from "../../../context/helpers"
import type {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../../context/types"
import { TableRules } from "../../elements/table/rules"
import type { Table, TablePartialYAML } from "../../elements/table/types"
import { exportElementToJSONSchema } from "../../../orchestration/formElement/toJSONSchema"
import { importElementFromPartialYAML } from "../../../orchestration/formElement/fromYAML"
import { importElementFromXML } from "../../../orchestration/formElement/fromXML"
import { exportSingleElementToXML } from "../../../orchestration/formElement/toXML"
import { exportElementToPartialYAML } from "../../../orchestration/formElement/toYAML"
import {
  applyReferenceNameMode,
  attachReferenceNameMode,
  type SingletonNameStyle,
} from "../../../orchestration/formElement/singletonName"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { ElementXML, ElementXMLWithoutId } from "../../../orchestration/formElement/types"
import { XML_SOURCE_KEYS } from "../../../orchestration/property/helpers"
import type {
  ExportToJSONSchemaFn,
  ExportToXMLFunctionNew,
  ImportFromXMLFunction,
  PropertyRule,
} from "../../../orchestration"

export type GanttChartFieldTable = Table
export type GanttChartFieldTableYAML = TablePartialYAML

const nameStyle: SingletonNameStyle = {
  canonicalSuffix: "Таблица",
  referenceSuffixes: ["Таблица", "Table"],
  canonicalNameMode: "ownerSuffix",
}

const getGeneratedName = (
  context: ConfigurationContextWithExportToXML,
  table: GanttChartFieldTable | undefined
): string => {
  const parent = getParentFromContext(context, ["GanttChartField"])
  const parentName = parent.name || table?.name || "ДиаграммаГанта"
  return `${parentName}Таблица`
}

export const importGanttChartFieldTableFromXML: ImportFromXMLFunction = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: ElementXML | undefined,
  ownerXmlName?: string
): GanttChartFieldTable | undefined => {
  const table = importElementFromXML({
    context,
    itemType: "Table",
    xml,
  })
  if (table === undefined) return undefined
  if (!context.fromXML.forReference) return table

  return attachReferenceNameMode({
    model: table,
    xmlName: xml?._name,
    ownerXmlName,
    nameStyle,
  })
}

export const exportGanttChartFieldTableToXML: ExportToXMLFunctionNew = (params): ElementXMLWithoutId | undefined => {
  const value = params.value as GanttChartFieldTable | undefined
  if (value === undefined) return undefined

  const referenceMetadata = params.referenceMetadata as GanttChartFieldTable | undefined
  const generatedName = getGeneratedName(params.context, value)
  const name = applyReferenceNameMode({
    generatedName,
    referenceElement: referenceMetadata,
    nameStyle,
  })
  const table = { ...value, name }
  const referenceTable = referenceMetadata === undefined ? undefined : { ...referenceMetadata, name }

  const xml = exportSingleElementToXML({
    context: params.context,
    element: table,
    referenceElement: referenceTable,
    rule: TableRules,
    additionalParams: { name },
  })
  removeGeneratedSingletonXML(xml, table, referenceTable, "searchControl", "SearchControlAddition")
  removeGeneratedSingletonXML(xml, table, referenceTable, "searchStringRepresentation", "SearchStringAddition")
  removeGeneratedSingletonXML(xml, table, referenceTable, "viewStatusRepresentation", "ViewStatusAddition")

  return xml
}

const hasOwnDefinedValue = (value: unknown, key: string): boolean => {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value, key) &&
    (value as Record<string, unknown>)[key] !== undefined
  )
}

const hasReferenceXMLSource = (reference: unknown, key: string): boolean => {
  if (reference === null || reference === undefined || typeof reference !== "object") return false
  const sourceKeys = (reference as Record<PropertyKey, unknown>)[XML_SOURCE_KEYS]
  return (
    sourceKeys !== null &&
    sourceKeys !== undefined &&
    typeof sourceKeys === "object" &&
    Object.prototype.hasOwnProperty.call(sourceKeys, key)
  )
}

const removeGeneratedSingletonXML = (
  xml: ElementXMLWithoutId,
  value: GanttChartFieldTable,
  reference: GanttChartFieldTable | undefined,
  propertyKey: string,
  xmlKey: string
): void => {
  if (hasOwnDefinedValue(value, propertyKey)) return
  if (hasReferenceXMLSource(reference, propertyKey)) return
  delete (xml as Record<string, unknown>)[xmlKey]
}

export const exportGanttChartFieldTableToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: GanttChartFieldTable | undefined
): GanttChartFieldTableYAML | undefined => {
  return exportElementToPartialYAML({ context, element: data })
}

export const importGanttChartFieldTableFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: GanttChartFieldTableYAML | undefined,
  source?: GanttChartFieldTable
): GanttChartFieldTable | undefined => {
  if (yaml === undefined && source === undefined) return undefined
  const table = importElementFromPartialYAML({
    context,
    itemType: "Table",
    yaml,
    source,
  })
  if (table === undefined) return undefined

  return {
    ...table,
    name: table.name ?? source?.name ?? "Таблица",
  }
}

export const exportGanttChartFieldTableToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const value = (params.value as GanttChartFieldTable | undefined) ?? {
    itemType: "Table",
    name: "Таблица",
    childItems: [],
  }

  return exportElementToJSONSchema({
    context: params.context,
    value,
  })
}

registerTypeRule("GanttChartFieldTable", "importFromXML", importGanttChartFieldTableFromXML)
registerTypeRule("GanttChartFieldTable", "exportToXML", exportGanttChartFieldTableToXML)
registerTypeRule("GanttChartFieldTable", "exportToYAML", exportGanttChartFieldTableToYAML)
registerTypeRule("GanttChartFieldTable", "importFromYAML", importGanttChartFieldTableFromYAML)
registerTypeRule("GanttChartFieldTable", "exportToJSONSchema", exportGanttChartFieldTableToJSONSchema)

export interface GanttChartFieldTableWidePropertyRule extends WidePropertyRuleBase {
  type: "GanttChartFieldTable"
}

export type GanttChartFieldTableRuleParams = Omit<GanttChartFieldTableWidePropertyRule, "type">

export function ganttChartFieldTableRule<const Params extends GanttChartFieldTableRuleParams>(
  params: WideExactRuleParams<GanttChartFieldTableRuleParams, Params>
): Readonly<{ type: "GanttChartFieldTable" } & Params> {
  return defineWidePropertyRule("GanttChartFieldTable", params)
}
