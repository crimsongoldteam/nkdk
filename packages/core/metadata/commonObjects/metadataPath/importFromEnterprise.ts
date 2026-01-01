import { Context } from "vm"
import { MetadataTypeFromEnterprise } from "./types"

const FALLBACK_FIELD_MAP: Record<string, string> = {
  Реквизит: "Attribute",
  ТабличнаяЧасть: "TabularSection",
  СтандартныйРеквизит: "StandardAttribute",
  Измерение: "Dimension",
  Ресурс: "Resource",
}

export const importMetadataTypeFromEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")
  if (parts.length === 1) {
    return MetadataTypeFromEnterprise[parts[0] as keyof typeof MetadataTypeFromEnterprise]
  }
  if (parts.length !== 2) return undefined
  const metadataType = MetadataTypeFromEnterprise[parts[0] as keyof typeof MetadataTypeFromEnterprise]
  return metadataType ? `${metadataType}.${parts[1]}` : undefined
}

export const importMetadataFieldFromEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")
  // if (parts.length < 2) return undefined

  // const mapItem = MetadataFieldsRulesFromEnterprise[parts[0]]
  // const metadataType =
  //   mapItem?.name || MetadataFieldTypeFromEnterprise[parts[0] as keyof typeof MetadataFieldTypeFromEnterprise]
  // if (!metadataType) return undefined

  // const result = [metadataType, parts[1]]
  // const fieldParts = convertFields(parts.slice(2), mapItem)
  // return fieldParts ? [...result, ...fieldParts].join(".") : result.join(".")
}
