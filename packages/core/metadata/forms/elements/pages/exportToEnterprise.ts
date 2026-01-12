import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPagesToEnterprise = (
  context: ConfigurationContext,
  data: Pages | undefined
): PagesEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToEnterprise(context, data)

  const result: PagesEnterprise = {
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

registerMetadata("ExportPartialToEnterprise", "Pages", exportPagesToEnterprise)
