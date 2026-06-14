import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataObjectStringToYAML } from "../metadataPath/toYAML"
import { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

const toRoleYAML = (rule: { roleReferenceYAML?: "full" | "name" } | undefined, value: string): string => {
  if (rule?.roleReferenceYAML !== "name") return value
  return value.startsWith("Role.") ? value.slice("Role.".length) : value
}

export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkYAML | undefined => {
  if (data === undefined) return undefined

  const roleAwareValue = toRoleYAML(rule, data)
  if (roleAwareValue !== data) return roleAwareValue

  try {
    return exportMetadataObjectStringToYAML(context, rule, roleAwareValue)
  } catch (error) {
    if (rule?.roleReferenceYAML === "name") return roleAwareValue
    throw error
  }
}

export const exportMetadataItemLinksToYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToYAML(_context, rule, item)!)
}

registerTypeRule("MetadataItemLink", "exportToYAML", exportMetadataItemLinkToYAML)
registerTypeRule("MetadataItemLinks", "exportToYAML", exportMetadataItemLinksToYAML)
