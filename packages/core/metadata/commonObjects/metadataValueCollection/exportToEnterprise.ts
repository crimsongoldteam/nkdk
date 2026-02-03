import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMedatataRefToEnterprise } from "../metadataValue/exportToEnterprise"
import { MetadataValueCollection, MetadataValueCollectionEnterprise } from "./types"

export const exportMetadataValueCollectionToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataValueCollection | undefined
): MetadataValueCollectionEnterprise | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => exportMedatataRefToEnterprise(item))
}
