import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPagesToXML = (
  data: Pages | undefined,
  configurationSettings: ConfigurationSettings
): PagesXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data, configurationSettings)!,

    AssociatedTable: exportTableToXML(data.associatedTable, configurationSettings),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "Pages", exportPagesToXML)
