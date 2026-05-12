import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration"
import { ConfigurationContext } from "../../context/types"
import { MetadataItemLink, MetadataItemLinks, MetadataItemLinksXML, MetadataItemLinkXML } from "./types"

type MetadataItemLinkPropertyRule = PropertyRule & { typedXML?: unknown }

export function exportMetadataItemLinkToXML(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLink | undefined
): MetadataItemLinkXML | undefined {
  if (!data) return undefined

  const typedXML = (_rule as MetadataItemLinkPropertyRule | undefined)?.typedXML

  if (typeof typedXML === "string") return { "#text": data, "_xsi:type": typedXML as "xr:MDObjectRef" }

  return data
}

export function exportMetadataItemLinksToXML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataItemLinks | undefined
): MetadataItemLinksXML | "" | undefined {
  if (!data) return undefined

  if (data.length === 0) return ""

  const itemRule = { type: "MetadataItemLink", typedXML: "xr:MDObjectRef" } as PropertyRule

  return {
    "xr:Item": data.map((value) => exportMetadataItemLinkToXML(context, itemRule, value)!),
  }
}

registerTypeRule("MetadataItemLink", "exportToXML", exportMetadataItemLinkToXML)
registerTypeRule("MetadataItemLinks", "exportToXML", exportMetadataItemLinksToXML)
