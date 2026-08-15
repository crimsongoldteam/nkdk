import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { ConfigurationContext } from "@nkdk/runtime"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import type { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"
import { isMDObjectRefUuid } from "./brokenMDObjectRef"

export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinkYAML | undefined => {
  if (data === undefined) return undefined
  if (data === "") return ""

  return exportMetadataObjectStringToYAML(context, rule, data, owner)
}

export const exportMetadataItemLinksToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined,
  owner?: MetadataTargetOwner
): MetadataItemLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((item) =>
    isMDObjectRefUuid(item)
      ? item
      : exportMetadataItemLinkToYAML(_context, rule, item, owner)!,
  )
}

const exportMetadataItemLinkToYAMLProperty: ExportToYAMLFunctionNew = (params) => params.value

const exportMetadataItemLinksToYAMLProperty: ExportToYAMLFunctionNew = (params) => params.value

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "exportToYAML", exportMetadataItemLinkToYAMLProperty)
export const metadataPropertyRule001 = definePropertyTypeRule("MetadataItemLinks", "exportToYAML", exportMetadataItemLinksToYAMLProperty)
