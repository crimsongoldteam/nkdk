import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPagesFromXML = (context: ConfigurationContext, xml: PagesXML | undefined): Pages | undefined => {
  if (!xml) return undefined

  return {
    const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  return {
    ...baseFields,,
    elementType: FormElementType.Pages,

    associatedTable: importTableFromXML(context, xml.AssociatedTable),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    events: importEventsFromXML(context, xml.Events),  }
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML)
