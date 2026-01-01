import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesToEnterprise, MetadataType, MetadataTypeToEnterprise } from "./types"

export const exportMetadataTypeToEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length !== 2) return undefined

  const type = parts[0] as MetadataType
  const object = parts[1]

  return getMetadataTypeName(type, object)
}

export const exportMetadataFieldToEnterprise = (_context: Context, name: string): string | undefined => {
  return convertPath(MetadataFieldsRulesToEnterprise, name)
}

const getMetadataTypeName = (type: MetadataType, name: string): string | undefined => {
  const enterpriseType = MetadataTypeToEnterprise[type as keyof typeof MetadataTypeToEnterprise]
  if (!enterpriseType) return undefined

  return `${enterpriseType}.${name}`
}
