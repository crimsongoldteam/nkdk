import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const exportMetadataValueCollectionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data.map((item) => {
    const metadataValue: any = {
      type: "objectRef",
      value: item,
    }
    return exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value: metadataValue,
    })! as MetadataPrimitiveValueXML
  })

  return {
    "xr:Item": items,
  }
}

registerTypeRule("MetadataValueCollection", "exportToXML", exportMetadataValueCollectionToXML)
