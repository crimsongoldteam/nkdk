import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupPropsToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { exportPageToXML } from "~/metadata/forms/elements/page/exportToXML"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"

const exportPagesChildItemsToXML = (
  context: ConfigurationContext,
  data: Pages["childItems"]
): PagesXML["ChildItems"] => {
  if (!data || data.length === 0) return undefined
  return data
    .map((page) => exportPageToXML(context, page))
    .filter((page): page is NonNullable<typeof page> => page !== undefined)
}

export function exportPagesToXML<From extends Pages | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportFormGroupPropsToXML(context, data)

  const result: PagesXML = {
    ...baseFields,
  }

  const childItems = exportPagesChildItemsToXML(context, data.childItems)
  if (childItems !== undefined && childItems.length > 0) result.ChildItems = childItems

  const associatedTable = exportTableToXML(context, data.associatedTable)
  if (associatedTable !== undefined) result.AssociatedTable = associatedTable

  if (data.currentPagesState !== undefined) result.CurrentPagesState = data.currentPagesState

  if (data.currentRowUse !== undefined) result.CurrentRowUse = data.currentRowUse

  if (data.pagesRepresentation !== undefined) result.PagesRepresentation = data.pagesRepresentation

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Pages", exportPagesToXML)
