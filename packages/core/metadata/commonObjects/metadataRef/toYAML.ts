import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToYAML } from "../metadataPath/toYAML"
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
  if (!data) return undefined

  return exportMetadataFieldStringToYAML(context, rule, toRoleYAML(rule, data))
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
