import { Context } from "../../context/types"
import { TypeLink, TypeLinkEnterprise } from "./types"

export const exportTypeLinkToEnterprise = (
  _configurationSettings: Context,
  data: TypeLink | undefined
): TypeLinkEnterprise | undefined => {
  if (!data) return undefined

  return "TODO"
}
