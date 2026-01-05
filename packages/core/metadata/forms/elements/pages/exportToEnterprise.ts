import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPagesToEnterprise = (context: Context, data: Pages | undefined): PagesEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

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
  })
}

registerMetadata("ExportToEnterprise", "Pages", exportPagesToEnterprise)
