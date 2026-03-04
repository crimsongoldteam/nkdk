import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataFieldStringToYAML } from "../metadataPath/toYAML"
import { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

export const exportMetadataItemLinkToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkYAML | undefined => {
  if (!data) return undefined

  return exportMetadataFieldStringToYAML(context, rule, data)
}

export const exportMetadataItemLinksToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataItemLinkToYAML(_context, undefined, item)!)
}

registerTypeRule("MetadataItemLinks", "exportToYAML", exportMetadataItemLinksToYAML)
