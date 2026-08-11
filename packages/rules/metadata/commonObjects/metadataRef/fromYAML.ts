import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import type { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

export const importMetadataItemLinkFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinkYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLink | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  return importMetadataObjectStringFromYAML(context, rule, data, owner)
}

export const importMetadataItemLinksFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinksYAML | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importMetadataItemLinkFromYAML(context, rule, item, owner)!)
    .filter((item): item is MetadataItemLink => item !== undefined)
}

const importMetadataItemLinkFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataItemLinkFromYAML(params.context, params.rule, params.value, params.owner)

const importMetadataItemLinksFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataItemLinksFromYAML(params.context, params.rule, params.value, params.owner)

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "importFromYAML", importMetadataItemLinkFromYAMLProperty)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLinks", "importFromYAML", importMetadataItemLinksFromYAMLProperty)
