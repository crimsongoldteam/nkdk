import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

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
