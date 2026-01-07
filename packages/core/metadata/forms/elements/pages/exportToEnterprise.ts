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
  if (!baseFields) return undefined

  return {
    ...baseFields,

    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      context,
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise
    ),
    ИспользуемаяТаблица: exportTableToEnterprise(context, data.associatedTable),
    ОтображениеСтраниц: exportSystemEnumerationToEnterprise(
      context,
      data.pagesRepresentation,
      SE.FormPagesRepresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ТекущееСостояниеСтраниц: exportSystemEnumerationToEnterprise(
      context,
      data.currentPagesState,
      SE.FormPagesStateToEnterprise
    ),
    События: exportEventsToEnterprise(context, data.events),
  }
}

registerMetadata("ExportToEnterprise", "Pages", exportPagesToEnterprise)
