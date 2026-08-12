import {
  definePropertyRule as defineWidePropertyRule,
  type ExactRuleParams as WideExactRuleParams,
} from "../../../commonObjects/ruleBuilder"
import type {
  MetadataItemRule,
  PropertyRule as WidePropertyRuleBase,
  YAMLPropertySource,
} from "@nkdk/runtime/rule-kit"
import type { TSchema } from "typebox"
import { getParentFromContext } from "../../../context/helpers"
import {
  configurationIndexExportFormSingletonLogicalAddress,
  type ConfigurationContextWithExportToXML,
} from "@nkdk/runtime"
import { TableRules } from "../../elements/table/rules"
import type { Table, TablePartialYAML } from "../../elements/table/types"
import { exportElementToJSONSchema } from "../../../ruleRuntime/formElement/toJSONSchema"
import { importSingleFormElementFromXMLToYAML } from "../../elements/ruleRuntime/fromXMLToYAML"
import { createSingletonElementYAMLToXMLNestedRule } from "../../elements/ruleRuntime/ruleFactory"
import {
  type SingletonNameStyle,
} from "../../../ruleRuntime/formElement/singletonName"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import type { ElementXML } from "../../../ruleRuntime/formElement/types"
import type { ExportToJSONSchemaFn } from "../../../ruleRuntime"
import { explicitElementNameStyle } from "../../explicitElementName"

export type GanttChartFieldTable = Table
export type GanttChartFieldTableYAML = TablePartialYAML

const GanttChartFieldTableRules = {
  ...TableRules,
  properties: {
    ...TableRules.properties,
    searchControl: {
      ...TableRules.properties.searchControl,
      toXML: (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) =>
        source.has("searchControl") || hasSingletonIdentity(context, "УправлениеПоиском"),
      preserveUnknownReferenceXML: false,
      evaluateWhenYAMLMissing: true,
    },
    searchStringRepresentation: {
      ...TableRules.properties.searchStringRepresentation,
      toXML: (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) =>
        source.has("searchStringRepresentation") || hasSingletonIdentity(context, "СтрокаПоиска"),
      preserveUnknownReferenceXML: false,
      evaluateWhenYAMLMissing: true,
    },
    viewStatusRepresentation: {
      ...TableRules.properties.viewStatusRepresentation,
      toXML: (source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) =>
        source.has("viewStatusRepresentation") || hasSingletonIdentity(context, "СостояниеПросмотра"),
      preserveUnknownReferenceXML: false,
      evaluateWhenYAMLMissing: true,
    },
  },
} as const satisfies MetadataItemRule

function hasSingletonIdentity(
  context: ConfigurationContextWithExportToXML | undefined,
  segment: string,
): boolean {
  if (context === undefined) return false
  const runtime = context.exportToXML.configurationIndex
  const address = configurationIndexExportFormSingletonLogicalAddress(context, segment)
  return runtime !== undefined && address !== undefined && runtime.identity("xmlId", address) !== undefined
}

const nameStyle: SingletonNameStyle = explicitElementNameStyle("GanttChartFieldTable", {
  canonicalSuffix: "Таблица",
  referenceSuffixes: ["Таблица", "Table"],
  canonicalNameMode: "ownerSuffix",
})

const getGeneratedName = (
  context: ConfigurationContextWithExportToXML,
  table: GanttChartFieldTable | undefined
): string => {
  const parent = getParentFromContext(context, ["GanttChartField"])
  const logicalAddress = context.exportToXML.configurationIndex?.logicalAddress
  const segments = logicalAddress?.split(".") ?? []
  const tableSegment = segments.lastIndexOf("Таблица")
  const indexedOwnerName = tableSegment > 0 ? segments[tableSegment - 1] : undefined
  const parentName = parent.name || table?.name || indexedOwnerName || "ДиаграммаГанта"
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
    explicitXMLName: true,
  })
}

export const metadataPropertyRule000 = definePropertyTypeRule("GanttChartFieldTable", "importFromXMLToYAML", ({ context, xml, ownerXmlName, traversal }) =>
  importSingleFormElementFromXMLToYAML({
    context,
    rule: GanttChartFieldTableRules,
    xml: xml as ElementXML | undefined,
    ownerXmlName,
    nameStyle,
    traversal,
  })
)
export const metadataPropertyRule001 = definePropertyTypeRule("GanttChartFieldTable", "nestedItemRule", { itemRule: GanttChartFieldTableRules })
export const metadataPropertyRule003 = definePropertyTypeRule(
  "GanttChartFieldTable",
  "yamlToXMLNestedRule",
  createSingletonElementYAMLToXMLNestedRule({
    elementRule: GanttChartFieldTableRules,
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
