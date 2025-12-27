import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/packages/core/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/packages/core/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/packages/core/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

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
