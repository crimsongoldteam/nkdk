import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/_importFromXML"
import { MetadataSimpleValueXML } from "../metadataValue/types"
import { MetadataValueCollection, MetadataValueCollectionXML } from "./types"

export const _importMetadataValueCollectionFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollectionXML | undefined
): MetadataValueCollection | undefined => {
  if (!data) return undefined

  const xrItems = data["xr:Item"]

  const items = Array.isArray(xrItems) ? xrItems : [xrItems]

  const result: MetadataValueCollection = items.map((item: MetadataSimpleValueXML) => {
    const metadataValue = importMetadataValueFromXML(context, _rule, item)!
    return String(metadataValue.value)
  })

  return result
}
