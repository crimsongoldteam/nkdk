import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { Pages, PagesEnterprise } from "~/metadata/forms/elements/pages/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { importTableFromEnterprise } from "~/metadata/forms/elements/table/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importPagesEventsFromEnterprise = (
  data: {
    ПриСменеСтраницы?: string
  } | undefined
): {
  onCurrentPageChange?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onCurrentPageChange?: string
  } = {}

  if (data.ПриСменеСтраницы !== undefined) result.onCurrentPageChange = data.ПриСменеСтраницы

  return Object.keys(result).length > 0 ? result : undefined
}

export const importPagesFromEnterprise = (
  context: ConfigurationContext,
  data: PagesEnterprise | undefined,
  name: string
): Pages | undefined => {
  if (!data) return undefined

  const baseFields = importFormGroupFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: Pages = {
    elementType: FormElementType.Pages,
    ...restFields,
  }

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const associatedTable = importTableFromEnterprise(context, data.ИспользуемаяТаблица, name + ".ИспользуемаяТаблица")
  if (associatedTable !== undefined) result.associatedTable = associatedTable

  const pagesRepresentation = importSystemEnumerationFromEnterprise<SE.FormPagesRepresentation>(
    context,
    data.ОтображениеСтраниц,
    SE.FormPagesRepresentationFromEnterprise
  )
  if (pagesRepresentation !== undefined) result.pagesRepresentation = pagesRepresentation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const currentPagesState = importSystemEnumerationFromEnterprise<SE.FormPagesState>(
    context,
    data.ТекущееСостояниеСтраниц,
    SE.FormPagesStateFromEnterprise
  )
  if (currentPagesState !== undefined) result.currentPagesState = currentPagesState

  const events = importPagesEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "Pages", importPagesFromEnterprise)
