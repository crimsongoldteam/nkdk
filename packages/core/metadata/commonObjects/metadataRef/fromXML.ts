import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinkXML } from "./types"

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (!data) return undefined

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: { "xr:Item"?: MetadataItemLinkXML | MetadataItemLinkXML[] } | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  const rawItems = data["xr:Item"]
  if (rawItems === undefined) return []

  const items = Array.isArray(rawItems) ? rawItems : [rawItems]
  return items.map((value) => importMetadataItemLinkFromXML(context, undefined, value)!)
}

registerTypeRule("MetadataItemLinks", "importFromXML", importMetadataItemLinksFromXML)
