import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MetadataSimpleValueXML } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const importMetadataValueCollectionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionXML | undefined
): MetadataValueCollection | undefined => {
  if (!data) return undefined

  const xrItems = data["xr:Item"]

  const items = Array.isArray(xrItems) ? xrItems : [xrItems]

  const result: MetadataValueCollection = items.map((item: MetadataSimpleValueXML) => {
    const metadataValue = importMetadataValueFromXML(context, undefined, item)!
    return String(metadataValue.value)
  })

  return result
}

registerTypeRule("MetadataValueCollection", "importFromXML", importMetadataValueCollectionFromXML)
