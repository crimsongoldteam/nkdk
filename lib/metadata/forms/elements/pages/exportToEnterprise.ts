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
  configurationSettings: ConfigurationSettings, data: Pages | undefined
): PagesEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    ИспользованиеТекущейСтроки: exportSystemEnumerationToEnterprise(configurationSettings, data.currentRowUse, SE.CurrentRowUseToEnterprise),
    ИспользуемаяТаблица: exportTableToEnterprise(configurationSettings, data.associatedTable),
    ОтображениеСтраниц: exportSystemEnumerationToEnterprise(configurationSettings, data.pagesRepresentation, SE.FormPagesRepresentationToEnterprise),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ТекущееСостояниеСтраниц: exportSystemEnumerationToEnterprise(configurationSettings, data.currentPagesState, SE.FormPagesStateToEnterprise),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "Pages", exportPagesToEnterprise)
