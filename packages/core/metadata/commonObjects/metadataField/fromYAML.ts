import type { PropertyRule } from "../../ruleRuntime/property/types"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ImportFromYAMLFunctionNew } from "../../ruleRuntime/property/fn"
import { ConfigurationContext } from "../../context/types"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { importMetadataFieldStringFromYAML as importMetadataFieldFromYAMLPath } from "../metadataPath/fromYAML"
import type { MetadataField, MetadataFieldYAML, MetadataFields, MetadataFieldsYAML } from "./types"

export const importMetadataFieldsFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFieldsYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromYAML(context, rule, item, owner)!)
}

export const importMetadataFieldFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataFieldYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataField | undefined => {
  if (!data) return undefined

  return importMetadataFieldFromYAMLPath(context, rule, data, owner)
}

const importMetadataFieldFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataFieldFromYAML(params.context, params.rule, params.value, params.owner)

const importMetadataFieldsFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataFieldsFromYAML(params.context, params.rule, params.value, params.owner)

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataField", "importFromYAML", importMetadataFieldFromYAMLProperty)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataFields", "importFromYAML", importMetadataFieldsFromYAMLProperty)
