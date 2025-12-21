import { ConfigurationSettings } from "../../configurationSettings/types"
import { PredefinedNameToEnterprise } from "../standardAttributeDescription/types"
import { AppliedTypeToEnterprise } from "../typeDescription/types"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

const FiledsMap = {
  Attribute: "Реквизит",
  TabularSection: "ТабличнаяЧасть",
  StandardAttribute: "СтандартныйРеквизит",
} as const

export const exportMetadataFieldToEnterprise = (
  data: MetadataField | undefined,
  _configurationSettings: ConfigurationSettings
): MetadataFieldEnterprise | undefined => {
  if (!data) return undefined

  const parts = data.split(".")

  const result: string[] = []

  // Преобразуем тип объекта (Catalog -> Справочник, Document -> Документ и т.д.)
  if (parts.length > 0) {
    const firstPart = parts[0]
    const enterpriseType = AppliedTypeToEnterprise[firstPart as keyof typeof AppliedTypeToEnterprise]
    // Если тип найден в маппинге - используем преобразованное значение, иначе оставляем как есть
    result.push(enterpriseType ?? firstPart)
  }

  // Добавляем имя объекта как есть
  if (parts.length > 1) {
    result.push(parts[1])
  }

  // Обрабатываем остальные части (Attribute/TabularSection/StandardAttribute и имена полей)
  for (let partIndex = 2; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex]

    // Проверяем, является ли это ключом в FiledsMap (Attribute, TabularSection, StandardAttribute)
    if (part in FiledsMap) {
      result.push(FiledsMap[part as keyof typeof FiledsMap])

      // Если это StandardAttribute, следующая часть должна быть преобразована через PredefinedNameToEnterprise
      if (part === "StandardAttribute" && partIndex + 1 < parts.length) {
        const nextPart = parts[partIndex + 1]
        if (nextPart in PredefinedNameToEnterprise) {
          result.push(PredefinedNameToEnterprise[nextPart as keyof typeof PredefinedNameToEnterprise])
          partIndex++ // Пропускаем следующую часть, так как мы её уже обработали
          continue
        }
      }
    } else {
      // Обычное имя поля - добавляем как есть
      result.push(part)
    }
  }

  return result.join(".")
}

export const exportMetadataFieldsToEnterprise = (
  data: MetadataFields | undefined,
  configurationSettings: ConfigurationSettings
): MetadataFieldsEnterprise | undefined => {
  if (!data) return undefined

  return data.map((item) => exportMetadataFieldToEnterprise(item, configurationSettings)!)
}
