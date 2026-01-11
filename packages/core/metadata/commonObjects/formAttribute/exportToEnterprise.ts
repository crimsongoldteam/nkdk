import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import {
  FormAttribute,
  FormAttributeEnterprise,
  FormAttributes,
  FormAttributesEnterprise,
} from "~/metadata/commonObjects/formAttribute/types"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { TypeDescriptionEnterprise } from "~/metadata/commonObjects/typeDescription/types"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { extractDifferentSynonymPart } from "../../helpers/synonymHelpers"
import { I8nTextEnterprise } from "../i8nText/types"

export const exportFormAttributesToEnterprise = (
  context: ConfigurationContext,
  data: FormAttributes | undefined
): FormAttributesEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((value: FormAttribute) => [value.name, exportFormAttributeToEnterprise(context, value)!])
  )
}

const exportFormAttributeToEnterprise = (
  context: ConfigurationContext,
  data: FormAttribute
): FormAttributeEnterprise | TypeDescriptionEnterprise => {
  const type = exportTypeDescriptionToEnterprise(context, data.valueType)

  const filteredTitle = data.title ? extractDifferentSynonymPart(context, data.title, data.name) : undefined
  const title = exportI8nTextToEnterprise(context, filteredTitle)

  if (canUseShortFormat(data, title)) {
    return type!
  }

  const result: FormAttributeEnterprise = {}

  if (type !== undefined) result.Тип = type

  if (title !== undefined) result.Заголовок = title

  const mainAttribute = exportBooleanToEnterprise(context, data.mainAttribute)
  if (mainAttribute !== undefined) result.ОсновнойРеквизит = mainAttribute

  const storedData = exportBooleanToEnterprise(context, data.storedData)
  if (storedData !== undefined) result.СохраняемыеДанные = storedData

  const use = exportUserVisibleToEnterprise(context, data.use)
  if (use) {
    Object.assign(result, use)
  }

  return result as FormAttributeEnterprise
}

const canUseShortFormat = (data: FormAttribute, title: I8nTextEnterprise | undefined): boolean => {
  if (title !== undefined) return false
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => value !== undefined && !["name", "id", "valueType", "title"].includes(key)
    )
  )
  return Object.keys(filteredData).length === 0
}
