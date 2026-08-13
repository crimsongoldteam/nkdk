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

const property = (rule: { properties: Record<string, PropertyRule> }, key: string): PropertyRule => rule.properties[key]

describe("canonical XML defaults", () => {
  it.each([
    ["Global", property(MetadataCommonModuleRules, "global"), false],
    ["ClientManagedApplication", property(MetadataCommonModuleRules, "clientManagedApplication"), false],
    ["Server", property(MetadataCommonModuleRules, "server"), true],
    ["ExternalConnection", property(MetadataCommonModuleRules, "externalConnection"), false],
    ["ClientOrdinaryApplication", property(MetadataCommonModuleRules, "clientOrdinaryApplication"), false],
    ["ServerCall", property(MetadataCommonModuleRules, "serverCall"), false],
    ["Privileged", property(MetadataCommonModuleRules, "privileged"), false],
    ["ReturnValuesReuse", property(MetadataCommonModuleRules, "returnValuesReuse"), "DontUse"],
    ["Nillable parameter", property(MetadataWebServiceParameterRules, "nillable"), false],
    ["TransferDirection", property(MetadataWebServiceParameterRules, "transferDirection"), "In"],
    ["Nillable operation", property(MetadataWebServiceOperationRules, "nillable"), false],
    ["Transactioned", property(MetadataWebServiceOperationRules, "transactioned"), false],
    ["DataLockControlMode", property(MetadataWebServiceOperationRules, "dataLockControlMode"), "Managed"],
    ["AutoRecord", property(ExchangePlanContentItemRules, "autoRecord"), "Allow"],
    ["OffBalance", property(ChartOfAccountsPredefinedItemRules, "offBalance"), false],
    ["ActionPeriodIsBase", property(ChartOfCalculationTypesPredefinedItemRules, "actionPeriodIsBase"), false],
    ["CompatibilityMode", property(MetadataConfigurationRules, "compatibilityMode"), "Version8_3_27"],
    [
      "ConfigurationExtensionCompatibilityMode",
      property(MetadataConfigurationRules, "configurationExtensionCompatibilityMode"),
      "Version8_3_27",
    ],
  ])("declares %s in YAML and XML rules", (_name, rule, expected) => {
    expect(rule.implicitValueYAML).toBe(expected)
    expect(rule.defaultValueXML).toBe(expected)
  })

  it("restores the required GET method while keeping it explicit in YAML", () => {
    const rule = property(MetadataHTTPServiceMethodRules, "httpMethod")
    expect(rule.defaultValueXML).toBe("GET")
    expect(rule.noImplicitValueYAML).toBe(true)
  })
})
