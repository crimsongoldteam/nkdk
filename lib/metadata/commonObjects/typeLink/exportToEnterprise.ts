import { ConfigurationSettings } from "../../configurationSettings/types"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const exportTypeLinkToEnterprise = (
  data: TypeLink | undefined,
  _configurationSettings: ConfigurationSettings
): TypeLinkEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
