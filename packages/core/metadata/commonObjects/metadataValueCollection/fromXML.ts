import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const importMetadataValueCollectionFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionXML | undefined
): MetadataValueCollection | undefined => {
  if (!data) return undefined

  const xrItems = data["xr:Item"]

  const items = Array.isArray(xrItems) ? xrItems : [xrItems]

  const result: MetadataValueCollection = items.map((item: MetadataPrimitiveValueXML) => {
    const metadataValue = importMetadataValueFromXML({ context, rule: undefined, value: item })!
    return String(metadataValue.value)
  })

  return result
}

registerTypeRule("MetadataValueCollection", "importFromXML", importMetadataValueCollectionFromXML)
