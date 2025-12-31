import { Context } from "vm"
import { exportStandartAttributeNameToEnterprise } from "../standardAttributeDescription/exportToEnterprise"
import { StandartAttributeName } from "../standardAttributeDescription/types"
import { MetadataFieldType, MetadataFieldTypeToEnterprise, MetadataType, MetadataTypeToEnterprise } from "./types"

export const exportMetadataTypeToEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length !== 2) return undefined

  const type = parts[0] as MetadataType
  const object = parts[1]

  return getMetadataTypeName(type, object)
}

export const exportMetadataFieldToEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  const type = parts[0] as MetadataFieldType
  const object = parts[1]

  const metadataTypeName = getMetadataFieldType(type, object)
  if (!metadataTypeName) return undefined

  const restParts = parts.slice(2)

  if (type === "Catalog") return exportCatalogFieldToEnterprise(metadataTypeName, restParts)
  if (type === "Document") return exportDocumentFieldToEnterprise(metadataTypeName, restParts)
  if (type === "Enum") return exportEnumFieldToEnterprise(metadataTypeName, restParts)
}

const exportCatalogFieldToEnterprise = (objectName: string, parts: string[]): string | undefined => {
  const attribute = parts[0]

  if (attribute == "Attribute") return `${objectName}.Реквизит.${parts[1]}`

  if (attribute == "StandardAttribute")
    return `${objectName}.СтандартныйРеквизит.${exportStandartAttributeNameToEnterprise(parts[1] as StandartAttributeName)}`

  if (attribute == "TabularSection")
    return exportTabularSectionFieldToEnterprise(`${objectName}.ТабличнаяЧасть`, parts.slice(1))
  return objectName
}

const exportDocumentFieldToEnterprise = (objectName: string, parts: string[]): string | undefined => {
  const attribute = parts[0]

  if (attribute == "Attribute") return `${objectName}.Реквизит.${parts[1]}`

  if (attribute == "StandardAttribute")
    return `${objectName}.СтандартныйРеквизит.${exportStandartAttributeNameToEnterprise(parts[1] as StandartAttributeName)}`

  if (attribute == "TabularSection")
    return exportTabularSectionFieldToEnterprise(`${objectName}.ТабличнаяЧасть`, parts.slice(1))
  return objectName
}

const exportEnumFieldToEnterprise = (objectName: string, parts: string[]): string | undefined => {
  if (parts[0] == "EnumValue") return undefined

  if (!parts[1]) return undefined

  return `${objectName}.${parts[1]}`
}

const exportTabularSectionFieldToEnterprise = (objectName: string, parts: string[]): string | undefined => {
  const tabularSectionName = `${objectName}.${parts[0]}`

  const attribute = parts[1]

  if (!attribute) return tabularSectionName

  if (attribute == "Attribute") return `${tabularSectionName}.Реквизит.${parts[2]}`

  if (attribute == "StandardAttribute")
    return `${tabularSectionName}.СтандартныйРеквизит.${exportStandartAttributeNameToEnterprise(parts[2] as StandartAttributeName)}`

  return undefined
}

const getMetadataTypeName = (type: MetadataType, name: string): string | undefined => {
  const enterpriseType = MetadataTypeToEnterprise[type as keyof typeof MetadataTypeToEnterprise]
  if (!enterpriseType) return undefined

  return `${enterpriseType}.${name}`
}

const getMetadataFieldType = (type: MetadataFieldType, name: string): string | undefined => {
  const enterpriseType = MetadataFieldTypeToEnterprise[type as keyof typeof MetadataFieldTypeToEnterprise]
  if (!enterpriseType) return undefined

  return `${enterpriseType}.${name}`
}
