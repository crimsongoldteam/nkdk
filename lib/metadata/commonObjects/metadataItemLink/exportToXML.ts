import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function exportMetadataItemLinkToXML(
  data: MetadataItemLink | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export function exportMetadataItemLinksToXML(
  data: MetadataItemLinks | undefined,
  configurationSettings: ConfigurationSettings
): MetadataItemLinksXML | undefined {
  if (!data) return undefined

  return data.map((value) => exportMetadataItemLinkToXML(value, configurationSettings)!)
}
