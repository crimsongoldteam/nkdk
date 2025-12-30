import { Context } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/exportToXML"
import { MetadataSimpleValueXML, MetadataValue } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const exportMetadataValueCollectionToXML = (
  context: Context,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data.map((item) => {
    const metadataValue: MetadataValue = {
      type: "objectRef",
      value: item,
    }
    return exportMetadataValueToXML(context, metadataValue)! as MetadataSimpleValueXML
  })

  return {
    "xr:Item": items,
  }
}
