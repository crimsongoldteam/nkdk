import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const exportMetadataCommandGroupToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataCommandGroupsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataCommandGroup[] | undefined
): MetadataCommandGroupXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataCommandGroupToXML(context, undefined, value)!)
}
