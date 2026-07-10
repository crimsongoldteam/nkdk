import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import type { ExportToYAMLFunctionNew } from "../../orchestration/property/fn"
import { ConfigurationContext } from "../../context/types"
import type { MetadataTargetOwner } from "../metadataTargets/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import type { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

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

  return data.map((item) => exportMetadataItemLinkToYAML(_context, rule, item, owner)!)
}

const exportMetadataItemLinkToYAMLProperty: ExportToYAMLFunctionNew = (params) =>
  exportMetadataItemLinkToYAML(params.context, params.rule, params.value, params.owner)

const exportMetadataItemLinksToYAMLProperty: ExportToYAMLFunctionNew = (params) =>
  exportMetadataItemLinksToYAML(params.context, params.rule, params.value, params.owner)

registerTypeRule("MetadataItemLink", "exportToYAML", exportMetadataItemLinkToYAMLProperty)
registerTypeRule("MetadataItemLinks", "exportToYAML", exportMetadataItemLinksToYAMLProperty)
