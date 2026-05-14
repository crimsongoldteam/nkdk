import { registerTypeRule } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

export function exportMetadataItemLinkToXML(
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  const typedXML = rule?.typedXML

  if (typedXML === "xr:MDObjectRef") {
    return { "#text": data, "_xsi:type": typedXML }
  }

  return data
}

export function exportMetadataItemLinksToXML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksXML | "" | undefined {
  if (!data) return undefined

  if (data.length === 0) return ""

  const itemTag = rule?.metadataItemLinksXMLItem ?? "xr:Item"
  const itemRule = {
    type: "MetadataItemLink",
    ...(itemTag === "xr:Item" ? { typedXML: "xr:MDObjectRef" } : {}),
  } satisfies PropertyRule

  return {
    [itemTag]: data.map((value) => exportMetadataItemLinkToXML(context, itemRule, value)!),
  }
}

registerTypeRule("MetadataItemLink", "exportToXML", exportMetadataItemLinkToXML)
registerTypeRule("MetadataItemLinks", "exportToXML", exportMetadataItemLinksToXML)
