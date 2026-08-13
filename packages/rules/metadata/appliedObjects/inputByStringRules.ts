import type {
  LocalYamlValueValidationContribution,
  LocalYamlValueValidationParams,
  MetadataImportedYamlFinalizer,
  MetadataItemRule,
  PropertyRule,
} from "@nkdk/runtime/rule-kit"
import * as SystemEnumerations from "../systemEnumerations/types"
import { inputByStringDefaultYAML, effectiveInputByStringLength, orderedEqual } from "../commonObjects/inputByStringFields/defaultValue"
import type { InputByStringFieldsWidePropertyRule } from "../commonObjects/inputByStringFields/types"
import type { NumberPropertyRule } from "../commonObjects/number/types"
import { diagnosticAtYamlPath } from "../validation/yamlLocations"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { MetadataBusinessProcessRules } from "./metadataBusinessProcess/rules"
import { MetadataCatalogRules } from "./metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "./metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "./metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "./metadataChartOfCharacteristicTypes/rules"
import { MetadataDocumentRules } from "./metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "./metadataDocumentNumerator/rules"
import { MetadataExchangePlanRules } from "./metadataExchangePlan/rules"
import { MetadataTaskRules } from "./metadataTask/rules"

type YAMLRoot = Record<string, unknown>

export function createInputByStringFinalizer(itemRule: MetadataItemRule): MetadataImportedYamlFinalizer {
  const [, inputRule] = inputByStringProperty(itemRule)

  return {
    requiresFinalization: (yaml) => {
      const root = yamlRoot(yaml)
      return root !== undefined && inputRule.yaml !== undefined && inputRule.yaml in root
    },
    finalize: ({ yaml }) => {
      const root = yamlRoot(yaml)
      if (root === undefined || inputRule.yaml === undefined) return
      const actual = root[inputRule.yaml]
      if (!Array.isArray(actual)) return

      const computed = inputByStringDefaultYAML(inputRule, root)
      if (orderedEqual(actual, computed)) delete root[inputRule.yaml]
    },
  }
}

export function createAppliedObjectValidator(
  itemRule: MetadataItemRule
): LocalYamlValueValidationContribution["validate"] {
  return (params) => {
    const root = yamlRoot(params.value)
    if (root === undefined) return []

    return [
      ...validateInputByString(itemRule, root, params),
      ...validateConditionalMaximums(itemRule, root, params),
    ]
  }
}

const validatedRules = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataExchangePlanRules,
  MetadataChartOfCharacteristicTypesRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataBusinessProcessRules,
  MetadataTaskRules,
] as const satisfies readonly MetadataItemRule[]

export const appliedObjectInputByStringRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: validatedRules
    .filter(hasInputByStringProperty)
    .map((itemRule) => ({
      kind: "importedYamlFinalizer" as const,
      itemType: itemRule.itemType,
      finalizer: createInputByStringFinalizer(itemRule),
    })),
  validation: validatedRules
    .filter(hasAppliedObjectValidation)
    .map((itemRule) => ({
      kind: "localYamlValue" as const,
      propertyType: itemRule.itemType,
      validate: createAppliedObjectValidator(itemRule),
    })),
})

function validateInputByString(
  itemRule: MetadataItemRule,
  root: YAMLRoot,
  params: LocalYamlValueValidationParams
) {
  const entry = optionalInputByStringProperty(itemRule)
  if (entry === undefined) return []
  const [, rule] = entry
  if (rule.yaml === undefined) return []
  const value = root[rule.yaml]
  if (!Array.isArray(value)) return []

  const diagnostics = []
  const computed = inputByStringDefaultYAML(rule, root)
  if (orderedEqual(value, computed)) {
    diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.yamlPath, rule.yaml],
      severity: "error",
      source: "structure",
      message: `${rule.yaml} совпадает с вычисляемым значением и не должен задаваться явно`,
    }))
  }

  for (const [index, selected] of value.entries()) {
    const standardField = rule.standardFields.find(({ yaml }) => yaml === selected)
    if (standardField === undefined || effectiveInputByStringLength(standardField, root) !== 0) continue
    diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.yamlPath, rule.yaml, index],
      severity: "error",
      source: "structure",
      message: `${standardField.yaml} недоступен при ${standardField.length.yaml}: 0`,
    }))
  }

  return diagnostics
}

