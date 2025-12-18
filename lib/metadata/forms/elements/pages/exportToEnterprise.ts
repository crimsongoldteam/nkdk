import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { Pages, PagesEnterprise } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToEnterprise } from "~/lib/metadata/forms/elements/table/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPagesToEnterprise = (
  data: Pages | undefined,
  configurationSettings: ConfigurationSettings
): PagesEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(
      data.currentRowUse,
      SE.CurrentRowUseToEnterprise,
      configurationSettings
    ),
    ИспользуемаяТаблица: exportTableToEnterprise(data.associatedTable, configurationSettings),
    ОтображениеСтраниц: exportSystemEnumerationToEnterprise(
      data.pagesRepresentation,
      SE.FormPagesRepresentationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ТекущееСостояниеСтраниц: exportSystemEnumerationToEnterprise(
      data.currentPagesState,
      SE.FormPagesStateToEnterprise,
      configurationSettings
    ),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "Pages", exportPagesToEnterprise)
