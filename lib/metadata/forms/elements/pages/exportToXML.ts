import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportPagesToXML = (data: Pages | undefined): PagesXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    AssociatedTable: exportTableToXML(data.associatedTable),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.Pages, exportPagesToXML)
