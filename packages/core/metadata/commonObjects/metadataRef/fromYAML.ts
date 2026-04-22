import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { importMetadataFieldStringFromYAML } from "../metadataPath/fromYAML"
import { MetadataItemLink, MetadataItemLinkYAML, MetadataItemLinks, MetadataItemLinksYAML } from "./types"

export const importMetadataItemLinkFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkYAML | undefined
): MetadataItemLink | undefined => {
  if (!data) return undefined

  return importMetadataFieldStringFromYAML(context, undefined, data)
}

export const importMetadataItemLinksFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinksYAML | undefined
): MetadataItemLinks | undefined => {
  if (!data) return undefined

  return data
    .map((item) => importMetadataItemLinkFromYAML(context, undefined, item)!)
    .filter((item): item is MetadataItemLink => item !== undefined)
}

registerTypeRule("MetadataItemLink", "importFromYAML", importMetadataItemLinkFromYAML)
registerTypeRule("MetadataItemLinks", "importFromYAML", importMetadataItemLinksFromYAML)
