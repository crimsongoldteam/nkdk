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

  if (typeof typedXML === "string") {
    // BasePropertyRule keeps typedXML generic; MetadataItemLink XML currently supports only xr:MDObjectRef.
    return { "#text": data, "_xsi:type": typedXML as "xr:MDObjectRef" }
  }

  return data
}

export function exportMetadataItemLinksToXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksXML | "" | undefined {
  if (!data) return undefined

  if (data.length === 0) return ""

  const itemRule = { type: "MetadataItemLink", typedXML: "xr:MDObjectRef" } satisfies PropertyRule

  return {
    "xr:Item": data.map((value) => exportMetadataItemLinkToXML(context, itemRule, value)!),
  }
}

registerTypeRule("MetadataItemLink", "exportToXML", exportMetadataItemLinkToXML)
registerTypeRule("MetadataItemLinks", "exportToXML", exportMetadataItemLinksToXML)
