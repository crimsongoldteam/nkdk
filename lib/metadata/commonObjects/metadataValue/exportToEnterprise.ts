import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataValue, MetadataValueEnterprise } from "./types"

export const exportMetadataValueToEnterprise = (
  data: MetadataValue | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataValueEnterprise | undefined => {
  if (!data) return undefined

  return {
    Тип: data.type,
    Значение: data.value,
  }
}
