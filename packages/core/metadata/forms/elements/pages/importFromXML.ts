import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { importPageFromXML } from "~/metadata/forms/elements/page/importFromXML"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

const importPagesChildItemsFromXML = (
  context: ConfigurationContext,
  xml: PagesXML["ChildItems"]
): Pages["childItems"] => {
  if (!xml || xml.length === 0) return undefined
  return xml
    .map((pageXML) => importPageFromXML(context, pageXML))
    .filter((page): page is NonNullable<typeof page> => page !== undefined)
}

export const importPagesFromXML = (context: ConfigurationContext, xml: PagesXML | undefined): Pages | undefined => {
  if (!xml) return undefined

  const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: Pages = {
    elementType: FormElementType.Pages,
    ...restFields,
    childItems: [],
  }

  const childItems = importPagesChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  const associatedTable = importTableFromXML(context, xml.AssociatedTable)
  if (associatedTable !== undefined) result.associatedTable = associatedTable

  if (xml.CurrentPagesState !== undefined) result.currentPagesState = xml.CurrentPagesState

  if (xml.CurrentRowUse !== undefined) result.currentRowUse = xml.CurrentRowUse

  if (xml.PagesRepresentation !== undefined) result.pagesRepresentation = xml.PagesRepresentation

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML)
