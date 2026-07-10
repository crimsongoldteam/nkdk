import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataObjectRefValue, MetadataPrimitiveValueXML } from "../metadataValue/types"
import type { MetadataObjectRefCollection, MetadataObjectRefCollectionXML } from "./types"

export const exportMetadataObjectRefCollectionToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataObjectRefCollection | undefined
): MetadataObjectRefCollectionXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items = data.map((item) => {
    const metadataValue: MetadataObjectRefValue = {
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

registerTypeRule("MetadataObjectRefCollection", "exportToXML", exportMetadataObjectRefCollectionToXML)