function validateConditionalMaximums(
  itemRule: MetadataItemRule,
  root: YAMLRoot,
  params: LocalYamlValueValidationParams
) {
  const diagnostics = []
  for (const property of Object.values(itemRule.properties)) {
    if (!isConditionalNumberRule(property) || property.maximumWhen === undefined || property.yaml === undefined) continue
    const value = effectiveStaticYAMLValue(property, root)
    if (typeof value !== "number" || value <= property.maximumWhen.maximum) continue

    const selector = itemRule.properties[property.maximumWhen.propertyKey]
    if (selector === undefined || selector.yaml === undefined) continue
    const selectorValue = effectiveStaticYAMLValue(selector, root)
    if (!matchesModelValue(selector, selectorValue, property.maximumWhen.equals)) continue

    diagnostics.push(diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed,
      path: [...params.yamlPath, property.yaml],
      severity: "error",
      source: "structure",
      message: `${property.yaml} не должна превышать ${property.maximumWhen.maximum} при ${selector.yaml}: ${displayYAMLValue(selector, property.maximumWhen.equals)}`,
    }))
  }
  return diagnostics
}

function inputByStringProperty(itemRule: MetadataItemRule): [string, InputByStringFieldsWidePropertyRule] {
  const entries = Object.entries(itemRule.properties).filter(
    (entry): entry is [string, InputByStringFieldsWidePropertyRule] => entry[1].type === "InputByStringFields"
  )
  if (entries.length !== 1) {
    throw new Error(`${itemRule.itemType}: ожидалось ровно одно свойство InputByStringFields`)
  }
  return entries[0]!
}

function optionalInputByStringProperty(
  itemRule: MetadataItemRule
): [string, InputByStringFieldsWidePropertyRule] | undefined {
  const entries = Object.entries(itemRule.properties).filter(
    (entry): entry is [string, InputByStringFieldsWidePropertyRule] => entry[1].type === "InputByStringFields"
  )
  if (entries.length > 1) throw new Error(`${itemRule.itemType}: найдено несколько свойств InputByStringFields`)
  return entries[0]
}

function hasInputByStringProperty(itemRule: MetadataItemRule): boolean {
  return optionalInputByStringProperty(itemRule) !== undefined
}

function hasAppliedObjectValidation(itemRule: MetadataItemRule): boolean {
  return hasInputByStringProperty(itemRule) || Object.values(itemRule.properties).some(isConditionalNumberRule)
}

function isConditionalNumberRule(rule: PropertyRule): rule is NumberPropertyRule {
  return rule.type === "number" && "maximumWhen" in rule
}

function effectiveStaticYAMLValue(rule: PropertyRule, root: YAMLRoot): unknown {
  if (rule.yaml !== undefined && rule.yaml in root) return root[rule.yaml]
  return typeof rule.implicitValueYAML === "function" ? undefined : rule.implicitValueYAML
}

function matchesModelValue(rule: PropertyRule, yamlValue: unknown, modelValue: string): boolean {
  if (yamlValue === modelValue) return true
  if (rule.type !== "SystemEnumeration" || typeof yamlValue !== "string") return false
  return systemEnumerationTable(`${rule.typeSE}FromYAML`)[yamlValue] === modelValue
}

function displayYAMLValue(rule: PropertyRule, modelValue: string): string {
  if (rule.type !== "SystemEnumeration") return modelValue
  return systemEnumerationTable(`${rule.typeSE}ToYAML`)[modelValue] ?? modelValue
}

function systemEnumerationTable(name: string): Readonly<Record<string, string>> {
  const tables = SystemEnumerations as unknown as Readonly<Record<string, Readonly<Record<string, string>>>>
  return tables[name] ?? {}
}

function yamlRoot(value: unknown): YAMLRoot | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as YAMLRoot
    : undefined
}
