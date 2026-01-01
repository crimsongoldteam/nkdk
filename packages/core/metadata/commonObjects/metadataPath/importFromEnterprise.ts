import { Context } from "vm"
import { convertPath } from "./helper"
import { MetadataFieldsRulesFromEnterprise, MetadataTypeFromEnterprise } from "./types"

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
  return convertPath(MetadataFieldsRulesFromEnterprise, name)
}
