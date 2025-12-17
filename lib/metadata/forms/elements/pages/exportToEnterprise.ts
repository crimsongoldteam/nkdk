import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPagesToEnterprise = (data: Pages | undefined): PagesEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable),
    ТекущееСостояниеСтраниц: exportSystemEnumerationToEnterprise(data.currentPagesState, SE.FormPagesStateToEnterprise),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(data.currentRowUse, SE.CurrentRowUseToEnterprise),
    ОтображениеСтраниц: exportSystemEnumerationToEnterprise(
      data.pagesRepresentation,
      SE.FormPagesRepresentationToEnterprise
    ),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.Pages, exportPagesToEnterprise)
