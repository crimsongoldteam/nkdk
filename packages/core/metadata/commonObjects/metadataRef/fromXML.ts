import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinkXML } from "./types"

interface MetadataItemLinksXMLInput {
  "xr:Item"?: MetadataItemLinkXML | MetadataItemLinkXML[]
  "xr:Object"?: MetadataItemLinkXML | MetadataItemLinkXML[]
}

export function importMetadataItemLinkFromXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinkXML | undefined
): MetadataItemLink | undefined {
  if (data === undefined) return undefined

  if (typeof data === "string") return data

  return data["#text"]
}

export function importMetadataItemLinksFromXML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinksXMLInput | undefined
): MetadataItemLinks | undefined {
  if (!data) return undefined

  const itemTag = rule?.metadataItemLinksXMLItem ?? "xr:Item"
  const values = data as Record<string, MetadataItemLinkXML | MetadataItemLinkXML[] | undefined>
  const rawItems = values[itemTag] ?? data["xr:Item"] ?? data["xr:Object"]
  if (rawItems === undefined) return []

  const items = Array.isArray(rawItems) ? rawItems : [rawItems]
  return items.map((value) => (value === undefined ? "" : importMetadataItemLinkFromXML(context, undefined, value)!))
}

registerTypeRule("MetadataItemLink", "importFromXML", importMetadataItemLinkFromXML)
registerTypeRule("MetadataItemLinks", "importFromXML", importMetadataItemLinksFromXML)
