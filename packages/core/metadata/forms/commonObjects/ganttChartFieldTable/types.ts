import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "../../../orchestration/property/types"
import type { TSchema } from "typebox"
import { getParentFromContext } from "../../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "../../../context/types"
import { TableRules } from "../../elements/table/rules"
import type { Table, TablePartialYAML } from "../../elements/table/types"
import { exportElementToJSONSchema } from "../../../orchestration/formElement/toJSONSchema"
import { importSingleFormElementFromXMLToYAML } from "../../elements/orchestration/fromXMLToYAML"
import { createSingletonElementYAMLToXMLNestedRule } from "../../elements/orchestration/ruleFactory"
import type { SingletonNameStyle } from "../../../orchestration/formElement/singletonName"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { ElementXML } from "../../../orchestration/formElement/types"
import type { ExportToJSONSchemaFn } from "../../../orchestration"

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

registerTypeRule("GanttChartFieldTable", "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
  importSingleFormElementFromXMLToYAML({
    context,
    rule: TableRules,
    xml: xml as ElementXML | undefined,
    ownerXmlName,
    nameStyle,
    traversal,
  })
)
registerTypeRule("GanttChartFieldTable", "nestedItemRule", { itemRule: TableRules })
registerTypeRule(
  "GanttChartFieldTable",
  "yamlToXMLNestedRule",
  createSingletonElementYAMLToXMLNestedRule({
    elementRule: TableRules,
    nameStyle,
    toXML: ({ context }) => ({ name: getGeneratedName(context, undefined) }),
    transformOutput: ({ xml, yaml, referenceXML }) => {
      const result: Record<string, unknown> = { ...xml }
      const yamlRecord = asRecord(yaml)
      for (const propertyKey of ["searchControl", "searchStringRepresentation", "viewStatusRepresentation"] as const) {
        const rule = TableRules.properties[propertyKey]
        if (rule?.yaml === undefined || rule.xml === undefined) continue
        if (Object.prototype.hasOwnProperty.call(yamlRecord ?? {}, rule.yaml)) continue
        if (Object.prototype.hasOwnProperty.call(referenceXML ?? {}, rule.xml)) continue
        delete result[rule.xml]
      }
      return result
    },
  })
)
registerTypeRule("GanttChartFieldTable", "exportToJSONSchema", exportGanttChartFieldTableToJSONSchema)

export interface GanttChartFieldTableWidePropertyRule extends WidePropertyRuleBase {
  type: "GanttChartFieldTable"
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export type GanttChartFieldTableRuleParams = Omit<GanttChartFieldTableWidePropertyRule, "type">

export function ganttChartFieldTableRule<const Params extends GanttChartFieldTableRuleParams>(
  params: WideExactRuleParams<GanttChartFieldTableRuleParams, Params>
): Readonly<{ type: "GanttChartFieldTable" } & Params> {
  return defineWidePropertyRule("GanttChartFieldTable", params)
}
