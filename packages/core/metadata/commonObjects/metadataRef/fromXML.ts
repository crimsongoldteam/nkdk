import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"
import { registerTypeRule } from "~/metadata/metadataFactory"

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataItemLinksXML | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  return data.map((value) => importMetadataItemLinkFromXML(context, undefined, value)!)
}

registerTypeRule("MetadataItemLinks", "importFromXML", importMetadataItemLinksFromXML)
