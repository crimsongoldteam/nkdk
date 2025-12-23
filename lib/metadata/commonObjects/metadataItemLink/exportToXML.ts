import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function exportMetadataItemLinkToXML(
  _configurationSettings: ConfigurationSettings,
  data: MetadataItemLink | undefined
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export function exportMetadataItemLinksToXML(
  configurationSettings: ConfigurationSettings,
  data: MetadataItemLinks | undefined
): MetadataItemLinksXML | undefined {
  if (!data) return undefined

  return data.map((value) => exportMetadataItemLinkToXML(configurationSettings, value)!)
}
