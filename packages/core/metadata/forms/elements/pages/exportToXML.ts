import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPagesToXML = (context: Context, data: Pages | undefined): PagesXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    AssociatedTable: exportTableToXML(context, data.associatedTable),
    CurrentPagesState: data.currentPagesState,
    CurrentRowUse: data.currentRowUse,
    PagesRepresentation: data.pagesRepresentation,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "Pages", exportPagesToXML)
