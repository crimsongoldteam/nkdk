import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type { PropertyRule as WidePropertyRuleBase } from "@nkdk/runtime/rule-kit"
import type { TSchema } from "typebox"
import { getParentFromContext } from "../../../context/helpers"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { TableRules } from "../../elements/table/rules"
import type { Table, TablePartialYAML } from "../../elements/table/types"
import { exportElementToJSONSchema } from "../../../ruleRuntime/formElement/toJSONSchema"
import { importSingleFormElementFromXMLToYAML } from "../../elements/ruleRuntime/fromXMLToYAML"
import { createSingletonElementYAMLToXMLNestedRule } from "../../elements/ruleRuntime/ruleFactory"
import {
  getCanonicalSingletonName,
  type SingletonNameStyle,
} from "../../../ruleRuntime/formElement/singletonName"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import type { ElementXML } from "../../../ruleRuntime/formElement/types"
import type { ExportToJSONSchemaFn } from "../../../ruleRuntime"

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

export const metadataPropertyRule000 = definePropertyTypeRule("GanttChartFieldTable", "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
  importSingleFormElementFromXMLToYAML({
    context,
    rule: TableRules,
    xml: xml as ElementXML | undefined,
    ownerXmlName,
    nameStyle,
    traversal,
  })
)
export const metadataPropertyRule001 = definePropertyTypeRule("GanttChartFieldTable", "nestedItemRule", { itemRule: TableRules })
export const metadataPropertyRule002 = definePropertyTypeRule("GanttChartFieldTable", "nestedItemIdentity", {
  reserveWhenAbsent: true,
  resolveName: (ownerName) =>
    getCanonicalSingletonName({
      ownerLogicalAddress: ownerName ?? "",
      nameStyle,
    }),
})
export const metadataPropertyRule003 = definePropertyTypeRule(
  "GanttChartFieldTable",
  "yamlToXMLNestedRule",
  createSingletonElementYAMLToXMLNestedRule({
    elementRule: TableRules,
    nameStyle,
    toXML: ({ context }) => ({ name: getGeneratedName(context, undefined) }),
  })
)
export const metadataPropertyRule004 = definePropertyTypeRule("GanttChartFieldTable", "exportToJSONSchema", exportGanttChartFieldTableToJSONSchema)

export interface GanttChartFieldTableWidePropertyRule extends WidePropertyRuleBase {
  type: "GanttChartFieldTable"
}

export type GanttChartFieldTableRuleParams = Omit<GanttChartFieldTableWidePropertyRule, "type">

export function ganttChartFieldTableRule<const Params extends GanttChartFieldTableRuleParams>(
  params: WideExactRuleParams<GanttChartFieldTableRuleParams, Params>
): Readonly<{ type: "GanttChartFieldTable" } & Params> {
  return defineWidePropertyRule("GanttChartFieldTable", params)
}
