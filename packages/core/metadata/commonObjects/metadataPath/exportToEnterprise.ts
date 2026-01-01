import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesToEnterprise, MetadataTypesRulesToEnterprise } from "./types"

export const exportMetadataTypeToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataTypesRulesToEnterprise, name)
}

export const exportMetadataFieldToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}
