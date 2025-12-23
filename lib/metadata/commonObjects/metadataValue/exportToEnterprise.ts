import { Context } from "../../context/types"
import { MetadataValue, MetadataValueEnterprise } from "./types"

export const exportMetadataValueToEnterprise = (
  _context: Context,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  return {
    Тип: data.type,
    Значение: data.value,
  }
}
