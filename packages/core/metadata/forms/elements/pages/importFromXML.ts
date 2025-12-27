import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Pages, PagesXML } from "~/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPagesFromXML = (context: Context, xml: PagesXML | undefined): Pages | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.Pages,

    associatedTable: importTableFromXML(context, xml.AssociatedTable),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML)
