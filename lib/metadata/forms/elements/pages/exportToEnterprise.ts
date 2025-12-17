import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPagesToEnterprise = (
  data: Pages | undefined,
  configurationSettings: ConfigurationSettings
): PagesEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable, configurationSettings),
    ТекущееСостояниеСтраниц: exportSystemEnumerationToEnterprise(
      data.currentPagesState,
      SE.FormPagesStateToEnterprise,
      configurationSettings
    ),
    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise,
      configurationSettings
    ),
    ОтображениеСтраниц: exportSystemEnumerationToEnterprise(
      data.pagesRepresentation,
      SE.FormPagesRepresentationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Events: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.Pages, exportPagesToEnterprise)
