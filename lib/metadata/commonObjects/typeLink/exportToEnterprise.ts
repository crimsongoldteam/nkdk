import { ConfigurationSettings } from "../../configurationSettings/types"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const exportTypeLinkToEnterprise = (
  _configurationSettings: ConfigurationSettings,
  data: TypeLink | undefined
): TypeLinkEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
