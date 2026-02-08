import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportMedatataRefToEnterprise } from "../metadataValue/exportToEnterprise"
import { MetadataValueCollection, MetadataValueCollectionEnterprise } from "./types"

export const exportMetadataValueCollectionToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => exportMedatataRefToEnterprise(context, item))
}

registerTypeRule("MetadataValueCollection", "exportToEnterprise", exportMetadataValueCollectionToEnterprise)
