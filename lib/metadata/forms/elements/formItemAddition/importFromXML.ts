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
  xml: FormItemAdditionXML | undefined,
  configurationSettings: ConfigurationSettings
): FormItemAddition | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(xml, configurationSettings)!,
    elementType: FormElementType.FormItemAddition,

    childItems: importChildItemsFromXML(xml.ChildItems, configurationSettings),
    contextMenu: importCommandBarFromXML(xml.ContextMenu, configurationSettings),
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    extendedToolTip: importFormDecorationFromXML(xml.ExtendedToolTip, configurationSettings),
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    title: importI8nTextFromXML(xml.Title, configurationSettings),
    toolTip: importI8nTextFromXML(xml.ToolTip, configurationSettings),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
  })
}

registerMetadata("ImportFromXML", "FormItemAddition", importFormItemAdditionFromXML)
