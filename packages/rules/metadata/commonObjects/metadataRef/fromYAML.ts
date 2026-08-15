import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { importMetadataObjectStringFromYAML } from "../metadataPath/fromYAML"
import type { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"
import { xmlAnomalyTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import { isMDObjectRefUuid } from "./brokenMDObjectRef"

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
  owner?: MetadataTargetOwner,
  isTransported?: (index: number) => boolean,
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data.flatMap((item, index) => {
    const transported = isTransported?.(index) === true
    const payload = transported && item.startsWith("!xml/reference")
      ? xmlAnomalyTagPayload("xml/reference", item)
      : item
    if (transported && isMDObjectRefUuid(payload)) {
      return [payload]
    }
    const imported = importMetadataItemLinkFromYAML(context, rule, item, owner)
    return imported === undefined ? [] : [imported]
  })
}

const importMetadataItemLinkFromYAMLProperty: ImportFromYAMLFunctionNew = (params) =>
  importMetadataItemLinkFromYAML(params.context, params.rule, params.value, params.owner)

export const importMetadataItemLinksFromYAMLProperty: ImportFromYAMLFunctionNew = (params) => {
  const yamlCollection = typeof params.rule.yaml === "string"
    ? params.yaml?.[params.rule.yaml]
    : undefined
  return importMetadataItemLinksFromYAML(
    params.context,
    params.rule,
    params.value,
    params.owner,
    (index) => yamlScalarTagAt(yamlCollection, index) === "xml/reference",
  )
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "importFromYAML", importMetadataItemLinkFromYAMLProperty)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLinks", "importFromYAML", importMetadataItemLinksFromYAMLProperty)
