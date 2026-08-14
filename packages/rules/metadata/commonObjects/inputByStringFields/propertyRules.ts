import type { ExportToJSONSchemaFn, ExportToYAMLFunctionNew, ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importMetadataFieldsFromXML } from "../metadataField/fromXML"
import { importMetadataFieldsFromYAML } from "../metadataField/fromYAML"
import { exportMetadataFieldsToJSONSchema } from "../metadataField/toJSONSchema"
import { exportMetadataFieldsToXML } from "../metadataField/toXML"
import { exportMetadataFieldsToYAML } from "../metadataField/toYAML"
import type { InputByStringFieldsWidePropertyRule } from "./types"
import {
  collectStringTargetListForValidation,
  collectStringTargetReferenceList,
  validateStringTargetList,
} from "../metadataTargets/validationHandlers"

const importFromYAML: ImportFromYAMLFunctionNew = (params) => {
  const rule = params.rule as InputByStringFieldsWidePropertyRule
  const value = params.value ?? (typeof rule.implicitValueYAML === "function"
    ? rule.implicitValueYAML({
        context: params.context,
        name: params.name,
        operation: "importFromYAML",
        yaml: params.yaml,
      })
    : rule.implicitValueYAML)
  return importMetadataFieldsFromYAML(params.context, rule, value, params.owner)
}

const exportToYAML: ExportToYAMLFunctionNew = (params) =>
  exportMetadataFieldsToYAML(params.context, params.rule, params.value, params.owner)

const exportToJSONSchema: ExportToJSONSchemaFn = (params) =>
  exportMetadataFieldsToJSONSchema(params)

export const metadataPropertyRule000 = definePropertyTypeRule(
  "InputByStringFields",
  "importFromXML",
  importMetadataFieldsFromXML
)
export const metadataPropertyRule001 = definePropertyTypeRule(
  "InputByStringFields",
  "exportToXML",
  exportMetadataFieldsToXML
)
export const metadataPropertyRule002 = definePropertyTypeRule(
  "InputByStringFields",
  "importFromYAML",
  importFromYAML
)
export const metadataPropertyRule003 = definePropertyTypeRule(
  "InputByStringFields",
  "exportToYAML",
  exportToYAML
)
export const metadataPropertyRule004 = definePropertyTypeRule(
  "InputByStringFields",
  "exportToJSONSchema",
  exportToJSONSchema
)
export const metadataPropertyRule005 = definePropertyTypeRule(
  "InputByStringFields",
  "validateMetadataTarget",
  validateStringTargetList
)
export const metadataPropertyRule006 = definePropertyTypeRule(
  "InputByStringFields",
  "collectMetadataTargetReferences",
  collectStringTargetListForValidation
)
export const metadataPropertyRule007 = definePropertyTypeRule(
  "InputByStringFields",
  "structuralReferences",
  collectStringTargetReferenceList
)
export const metadataPropertyRule008 = definePropertyTypeRule(
  "InputByStringFields",
  "xmlImportPropertyBehavior",
  {
    presenceAffectsExport: true,
    explicitEmptyValue: () => [],
  }
)
