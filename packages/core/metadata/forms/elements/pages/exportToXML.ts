import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { Pages, PagesXML } from "~/packages/core/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/packages/core/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
