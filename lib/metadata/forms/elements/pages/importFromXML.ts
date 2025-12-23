import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Pages, PagesXML } from "~/lib/metadata/forms/elements/pages/types"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPagesFromXML = (
  configurationSettings: ConfigurationSettings, xml: PagesXML | undefined
): Pages | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(configurationSettings, xml)!,
    elementType: FormElementType.Pages,

    associatedTable: importTableFromXML(configurationSettings, xml.AssociatedTable),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML)
