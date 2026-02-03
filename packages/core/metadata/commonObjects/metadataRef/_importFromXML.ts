import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataItemLinkFromXML } from "./importFromXML"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function _importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function _importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinksXML | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(context, undefined, value)!)
}
