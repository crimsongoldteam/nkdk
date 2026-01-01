import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesFromEnterprise, MetadataTypesRulesFromEnterprise } from "./types"

export const importMetadataTypeFromEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataTypesRulesFromEnterprise, name)
}

export const importMetadataFieldFromEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesFromEnterprise, name)
}
