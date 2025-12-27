import { Context } from "../../context/types"
import { MetadataCommandGroup, MetadataCommandGroupXML } from "./types"

export const exportMetadataCommandGroupToXML = (
  _context: Context,
  data: MetadataCommandGroup | undefined
): MetadataCommandGroupXML | undefined => {
  if (!data) return undefined

  return {
    "#text": data,
    "xsi:type": "xr:MDObjectRef",
  }
}

export const exportMetadataCommandGroupsToXML = (
  context: Context,
  data: MetadataCommandGroup[] | undefined
): MetadataCommandGroupXML[] | undefined => {
  if (!data) return undefined

  return data.map((value) => exportMetadataCommandGroupToXML(context, value)!)
}
