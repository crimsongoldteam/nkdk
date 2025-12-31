import { Context } from "vm"
import { StandartAttributeNameFromEnterprise } from "../standardAttributeDescription/types"
import { MetadataFieldTypeFromEnterprise, MetadataTypeFromEnterprise } from "./types"

export const importMetadataTypeFromEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length !== 2) return undefined

  const type = parts[0]
  const object = parts[1]

  const metadataType = MetadataTypeFromEnterprise[type as keyof typeof MetadataTypeFromEnterprise]
  if (!metadataType) return undefined

  return `${metadataType}.${object}`
}

const FieldsMapFromEnterprise = {
  Реквизит: "Attribute",
  ТабличнаяЧасть: "TabularSection",
  СтандартныйРеквизит: "StandardAttribute",
  Измерение: "Dimension",
  Ресурс: "Resource",
} as const

export const importMetadataFieldFromEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length < 2) return undefined

  const result: string[] = []

  // Преобразуем тип объекта (Справочник -> Catalog, Документ -> Document и т.д.)
  const firstPart = parts[0]
  const metadataType = MetadataFieldTypeFromEnterprise[firstPart as keyof typeof MetadataFieldTypeFromEnterprise]
  if (!metadataType) return undefined

  result.push(metadataType)

  // Добавляем имя объекта как есть
  result.push(parts[1])

  // Обрабатываем остальные части (Реквизит/ТабличнаяЧасть/СтандартныйРеквизит и имена полей)
  for (let partIndex = 2; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex]

    // Проверяем, является ли это ключом в FieldsMapFromEnterprise (Реквизит, ТабличнаяЧасть, СтандартныйРеквизит)
    if (part in FieldsMapFromEnterprise) {
      result.push(FieldsMapFromEnterprise[part as keyof typeof FieldsMapFromEnterprise])

      // Если это СтандартныйРеквизит, следующая часть должна быть преобразована через StandartAttributeNameFromEnterprise
      if (part === "СтандартныйРеквизит" && partIndex + 1 < parts.length) {
        const nextPart = parts[partIndex + 1]
        const xmlName = StandartAttributeNameFromEnterprise(nextPart)
        if (xmlName) {
          result.push(xmlName)
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
