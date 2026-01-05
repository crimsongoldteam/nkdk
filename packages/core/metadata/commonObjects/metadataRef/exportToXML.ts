import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function exportMetadataItemLinkToXML(
  _context: ConfigurationContext,
  data: MetadataItemLink | undefined
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export function exportMetadataItemLinksToXML(
  context: ConfigurationContext,
  data: MetadataItemLinks | undefined
): MetadataItemLinksXML | undefined {
  if (!data) return undefined

  return data.map((value) => exportMetadataItemLinkToXML(context, value)!)
}
