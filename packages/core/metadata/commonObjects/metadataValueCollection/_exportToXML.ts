import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _exportMetadataValueToXML } from "../metadataValue/_exportToXML"
import { MetadataSimpleValueXML, MetadataValue } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const _exportMetadataValueCollectionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data.map((item) => {
    const metadataValue: MetadataValue = {
      type: "objectRef",
      value: item,
    }
    return _exportMetadataValueToXML(context, _rule, metadataValue)! as MetadataSimpleValueXML
  })

  return {
    "xr:Item": items,
  }
}
