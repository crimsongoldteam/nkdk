import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupPropsToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import {
  Pages,
  PagesPartialEnterprise,
  PagesTypedEnterprise,
} from "~/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPagesTypedToEnterprise = (
  context: ConfigurationContext,
  data: Pages | undefined
): PagesTypedEnterprise | undefined => {
  if (!data) return undefined

  const props = exportPagesPropsToEnterprise(context, data)

  const result: PagesTypedEnterprise = {
    Тип: "Страницы",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportPagesPartialToEnterprise = (
  context: ConfigurationContext,
  data: Pages
): PagesPartialEnterprise => {
  const props = exportPagesPropsToEnterprise(context, data)

  const result: PagesPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

const exportPagesPropsToEnterprise = (
  context: ConfigurationContext,
  data: Pages
): PagesPartialEnterprise => {
  const baseFields = exportFormGroupPropsToEnterprise(context, data)

  const result: PagesPartialEnterprise = {
    ...baseFields,
  }

  const currentRowUse = exportSystemEnumerationToEnterprise(context, data.currentRowUse, SE.CurrentRowUseToEnterprise)
  if (currentRowUse !== undefined) result.ИспользованиеТекущейСтроки = currentRowUse

  const associatedTable = exportTableToEnterprise(context, data.associatedTable)
  if (associatedTable !== undefined) result.ИспользуемаяТаблица = associatedTable

  const pagesRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.pagesRepresentation,
    SE.FormPagesRepresentationToEnterprise
  )
  if (pagesRepresentation !== undefined) result.ОтображениеСтраниц = pagesRepresentation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const currentPagesState = exportSystemEnumerationToEnterprise(
    context,
    data.currentPagesState,
    SE.FormPagesStateToEnterprise
  )
  if (currentPagesState !== undefined) result.ТекущееСостояниеСтраниц = currentPagesState

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "Pages", exportPagesPartialToEnterprise)
