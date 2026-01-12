import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromEnterprise } from "~/metadata/forms/elements/baseElement/importFromEnterprise"
import { importFormGroupPropsFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { Pages, PagesEnterprise } from "~/metadata/forms/elements/pages/types"
import { importTableFromEnterprise } from "~/metadata/forms/elements/table/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPagesFromEnterprise = <From extends PagesEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, Pages, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, Pages, Name>

  const baseElement = importBaseElementFromEnterprise(context, data, name)!
  const props = importFormGroupPropsFromEnterprise(context, data)

  const result: Pages = {
    ...baseElement,
    ...props,
    elementType: FormElementType.Pages,
    childItems: [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
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

  return result as ImportFromEnterpriseReturn<From, Pages, Name>
}

const importPagesEventsFromEnterprise = (
  data:
    | {
        ПриСменеСтраницы?: string
      }
    | undefined
):
  | {
      onCurrentPageChange?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    onCurrentPageChange?: string
  } = {}

  if (data.ПриСменеСтраницы !== undefined) result.onCurrentPageChange = data.ПриСменеСтраницы

  return Object.keys(result).length > 0 ? result : undefined
}

registerMetadata("ImportFromEnterprise", "Pages", importPagesFromEnterprise)
