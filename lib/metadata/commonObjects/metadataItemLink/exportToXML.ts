import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function exportMetadataItemLinkToXML(data: MetadataItemLink | undefined): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export function exportMetadataItemLinksToXML(data: MetadataItemLinks | undefined): MetadataItemLinksXML | undefined {
  if (!data) return undefined

  return data.map((value) => exportMetadataItemLinkToXML(value)!)
}
