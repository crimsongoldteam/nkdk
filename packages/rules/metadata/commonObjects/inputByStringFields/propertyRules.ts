import type { ExportToJSONSchemaFn, ExportToYAMLFunctionNew, ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { importMetadataFieldsFromXML } from "../metadataField/fromXML"
import { importMetadataFieldsFromYAML } from "../metadataField/fromYAML"
import { exportMetadataFieldsToJSONSchema } from "../metadataField/toJSONSchema"
import { exportMetadataFieldsToXML } from "../metadataField/toXML"
import { exportMetadataFieldsToYAML } from "../metadataField/toYAML"

const importFromYAML: ImportFromYAMLFunctionNew = (params) =>
  importMetadataFieldsFromYAML(params.context, params.rule, params.value, params.owner)

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
