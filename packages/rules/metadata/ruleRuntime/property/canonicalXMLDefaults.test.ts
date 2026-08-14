import { describe, expect, it } from "vitest"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { MetadataCommonModuleRules } from "../../appliedObjects/metadataCommonModule/rules"
import { MetadataConfigurationRules } from "../../appliedObjects/configuration/rules"
import { ChartOfAccountsPredefinedItemRules } from "../../appliedObjects/metadataChartOfAccounts/predefined/rules"
import { ChartOfCalculationTypesPredefinedItemRules } from "../../appliedObjects/metadataChartOfCalculationTypes/predefinedRules"
import { ExchangePlanContentItemRules } from "../../commonObjects/exchangePlanContent/rules"
import {
  MetadataWebServiceOperationRules,
  MetadataWebServiceParameterRules,
} from "../../commonObjects/metadataWebServiceOperation/rules"
import { MetadataHTTPServiceMethodRules } from "../../commonObjects/metadataHTTPServiceMethod/rules"
import { MetadataBusinessProcessRules } from "../../appliedObjects/metadataBusinessProcess/rules"
import { MetadataFilterCriterionRules } from "../../appliedObjects/metadataFilterCriterion/rules"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { MetadataStyleItemRules } from "../../appliedObjects/metadataStyleItem/rules"
import { MetadataExternalDataSourceTableRules } from "../../commonObjects/metadataExternalDataSourceTable/rules"
import { MetadataEnumerationValueRules } from "../../appliedObjects/metadataEnumeration/rules"
import { MetadataIntegrationServiceChannelRules } from "../../commonObjects/metadataIntegrationServiceChannel/rules"
import { MetadataExternalDataSourceCubeRules } from "../../commonObjects/metadataExternalDataSourceCube/rules"

const property = (rule: { properties: Record<string, PropertyRule> }, key: string): PropertyRule => rule.properties[key]

describe("canonical XML defaults", () => {
  it.each([
    ["Global", property(MetadataCommonModuleRules, "global"), false, false],
    ["ClientManagedApplication", property(MetadataCommonModuleRules, "clientManagedApplication"), false, false],
    ["Server", property(MetadataCommonModuleRules, "server"), true, true],
    ["ExternalConnection", property(MetadataCommonModuleRules, "externalConnection"), false, false],
    ["ClientOrdinaryApplication", property(MetadataCommonModuleRules, "clientOrdinaryApplication"), false, false],
    ["ServerCall", property(MetadataCommonModuleRules, "serverCall"), false, false],
    ["Privileged", property(MetadataCommonModuleRules, "privileged"), false, undefined],
    ["Nillable parameter", property(MetadataWebServiceParameterRules, "nillable"), false, undefined],
    ["TransferDirection", property(MetadataWebServiceParameterRules, "transferDirection"), "In", undefined],
    ["Nillable operation", property(MetadataWebServiceOperationRules, "nillable"), false, undefined],
    ["Transactioned", property(MetadataWebServiceOperationRules, "transactioned"), false, undefined],
    ["DataLockControlMode", property(MetadataWebServiceOperationRules, "dataLockControlMode"), "Managed", undefined],
    ["AutoRecord", property(ExchangePlanContentItemRules, "autoRecord"), "Allow", undefined],
    ["OffBalance", property(ChartOfAccountsPredefinedItemRules, "offBalance"), false, undefined],
    ["ActionPeriodIsBase", property(ChartOfCalculationTypesPredefinedItemRules, "actionPeriodIsBase"), false, undefined],
    ["CompatibilityMode", property(MetadataConfigurationRules, "compatibilityMode"), "Version8_3_27", undefined],
    [
      "ConfigurationExtensionCompatibilityMode",
      property(MetadataConfigurationRules, "configurationExtensionCompatibilityMode"),
      "Version8_3_27",
      undefined,
    ],
  ])("declares %s in YAML and XML rules", (_name, rule, expected, adoptedExpected) => {
    expect(rule.implicitValueYAML).toBe(expected)
    expect(rule.defaultValueXML).toBe(expected)
    if (adoptedExpected !== undefined) expect(rule.defaultValueAdoptedXML).toBe(adoptedExpected)
  })

  it("restores the required GET method while keeping it explicit in YAML", () => {
    const rule = property(MetadataHTTPServiceMethodRules, "httpMethod")
    expect(rule.defaultValueXML).toBe("GET")
    expect(rule.noImplicitValueYAML).toBe(true)
  })

  it.each([
    ["EnumerationValue", property(MetadataEnumerationValueRules, "comment")],
    ["IntegrationServiceChannel", property(MetadataIntegrationServiceChannelRules, "comment")],
    ["ExternalDataSourceCube", property(MetadataExternalDataSourceCubeRules, "comment")],
    ["ExternalDataSourceTable", property(MetadataExternalDataSourceTableRules, "comment")],
    ["HTTPServiceMethod", property(MetadataHTTPServiceMethodRules, "comment")],
  ])("restores the required empty Comment for %s", (_name, rule) => {
    expect(rule.defaultValueXMLRaw).toBe("")
    expect(rule.defaultValueAdoptedXML).toBe("")
  })

  it.each([
    [MetadataBusinessProcessRules, "checkUnique", "numberType"],
    [MetadataFilterCriterionRules, "useStandardCommands", "commands"],
    [MetadataCatalogRules, "codeAllowedLength", "codeLength"],
    [MetadataCatalogRules, "hierarchical", "codeType"],
    [MetadataCatalogRules, "hierarchyType", "codeType"],
    [MetadataStyleItemRules, "type", "value"],
  ] as const)("emits an adopted dependent default only for a changed %s", (itemRule, propertyKey, dependencyKey) => {
    const rule = property(itemRule, propertyKey)
    const context = {
      exportToXML: {
        configurationIndex: { logicalAddress: `${itemRule.itemType}.Объект` },
        xmlDefaultVariantByLogicalAddress: { [`${itemRule.itemType}.Объект`]: "adopted" },
      },
    }
    const source = (keys: readonly string[]) => ({
      has: (key: string) => keys.includes(key),
      raw: (key: string) => key === "codeType" && keys.includes(key) ? "Строка" : undefined,
      yamlKey: () => undefined,
    })
    const toXML = rule.toXML
    if (typeof toXML !== "function") throw new Error(`Для ${propertyKey} не задано условие toXML`)

    expect(toXML(source([]), context as never)).toBe(false)
    expect(toXML(source([dependencyKey]), context as never)).toBe(true)
    expect(toXML(source([propertyKey]), context as never)).toBe(true)
  })

  it("restores empty KeyFields for a state-only marker", () => {
    const rule = property(MetadataExternalDataSourceTableRules, "keyFields")
    const toXML = rule.toXML
    if (typeof toXML !== "function") throw new Error("Для keyFields не задано условие toXML")
    const context = {
      exportToXML: {
        configurationIndex: { logicalAddress: "MetadataExternalDataSourceTable.Таблица" },
        xmlDefaultVariantByLogicalAddress: { "MetadataExternalDataSourceTable.Таблица": "adopted" },
      },
    }
    const source = (value: unknown) => ({
      has: () => true,
      raw: () => value,
      yamlKey: () => "КлючевыеПоля",
    })

    expect(toXML(source(null), context as never)).toBe(false)
    expect(toXML(source({}), context as never)).toBe(true)
    expect(toXML(source([]), context as never)).toBe(true)
  })
})
