import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { exportMetadataFieldStringToYAML as exportMetadataFieldToYAMLPath } from "../metadataPath/toYAML"
import type { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const exportMetadataFieldsToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFields | undefined,
  owner?: MetadataTargetOwner
): MetadataFieldsYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToYAML(context, rule, item, owner)!)
}

export const exportMetadataFieldToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataField | undefined,
  owner?: MetadataTargetOwner
): MetadataFieldYAML | undefined => {
  if (!data) return undefined

  return exportMetadataFieldToYAMLPath(context, rule, data, owner)
}

const exportMetadataFieldToYAMLProperty: ExportToYAMLFunctionNew = (params) => params.value

const exportMetadataFieldsToYAMLProperty: ExportToYAMLFunctionNew = (params) => params.value

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataField", "exportToYAML", exportMetadataFieldToYAMLProperty)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataFields", "exportToYAML", exportMetadataFieldsToYAMLProperty)
