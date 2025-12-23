import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
