import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataValue, MetadataValueEnterprise } from "./types"

export const exportMetadataValueToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: MetadataValue | undefined
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  return {
    Тип: data.type,
    Значение: data.value,
  }
}
