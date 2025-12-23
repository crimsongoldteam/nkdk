import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/lib/metadata/forms/elements/childItems/importFromXML"
import { importCommandBarFromXML } from "~/lib/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { FormItemAddition, FormItemAdditionXML } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importFormItemAdditionFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: FormItemAdditionXML | undefined
): FormItemAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(configurationSettings, xml)!,
    elementType: FormElementType.FormItemAddition,

    childItems: importChildItemsFromXML(configurationSettings, xml.ChildItems),
    contextMenu: importCommandBarFromXML(configurationSettings, xml.ContextMenu),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedToolTip: importFormDecorationFromXML(configurationSettings, xml.ExtendedToolTip),
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    title: importI8nTextFromXML(configurationSettings, xml.Title),
    toolTip: importI8nTextFromXML(configurationSettings, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
  })
}

registerMetadata("ImportFromXML", "FormItemAddition", importFormItemAdditionFromXML)
