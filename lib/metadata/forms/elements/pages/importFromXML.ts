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
  xml: PagesXML | undefined,
  configurationSettings: ConfigurationSettings
): Pages | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(xml, configurationSettings)!,
    elementType: FormElementType.Pages,

    associatedTable: importTableFromXML(xml.AssociatedTable, configurationSettings),
    currentPagesState: xml.CurrentPagesState,
    currentRowUse: xml.CurrentRowUse,
    pagesRepresentation: xml.PagesRepresentation,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    events: importEventsFromXML(xml.Events, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "Pages", importPagesFromXML)
