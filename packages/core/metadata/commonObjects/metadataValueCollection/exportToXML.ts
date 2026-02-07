import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/exportToXML"
import { MetadataSimpleValueXML, MetadataValue } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const exportMetadataValueCollectionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data.map((item) => {
    const metadataValue: MetadataValue = {
      type: "objectRef",
      value: item,
    }
    return exportMetadataValueToXML(context, undefined, metadataValue)! as MetadataSimpleValueXML
  })

  return {
    "xr:Item": items,
  }
}

registerTypeRule("MetadataValueCollection", "exportToXML", exportMetadataValueCollectionToXML)
