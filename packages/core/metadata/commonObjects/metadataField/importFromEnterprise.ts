import { Context } from "../../context/types"
import { PredefinedNameFromEnterprise } from "../standardAttributeDescription/types"
import { AppliedTypeFromEnterprise } from "../typeDescription/types"
import { MetadataField, MetadataFieldEnterprise, MetadataFields, MetadataFieldsEnterprise } from "./types"

const FieldsMapFromEnterprise = {
  Реквизит: "Attribute",
  ТабличнаяЧасть: "TabularSection",
  СтандартныйРеквизит: "StandardAttribute",
  Измерение: "Dimension",
  Ресурс: "Resource",
} as const

export const importMetadataFieldFromEnterprise = (
  _context: Context,
  data: MetadataFieldEnterprise | undefined
): MetadataField | undefined => {
  if (!data) return undefined

  const parts = data.split(".")

  const result: string[] = []

  // Преобразуем тип объекта (Справочник -> Catalog, Документ -> Document и т.д.)
  if (parts.length > 0) {
    const firstPart = parts[0]
    const xmlType = AppliedTypeFromEnterprise(firstPart)
    // Если тип найден в маппинге - используем преобразованное значение, иначе оставляем как есть
    result.push(xmlType ?? firstPart)
  }

  // Добавляем имя объекта как есть
  if (parts.length > 1) {
    result.push(parts[1])
  }

  // Обрабатываем остальные части (Реквизит/ТабличнаяЧасть/СтандартныйРеквизит и имена полей)
  for (let partIndex = 2; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex]

    // Проверяем, является ли это ключом в FieldsMapFromEnterprise (Реквизит, ТабличнаяЧасть, СтандартныйРеквизит)
    if (part in FieldsMapFromEnterprise) {
      result.push(FieldsMapFromEnterprise[part as keyof typeof FieldsMapFromEnterprise])

      // Если это СтандартныйРеквизит, следующая часть должна быть преобразована через PredefinedNameFromEnterprise
      if (part === "СтандартныйРеквизит" && partIndex + 1 < parts.length) {
        const nextPart = parts[partIndex + 1]
        const xmlName = PredefinedNameFromEnterprise(nextPart)
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

export const importMetadataFieldsFromEnterprise = (
  context: Context,
  data: MetadataFieldsEnterprise | undefined
): MetadataFields | undefined => {
  if (!data) return undefined

  return data.map((item) => importMetadataFieldFromEnterprise(context, item)!)
}
