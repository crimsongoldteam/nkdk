import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPagesFromXML = (xml: PagesXML | undefined): Pages | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml)!,
    elementType: FormElementType.Pages,

    associatedTable: importTableFromXML(xml.AssociatedTable),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.Pages, importPagesFromXML)
