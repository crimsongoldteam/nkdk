import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

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
